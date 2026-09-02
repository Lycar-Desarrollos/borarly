
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { db } from '@/lib/firebase';
import type { Product as ProductType, Category, CategoryLevel } from '@/lib/types';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  writeBatch, 
  doc, 
  getDoc,
  setDoc,
  serverTimestamp,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { getExchangeRate } from '@/services/settingsService';
import { requireAdmin } from '@/lib/adminAuth';

interface CsvRow {
  sku?: string;
  name?: string;
  description?: string;
  brand?: string;
  costPrice?: string;
  currency?: 'MXN' | 'USD' | string;
  profitMargin?: string;
  seccion_nombre?: string;
  linea_nombre?: string;
  serie_nombre?: string;
  stock?: string;
  imageUrls?: string; 
  isFeatured?: 'TRUE' | 'FALSE' | 'true' | 'false' | '' | boolean;
  [key: string]: any; 
}

interface ProcessedRowResult {
  success: boolean;
  action: 'created' | 'updated' | 'skipped';
  // El precio de venta se calcula al leer el producto (costPrice + margen + IVA),
  // por eso el payload almacenado no incluye `price`.
  data?: Partial<Omit<ProductType, 'createdAt' | 'updatedAt'>> & { id: string }; 
  error?: string;
  originalRowData: CsvRow;
  csvRowNumber: number; 
}

const categoryCache = new Map<string, string>();

async function findOrCreateCategory(
  name: string,
  level: CategoryLevel,
  parentId: string | null = null,
  batch: any
): Promise<string> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error(`Category name for level ${level} cannot be empty.`);
    }
    const cacheKey = `${level}-${trimmedName}-${parentId || 'null'}`;
    if (categoryCache.has(cacheKey)) {
        return categoryCache.get(cacheKey)!;
    }

    const categoriesRef = collection(db, 'categories');
    const q = query(
        categoriesRef,
        where('name', '==', trimmedName),
        where('level', '==', level),
        where('parentId', '==', parentId),
        limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const categoryId = querySnapshot.docs[0].id;
        categoryCache.set(cacheKey, categoryId);
        return categoryId;
    }

    // If not found, create it within the batch
    const newCategoryRef = doc(collection(db, 'categories'));
    const newCategoryData: Omit<Category, 'id'> = {
        name: trimmedName,
        level: level,
        parentId: parentId,
        description: '',
        isFeatured: false,
        featuredImageUrl: ''
    };
    batch.set(newCategoryRef, newCategoryData);
    // IMPORTANT: Cache the new ID so subsequent rows in the same CSV can find it.
    categoryCache.set(cacheKey, newCategoryRef.id);
    return newCategoryRef.id;
}


export async function POST(request: NextRequest) {
  // Este endpoint escribe en el catalogo completo: exige sesion de administrador verificada.
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  categoryCache.clear(); 
  const processingResults: ProcessedRowResult[] = [];
  let rowsProcessed = 0;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const exchangeRate = await getExchangeRate();

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
    }

    const fileContent = await file.text();

    return await new Promise<NextResponse>((resolve) => {
      Papa.parse<CsvRow>(fileContent, {
        header: true,
        skipEmptyLines: true,
        error: (parseError: Error) => {
          console.error('[API Bulk Upload] Error al leer el CSV:', parseError);
          resolve(NextResponse.json({
            error: `Error al leer el archivo CSV: ${parseError.message}`,
            summary: { totalRows: 0, successfullyAdded: 0, successfullyUpdated: 0, failed: 0 },
            failedRowsDetails: [],
          }, { status: 400 }));
        },
        complete: async (parseResult) => {
          try {
            rowsProcessed = parseResult.data.length;

            if (parseResult.errors.length > 0) {
              console.error("Errors parsing CSV:", parseResult.errors);
              resolve(NextResponse.json({ 
                error: 'Error al parsear el archivo CSV.',
                details: parseResult.errors.map(e => `Fila CSV ${(e.row ?? 0) + 2}: ${e.message} (${e.code})`).join('; '),
                summary: { totalRows: rowsProcessed, successfullyAdded: 0, successfullyUpdated: 0, failed: rowsProcessed },
                failedRowsDetails: parseResult.errors.map(e => ({
                  csvRowNumber: (e.row ?? 0) + 2,
                  error: `${e.message} (${e.code})`,
                  sku: (e.row !== undefined ? parseResult.data[e.row]?.sku : undefined) || "N/A",
                  name: (e.row !== undefined ? parseResult.data[e.row]?.name : undefined) || "N/A",
                }))
              }, { status: 400 }));
              return;
            }

            const productsToProcess: { ref: any, data: any, isUpdate: boolean }[] = [];
            const categoryBatch = writeBatch(db);
            let categoriesCreated = false;

            for (let i = 0; i < parseResult.data.length; i++) {
              const row = parseResult.data[i];
              const csvRowNumber = i + 2; 
              const originalRowData = { ...row };
            
              if (!row.sku?.trim()) { 
                processingResults.push({ success: false, error: 'SKU es requerido.', originalRowData, csvRowNumber, action: 'skipped' }); 
                continue; 
              }
            
              const sku = row.sku.trim();
              const productDocRef = doc(db, 'products', sku);
              const productDocSnap = await getDoc(productDocRef);
              const isUpdating = productDocSnap.exists();
            
              const existingData = isUpdating ? productDocSnap.data() as ProductType : {};

              // --- Validation for new products ---
              if (!isUpdating) {
                  const requiredFields = ['name', 'costPrice', 'currency', 'profitMargin', 'seccion_nombre', 'linea_nombre', 'serie_nombre'];
                  const missingFields = requiredFields.filter(field => !row[field]?.trim());
                  if (missingFields.length > 0) {
                      processingResults.push({ success: false, error: `Faltan campos requeridos para un producto nuevo: ${missingFields.join(', ')}.`, originalRowData, csvRowNumber, action: 'skipped' });
                      continue;
                  }
              }
            
              const updatePayload: any = {};
            
              // Handle category update/creation
              if (row.seccion_nombre?.trim() && row.linea_nombre?.trim() && row.serie_nombre?.trim()) {
                  try {
                      const seccionId = await findOrCreateCategory(row.seccion_nombre, 1, null, categoryBatch);
                      if(seccionId) categoriesCreated = true;
                      const lineaId = await findOrCreateCategory(row.linea_nombre, 2, seccionId, categoryBatch);
                      if(lineaId) categoriesCreated = true;
                      updatePayload.category = await findOrCreateCategory(row.serie_nombre, 3, lineaId, categoryBatch);
                      if(updatePayload.category) categoriesCreated = true;
                  } catch (catError: any) {
                      processingResults.push({ success: false, error: `Error procesando categorías: ${catError.message}`, originalRowData, csvRowNumber, action: 'skipped' });
                      continue;
                  }
              }

              // String fields
              if (row.name?.trim()) updatePayload.name = row.name.trim();
              if (row.description?.trim()) updatePayload.description = row.description.trim();
              if (row.brand?.trim()) updatePayload.brand = row.brand.trim();
            
              // Numeric fields
              if (row.stock !== undefined && String(row.stock).trim() !== '') updatePayload.stock = parseInt(String(row.stock), 10);
              if (row.costPrice !== undefined && String(row.costPrice).trim() !== '') updatePayload.costPrice = parseFloat(String(row.costPrice));
              if (row.profitMargin !== undefined && String(row.profitMargin).trim() !== '') updatePayload.profitMargin = parseFloat(String(row.profitMargin));
            
              // Special fields
              if (row.currency?.trim()) updatePayload.currency = row.currency.trim().toUpperCase();
              if (row.isFeatured !== undefined && String(row.isFeatured).trim() !== '') {
                  updatePayload.isFeatured = String(row.isFeatured).toUpperCase() === 'TRUE';
              }
              if (row.imageUrls?.trim()) {
                  updatePayload.imageUrls = row.imageUrls.split(',').map(url => url.trim()).filter(Boolean);
              }

              if(isUpdating) {
                  // For updates, we only add fields that are actually present in the CSV
                  productsToProcess.push({ ref: productDocRef, data: updatePayload, isUpdate: true });
                  processingResults.push({ success: true, data: {id: sku, ...existingData, ...updatePayload}, originalRowData, csvRowNumber, action: 'updated' });
              } else {
                  // For new products, we build the full object
                  const newProductData = {
                    name: updatePayload.name,
                    description: updatePayload.description || '',
                    currency: updatePayload.currency,
                    costPrice: updatePayload.costPrice,
                    profitMargin: updatePayload.profitMargin,
                    category: updatePayload.category,
                    stock: updatePayload.stock || 0,
                    imageUrls: updatePayload.imageUrls || ["https://placehold.co/600x400.png?text=No+Image"],
                    brand: updatePayload.brand || '',
                    isFeatured: updatePayload.isFeatured || false,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    // Fields for hierarchy, will be deprecated but kept for compatibility
                    line: row.linea_nombre?.trim() || '',
                    series: row.serie_nombre?.trim() || '',
                  };
                  productsToProcess.push({ ref: productDocRef, data: newProductData, isUpdate: false });
                  processingResults.push({ success: true, data: {id: sku, ...newProductData}, originalRowData, csvRowNumber, action: 'created' });
              }
            }
          
            let productsCreatedInDb = 0;
            let productsUpdatedInDb = 0;
          
            if (categoriesCreated) {
                await categoryBatch.commit();
            }

            const productBatch = writeBatch(db);
            productsToProcess.forEach(p => {
                if (p.isUpdate) {
                    productBatch.update(p.ref, { ...p.data, updatedAt: serverTimestamp() });
                } else {
                    productBatch.set(p.ref, p.data);
                }
            });
          
            if (productsToProcess.length > 0) {
                try {
                    await productBatch.commit();
                    productsCreatedInDb = productsToProcess.filter(p => !p.isUpdate).length;
                    productsUpdatedInDb = productsToProcess.filter(p => p.isUpdate).length;
                } catch (batchError) {
                    console.error("Error al ejecutar el lote de Firestore:", batchError);
                     processingResults.forEach(pr => {
                      if (pr.success) { // Only fail rows that were supposed to succeed
                        pr.success = false;
                        pr.error = `Error al guardar en base de datos: ${batchError instanceof Error ? batchError.message : String(batchError)}`;
                      }
                    });
                    productsCreatedInDb = 0;
                    productsUpdatedInDb = 0;
                }
            }
          
            const finalFailedRows = processingResults.filter(r => !r.success);

            resolve(NextResponse.json({
              message: `Procesamiento completado. Creados: ${productsCreatedInDb}, Actualizados: ${productsUpdatedInDb}, Fallidos: ${finalFailedRows.length}.`,
              summary: {
                totalRows: rowsProcessed,
                successfullyAdded: productsCreatedInDb,
                successfullyUpdated: productsUpdatedInDb,
                failed: finalFailedRows.length,
              },
              failedRowsDetails: finalFailedRows.map(fr => ({
                  csvRowNumber: fr.csvRowNumber,
                  error: fr.error,
                  sku: fr.originalRowData.sku || "N/A",
                  name: fr.originalRowData.name || "N/A",
                  seccion_nombre: fr.originalRowData.seccion_nombre,
                  linea_nombre: fr.originalRowData.linea_nombre,
                  serie_nombre: fr.originalRowData.serie_nombre,
              }))
            }, { status: 200 }));
          } catch (processingError) {
            console.error('[API Bulk Upload] Error procesando el CSV:', processingError);
            resolve(NextResponse.json({
              error: processingError instanceof Error
                ? processingError.message
                : 'Ocurrió un error inesperado al procesar el archivo.',
              summary: {
                totalRows: rowsProcessed,
                successfullyAdded: 0,
                successfullyUpdated: 0,
                failed: rowsProcessed,
              },
              failedRowsDetails: [],
            }, { status: 500 }));
          }
        }
      });
    });
  } catch (error) {
    console.error('[API Bulk Upload] Error catch general:', error);
    let errorMessage = 'Ocurrió un error inesperado en el servidor.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ 
        error: errorMessage, 
        summary: { successfullyAdded: 0, successfullyUpdated: 0, failed: rowsProcessed, totalRows: rowsProcessed},
        failedRowsDetails: []
    }, { status: 500 });
  }
}
