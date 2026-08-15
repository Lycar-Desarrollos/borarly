
/**
 * @fileOverview Service functions for managing products and categories using Firestore.
 */

import { db } from '@/lib/firebase';
import type { Product, Category, CategoryLevel } from '@/lib/types';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  setDoc, 
  updateDoc,
  deleteDoc,
  Timestamp,
  writeBatch,
  limit,
  QueryConstraint, 
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { getExchangeRate, getVatRate } from './settingsService';
import { getProductosSyscomMerida, getProductoSyscomById, getCategoriasSyscom, getSucursalesSyscom, getRelacionadosSyscom } from './syscom';
const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';


// Helper to convert Firestore doc data to Product type, handling Timestamps
async function docToProduct(docSnapshot: any): Promise<Product> {
  const data = docSnapshot.data();
  let imageUrls = data.imageUrls || [];
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    imageUrls = ["https://placehold.co/600x400.png"]; 
  } else if (imageUrls.some((url: any) => typeof url !== 'string')) {
    imageUrls = ["https://placehold.co/600x400.png"]; 
  }

  // Price calculation logic is now centralized here for consistency
  let finalPrice = 0;
  const costPrice = Number(data.costPrice) || 0;
  const profitMargin = Number(data.profitMargin) || 0;
  const currency = data.currency || 'MXN';
  
  if (costPrice > 0) {
      const [exchangeRate, vatRate] = await Promise.all([getExchangeRate(), getVatRate()]);
      const costInMxn = currency === 'USD' 
          ? costPrice * exchangeRate
          : costPrice;
      const priceBeforeTax = costInMxn * (1 + profitMargin);
      finalPrice = priceBeforeTax * (1 + vatRate);
  } else {
      // Fallback for older products that might still have a 'price' field
      finalPrice = typeof data.price === 'number' ? data.price : 0;
  }
  
  return {
    id: docSnapshot.id, // The document ID is the SKU
    name: data.name || '',
    description: data.description || '',
    price: parseFloat(finalPrice.toFixed(2)),
    currency: currency,
    costPrice: costPrice,
    profitMargin: profitMargin,
    imageUrls: imageUrls, 
    category: data.category || '', 
    categoryId: data.categoryId || undefined,
    stock: typeof data.stock === 'number' ? data.stock : 0,
    brand: data.brand || '',
    line: data.line || '',
    series: data.series || '',
    isFeatured: !!data.isFeatured,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date(0).toISOString()),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date(0).toISOString()),
  };
}

// Helper to convert Firestore doc data to Category type
function docToCategory(docSnapshot: any): Category {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    name: data.name || '',
    description: data.description || '',
    isFeatured: !!data.isFeatured,
    featuredImageUrl: data.featuredImageUrl || '',
    parentId: data.parentId || null,
    level: data.level || 1, // Default to 1 if not set
    isVisible: data.isVisible !== false, // Default to true
    alias: data.alias || '',
    showInNavbar: data.showInNavbar !== undefined ? data.showInNavbar : true,
  };
}

export async function getProducts(
  categoryFilter?: string,
  searchTerm?: string,
  resultLimit?: number,
  marca?: string,
  orden?: string,
  sucursal?: string,
  nuevo?: boolean,
  cajaAbierta?: boolean,
  enExistencia?: boolean,
  oferta?: boolean,
  outlet?: boolean
): Promise<Product[]> {
  try {
    // Syscom hace el filtrado por nosotros usando sus IDs
    let products = await getProductosSyscomMerida(
      categoryFilter, 
      searchTerm, 
      marca, 
      orden, 
      sucursal, 
      nuevo, 
      cajaAbierta, 
      enExistencia,
      oferta,
      outlet
    );

    // Mantenemos el límite post-procesado (Syscom pagina de 15 en 15 o similar, pero por si acaso acortamos visualmente)
    if (resultLimit && products.length > resultLimit) {
        return products.slice(0, resultLimit);
    }
    
    return products;
  } catch (error) {
    console.error("Error fetching Syscom products:", error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> { 
  try {
    return await getProductoSyscomById(id);
  } catch (error) {
    console.error("Error fetching Syscom product by SKU (ID):", id, error);
    return null;
  }
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
    if (!ids || ids.length === 0) {
        return [];
    }
    
    try {
        const fetchPromises = ids.map(id => getProductoSyscomById(id));
        const results = await Promise.all(fetchPromises);
        return results.filter((p): p is Product => p !== null);
    } catch (error) {
        console.error("Error fetching Syscom products by IDs:", error);
        return [];
    }
}

/**
 * Obtiene accesorios y productos verdaderamente relacionados al producto actual:
 * 1. Consulta el endpoint oficial de Syscom (/productos/{id}/relacionados)
 * 2. Si se requieren más complementos, consulta la subcategoría específica más profunda
 * 3. Si aún faltan, realiza una búsqueda inteligente por marca y palabras clave del producto
 */
export async function getRelatedProductsForProduct(product: Product): Promise<Product[]> {
  try {
    let results: Product[] = [];

    // 1. Accesorios e ingeniería oficial de Syscom
    try {
      const directRelacionados = await getRelacionadosSyscom(product.id);
      if (Array.isArray(directRelacionados)) {
        results = directRelacionados.filter(p => p && p.id && p.id !== product.id);
      }
    } catch (e) {
      console.warn("Error buscando relacionados directos Syscom:", e);
    }

    // 2. Si no hay suficientes, buscar en la subcategoría específica más profunda
    if (results.length < 8) {
      try {
        const catId = product.categorias_adicionales && product.categorias_adicionales.length > 0
          ? String(product.categorias_adicionales[product.categorias_adicionales.length - 1].id)
          : (product.categoryId ? String(product.categoryId) : undefined);

        if (catId) {
          const categoryProducts = await getProductosSyscomMerida(catId, undefined, undefined, undefined, undefined, undefined, undefined, true);
          if (Array.isArray(categoryProducts)) {
            const filtered = categoryProducts.filter(p => p && p.id && p.id !== product.id && !results.some(r => r.id === p.id));
            results = [...results, ...filtered];
          }
        }
      } catch (e) {
        console.warn("Error buscando productos por subcategoría:", e);
      }
    }

    // 3. Si aún faltan, buscar por palabras clave principales del nombre del producto
    if (results.length < 4 && product.name) {
      try {
        const keywords = product.name
          .replace(/[^\w\s]/gi, ' ')
          .split(/\s+/)
          .filter(w => w.length > 3 && !['para', 'con', 'las', 'los', 'del', 'por'].includes(w.toLowerCase()))
          .slice(0, 2)
          .join(' ');

        if (keywords) {
          const keywordProducts = await getProductosSyscomMerida(undefined, keywords, undefined, undefined, undefined, undefined, undefined, true);
          if (Array.isArray(keywordProducts)) {
            const filtered = keywordProducts.filter(p => p && p.id && p.id !== product.id && !results.some(r => r.id === p.id));
            results = [...results, ...filtered];
          }
        }
      } catch (e) {
        console.warn("Error buscando productos por palabras clave:", e);
      }
    }

    // 4. Fallback por Marca
    if (results.length < 4 && product.brand) {
      try {
        const brandProducts = await getProductosSyscomMerida(undefined, undefined, product.brand, undefined, undefined, undefined, undefined, true);
        if (Array.isArray(brandProducts)) {
          const filtered = brandProducts.filter(p => p && p.id && p.id !== product.id && !results.some(r => r.id === p.id));
          results = [...results, ...filtered];
        }
      } catch (e) {
        console.warn("Error buscando productos por marca:", e);
      }
    }

    return results.slice(0, 8);
  } catch (error) {
    console.error("Error global fetching intelligent related products:", error);
    return [];
  }
}


export async function getCategories(): Promise<Category[]> {
  try {
     const syscomCategories = await getCategoriasSyscom();
     
     // Obtener overrides locales de Firebase (imágenes, isFeatured, isVisible, alias)
     const categoriesRef = collection(db, CATEGORIES_COLLECTION);
     const snapshot = await getDocs(categoriesRef);
     const localOverrides: Record<string, Partial<Category>> = {};
     
     snapshot.forEach(doc => {
       localOverrides[doc.id] = doc.data() as Partial<Category>;
     });
 
     // Mezclar Syscom con configuraciones locales
     return syscomCategories.map(cat => {
       const override = localOverrides[cat.id];
       if (override) {
         return {
           ...cat,
           featuredImageUrl: override.featuredImageUrl || cat.featuredImageUrl,
           isFeatured: override.isFeatured !== undefined ? override.isFeatured : cat.isFeatured,
           description: override.description || cat.description,
           isVisible: override.isVisible !== undefined ? override.isVisible : true,
           alias: override.alias || '',
           showInNavbar: override.showInNavbar !== undefined ? override.showInNavbar : true,
         };
       }
       return {
         ...cat,
         isVisible: true,
         alias: '',
         showInNavbar: true,
       };
     });
     
  } catch (error) {
     console.error("Error fetching Syscom categories:", error);
     return [];
  }
}

export async function getSucursales(): Promise<{id: string, nombre: string}[]> {
  try {
     return await getSucursalesSyscom();
  } catch (error) {
     console.error("Error fetching Syscom branches:", error);
     return [];
  }
}

export async function getFeaturedCategories(): Promise<Category[]> {
  try {
     const cats = await getCategoriasSyscom();
     return cats.slice(0, 5); // Destacamos las primeras 5 de Syscom
  } catch (error) {
     return [];
  }
}

export async function addProduct(productData: Omit<Product, 'createdAt' | 'updatedAt' | 'priceInCurrency'>): Promise<Product> {
  if (!productData.id || productData.id.trim() === '') {
    throw new Error("SKU (id) is required to add a product.");
  }
  const sku = productData.id.trim();
  const productDocRef = doc(db, PRODUCTS_COLLECTION, sku);

  try {
    const docSnap = await getDoc(productDocRef);
    if (docSnap.exists()) {
      throw new Error(`Product with SKU ${sku} already exists.`);
    }

    const { id, ...dataToSet } = productData; // Exclude 'id' from data written to Firestore fields
    const newProductDataForFirestore = {
      ...dataToSet,
      name: productData.name,
      description: productData.description,
      // price is calculated on read, so we don't store it
      currency: productData.currency,
      costPrice: Number(productData.costPrice) || 0,
      profitMargin: Number(productData.profitMargin) || 0,
      imageUrls: Array.isArray(productData.imageUrls) && productData.imageUrls.length > 0 ? productData.imageUrls : ["https://placehold.co/600x400.png"],
      category: productData.category,
      stock: productData.stock,
      brand: productData.brand,
      line: productData.line,
      series: productData.series,
      isFeatured: !!productData.isFeatured,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Remove price from the object to be saved.
    delete (newProductDataForFirestore as any).price;

    await setDoc(productDocRef, newProductDataForFirestore);
    
    const newDoc = await getDoc(productDocRef);
    return await docToProduct(newDoc);

  } catch (error) {
    console.error("Error adding product with SKU:", sku, error);
    throw error;
  }
}

export async function updateProduct(
  currentSku: string, 
  productDataWithNewSku: Omit<Product, 'createdAt' | 'updatedAt' | 'priceInCurrency'> & { isFeatured: boolean }
): Promise<Product | null> {
  const newSku = productDataWithNewSku.id.trim();
  const { id, ...dataToUpdate } = productDataWithNewSku;

  const productDataForFirestore = {
    ...dataToUpdate,
    name: dataToUpdate.name,
    description: dataToUpdate.description,
    currency: dataToUpdate.currency,
    costPrice: Number(dataToUpdate.costPrice) || 0,
    profitMargin: Number(dataToUpdate.profitMargin) || 0,
    imageUrls: Array.isArray(dataToUpdate.imageUrls) && dataToUpdate.imageUrls.length > 0 ? dataToUpdate.imageUrls : ["https://placehold.co/600x400.png"],
    category: dataToUpdate.category,
    stock: dataToUpdate.stock,
    brand: dataToUpdate.brand,
    line: dataToUpdate.line,
    series: dataToUpdate.series,
    isFeatured: !!dataToUpdate.isFeatured, // Ensure isFeatured is always a boolean
    updatedAt: serverTimestamp(),
  };

  delete (productDataForFirestore as any).price;

  if (currentSku === newSku) {
    // SKU hasn't changed, just update the document
    try {
      const productDocRef = doc(db, PRODUCTS_COLLECTION, currentSku);
      await updateDoc(productDocRef, productDataForFirestore);
      const updatedDocSnap = await getDoc(productDocRef);
      return updatedDocSnap.exists() ? await docToProduct(updatedDocSnap) : null;
    } catch (error) {
      console.error("Error updating product with SKU:", currentSku, error);
      throw error;
    }
  } else {
    // SKU has changed: create new, delete old, in a batch
    const batch = writeBatch(db);
    const oldProductDocRef = doc(db, PRODUCTS_COLLECTION, currentSku);
    const newProductDocRef = doc(db, PRODUCTS_COLLECTION, newSku);

    try {
      // Check if new SKU already exists
      const newSkuDocSnap = await getDoc(newProductDocRef);
      if (newSkuDocSnap.exists()) {
        throw new Error(`The new SKU "${newSku}" already exists. SKUs must be unique.`);
      }

      // Fetch existing data from old SKU doc to merge createdAt if it exists
      const oldDocSnap = await getDoc(oldProductDocRef);
      let finalDataForNewDoc;
      if (oldDocSnap.exists()) {
        const oldData = oldDocSnap.data();
        finalDataForNewDoc = {
          ...productDataForFirestore,
          createdAt: oldData.createdAt || serverTimestamp(), // Preserve original createdAt
        };
      } else {
        // Should not happen if we are editing, but as a fallback
        finalDataForNewDoc = {
          ...productDataForFirestore,
          createdAt: serverTimestamp(),
        };
      }
      
      batch.set(newProductDocRef, finalDataForNewDoc);
      batch.delete(oldProductDocRef);
      
      await batch.commit();
      
      const newDocSnapAfterCommit = await getDoc(newProductDocRef);
      return newDocSnapAfterCommit.exists() ? await docToProduct(newDocSnapAfterCommit) : null;

    } catch (error) {
      console.error(`Error changing SKU from "${currentSku}" to "${newSku}":`, error);
      throw error;
    }
  }
}


export async function deleteProduct(id: string): Promise<void> { 
  try {
    const productDocRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(productDocRef);
  } catch (error) {
    console.error("Error deleting product with SKU (ID):", id, error);
    throw error;
  }
}

export async function deleteProducts(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  // Firestore batch writes have a limit of 500 operations.
  // We chunk the array to handle more than 500 deletions if needed.
  try {
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 500) {
      chunks.push(ids.slice(i, i + 500));
    }
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(id => {
        const productDocRef = doc(db, PRODUCTS_COLLECTION, id);
        batch.delete(productDocRef);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error("Error performing bulk delete on products:", error);
    throw error;
  }
}


export async function updateProductStock(productId: string, quantityToDecrement: number): Promise<void> {
  const productRef = doc(db, PRODUCTS_COLLECTION, productId);
  try {
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
      // Instead of throwing an error, log a warning and return gracefully.
      // This handles cases where a product was deleted but still exists in a user's cart.
      console.warn(`Product with SKU ${productId} not found for stock update. Skipping.`);
      return;
    }
    const data = productSnap.data();
    const currentStock = data.stock || 0;
    const newStock = Math.max(0, currentStock - quantityToDecrement);
    
    if (newStock < 0) {
        console.warn(`Stock for product ${productId} would be negative. Setting to 0.`);
    }

    await updateDoc(productRef, {
      stock: newStock,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    // We still want to log and re-throw other potential errors (like permission issues).
    console.error(`Error updating stock for product SKU ${productId}:`, error);
    throw error;
  }
}

// Category Service Functions
export async function addCategory(categoryData: Omit<Category, 'id'>): Promise<Category> {
  try {
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    const newCategoryData = {
        name: categoryData.name,
        description: categoryData.description || '',
        isFeatured: categoryData.isFeatured || false,
        featuredImageUrl: categoryData.featuredImageUrl || '',
        parentId: categoryData.parentId || null,
        level: categoryData.level,
        isVisible: categoryData.isVisible !== undefined ? categoryData.isVisible : true,
        alias: categoryData.alias || '',
    };
    const docRef = await addDoc(categoriesRef, newCategoryData);
    return { id: docRef.id, ...categoryData };
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
}

export async function updateCategory(id: string, categoryData: Partial<Omit<Category, 'id'>>): Promise<Category> {
  try {
    const categoryDocRef = doc(db, CATEGORIES_COLLECTION, id);
    const updateData: { [key: string]: any } = { ...categoryData };
    
    if ('parentId' in categoryData) {
        updateData.parentId = categoryData.parentId || null;
    }
    
    if (updateData.isFeatured === undefined && categoryData.isFeatured !== undefined) { 
      updateData.isFeatured = categoryData.isFeatured;
    } else if (updateData.isFeatured === undefined) {
      delete updateData.isFeatured;
    }

    if (updateData.featuredImageUrl === undefined && categoryData.featuredImageUrl !== undefined) {
       updateData.featuredImageUrl = categoryData.featuredImageUrl;
    } else if (updateData.featuredImageUrl === undefined) {
       delete updateData.featuredImageUrl;
    }

    if (categoryData.isVisible !== undefined) {
      updateData.isVisible = categoryData.isVisible;
    }

    if (categoryData.showInNavbar !== undefined) {
      updateData.showInNavbar = categoryData.showInNavbar;
    }

    if (categoryData.alias !== undefined) {
      updateData.alias = categoryData.alias;
    }
    if (categoryData.alias !== undefined) {
      updateData.alias = categoryData.alias;
    }

    // Usamos setDoc con { merge: true } para crear el docto si no existía (ej. categorías que vienen directo de Syscom API)
    await setDoc(categoryDocRef, updateData, { merge: true });
    
    // Obtenemos el documento ya mezclado para retornar
    const updatedDocSnap = await getDoc(categoryDocRef);
     if (updatedDocSnap.exists()) {
      return docToCategory(updatedDocSnap);
    }
    
    // Si aún falla, retornamos un cast mínimo para no romper la UI
    return { id, ...categoryData } as Category;
  } catch (error) {
    console.error("Error updating category:", id, error);
    throw error;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    const subcategoriesQuery = query(collection(db, CATEGORIES_COLLECTION), where('parentId', '==', id), limit(1));
    const subcategoriesSnapshot = await getDocs(subcategoriesQuery);
    if (!subcategoriesSnapshot.empty) {
      const categoryDoc = await getDoc(doc(db, CATEGORIES_COLLECTION, id));
      const categoryName = categoryDoc.exists() ? categoryDoc.data().name : id;
      throw new Error(`No se puede eliminar la categoría "${categoryName}" porque es padre de otras categorías. Reasigna o elimina las subcategorías primero.`);
    }

    const productsQuery = query(collection(db, PRODUCTS_COLLECTION), where('category', '==', id), limit(1));
    const productsSnapshot = await getDocs(productsQuery);
    if (!productsSnapshot.empty) {
      const categoryDoc = await getDoc(doc(db, CATEGORIES_COLLECTION, id));
      const categoryName = categoryDoc.exists() ? categoryDoc.data().name : id;
      throw new Error(`No se puede eliminar la categoría "${categoryName}" porque todavía está asociada con productos.`);
    }

    const categoryDocRef = doc(db, CATEGORIES_COLLECTION, id);
    await deleteDoc(categoryDocRef);
  } catch (error) {
    console.error("Error deleting category:", id, error);
    throw error;
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const products = await getProductosSyscomMerida();
    // Retornamos los primeros 5 como destacados ya que Syscom no tiene flag 'isFeatured'
    return products.slice(0, 5);
  } catch (error) {
    console.error("Error fetching Syscom featured products:", error);
    return [];
  }
}

export async function searchProductsAI(query: string, page = 1) {
  const { busquedaIASyscom } = await import('./syscom');
  return busquedaIASyscom(query, page);
}

