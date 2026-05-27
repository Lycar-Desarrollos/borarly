
"use client";

import { useState, FormEvent, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Product, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { addProduct, updateProduct, getProductById } from '@/services/productService';
import { getExchangeRate, getVatRate } from '@/services/settingsService';
import { Loader2, Sparkles, UploadCloud, XCircle, Image as ImageIcon, Percent, DollarSign, Warehouse, CheckCircle } from 'lucide-react';
import NextImage from 'next/image'; 
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '../ui/checkbox';

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  disableCategorySelection?: boolean;
}

interface ImageSlot {
  id: string; 
  file: File | null;
  previewUrl: string | null; 
  manualUrl: string; 
  currentUrl?: string; 
  isUploading: boolean;
  uploadProgress: number;
}

const MAX_IMAGE_SLOTS = 5;

const DEFAULT_FORM_DATA: Partial<Product> = {
    id: '', // SKU
    name: '',
    description: '',
    price: 0,
    costPrice: 0,
    profitMargin: 0,
    currency: 'MXN',
    category: '',
    stock: 0,
    imageUrls: [],
    brand: '',
    line: '',
    series: '',
    isFeatured: false,
};


export function ProductForm({ product: initialProduct, categories, disableCategorySelection = false }: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<Product>>(DEFAULT_FORM_DATA);
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalSku, setOriginalSku] = useState<string | undefined>(undefined);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [vatRate, setVatRate] = useState(0.16);
  const [priceDisplay, setPriceDisplay] = useState('0.00');
  
  const router = useRouter();
  const { toast } = useToast();
  
  const calculatePrice = useCallback((cost?: number, margin?: number, currency?: 'MXN' | 'USD') => {
    const costVal = Number(cost) || 0;
    const marginVal = Number(margin) || 0;
    const curr = currency || 'MXN';

    if (costVal <= 0) {
      return 0;
    }
    
    const costInMxn = curr === 'USD' ? costVal * exchangeRate : costVal;
    const priceBeforeTax = costInMxn * (1 + marginVal / 100);
    const finalPrice = priceBeforeTax * (1 + vatRate);

    return parseFloat(finalPrice.toFixed(2));
  }, [exchangeRate, vatRate]);

  // Effect to fetch rates and initialize form
  useEffect(() => {
    let isMounted = true;
    const fetchRatesAndInit = async () => {
        try {
            const [rate, currentVat] = await Promise.all([getExchangeRate(), getVatRate()]);
            if (!isMounted) return;

            setExchangeRate(rate);
            setVatRate(currentVat);

            const createInitialSlots = (existingUrls: string[] = []) => {
                return Array.from({ length: MAX_IMAGE_SLOTS }, (_, i) => {
                    const existingUrl = existingUrls[i] || '';
                    return {
                        id: `slot-${i}-${initialProduct?.id || 'new'}-${Date.now()}`,
                        file: null,
                        previewUrl: existingUrl || null,
                        manualUrl: existingUrl || '',
                        currentUrl: existingUrl || undefined,
                        isUploading: false,
                        uploadProgress: 0,
                    };
                });
            };

            if (initialProduct && initialProduct.id) {
                setIsEditing(true);
                setOriginalSku(initialProduct.id);
                setFormData({
                    ...DEFAULT_FORM_DATA,
                    ...initialProduct,
                    costPrice: Number(initialProduct.costPrice) || 0,
                    profitMargin: Number(initialProduct.profitMargin) || 0,
                    currency: initialProduct.currency || 'MXN',
                    isFeatured: !!initialProduct.isFeatured,
                });
                setImageSlots(createInitialSlots(initialProduct.imageUrls || []));
            } else {
                setIsEditing(false);
                setOriginalSku(undefined);
                const initialCategory = categories.length > 0 ? categories[0].id : '';
                setFormData(prev => ({
                    ...prev,
                    category: initialCategory,
                }));
                setImageSlots(createInitialSlots());
            }
        } catch (error) {
            console.error("Error fetching rates:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las configuraciones de precios." });
        }
    };
    fetchRatesAndInit();
    return () => { isMounted = false; };
  }, [initialProduct, categories, toast]);

  // Effect to update the displayed price whenever relevant form data changes
  useEffect(() => {
    const newPrice = calculatePrice(formData.costPrice, formData.profitMargin, formData.currency);
    setPriceDisplay(new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(newPrice || 0));
  }, [formData.costPrice, formData.profitMargin, formData.currency, calculatePrice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'costPrice' || name === 'profitMargin' || name === 'stock') ? parseFloat(value) : value
    }));
  };

  const handleCurrencyChange = (value: 'MXN' | 'USD') => {
    setFormData(prev => ({ ...prev, currency: value }));
  };
  
  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleFileChangeForSlot = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setImageSlots(prevSlots =>
      prevSlots.map((slot, i) =>
        i === index
          ? {
              ...slot,
              file: file,
              previewUrl: file ? URL.createObjectURL(file) : slot.manualUrl || slot.currentUrl || null,
              manualUrl: file ? '' : slot.manualUrl, 
            }
          : slot
      )
    );
  };

  const handleManualUrlChangeForSlot = (index: number, url: string) => {
    setImageSlots(prevSlots =>
      prevSlots.map((slot, i) =>
        i === index
          ? {
              ...slot,
              manualUrl: url,
              previewUrl: url || (slot.file ? URL.createObjectURL(slot.file) : slot.currentUrl || null),
              file: url ? null : slot.file, 
            }
          : slot
      )
    );
  };

  const removeImageFromSlot = (index: number) => {
    setImageSlots(prevSlots =>
      prevSlots.map((slot, i) =>
        i === index
          ? {
              ...slot,
              file: null,
              previewUrl: null,
              manualUrl: '',
              currentUrl: undefined, 
              isUploading: false,
              uploadProgress: 0,
            }
          : slot
      )
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const finalCategory = formData.category || (isEditing ? initialProduct?.category : categories.length > 0 ? categories[0].id : '');
    if (!finalCategory && !disableCategorySelection) {
      toast({ variant: "destructive", title: "Error de Validación", description: "Por favor, selecciona una categoría para el producto." });
      return;
    }
    
    if (!formData.id || formData.id.trim() === '') {
      toast({ variant: "destructive", title: "Error de Validación", description: "El SKU (ID) es obligatorio." });
      return;
    }
    
    const stockTotal = Number(formData.stock) || 0;
    if (!formData.name ) {
      toast({ variant: "destructive", title: "Error de Validación", description: "Por favor, rellena el campo Nombre." });
      return;
    }
     if (isNaN(Number(formData.costPrice)) || isNaN(Number(formData.profitMargin))) {
      toast({ variant: "destructive", title: "Error de Validación", description: "Costo y Margen deben ser números válidos." });
      return;
    }
    
    const finalPrice = calculatePrice(formData.costPrice, formData.profitMargin, formData.currency);
    
    if(finalPrice <= 0 && Number(formData.costPrice) > 0) {
        toast({ variant: "destructive", title: "Error en Precio", description: "El precio final calculado es cero o negativo. Revisa el costo y el margen." });
        return;
    }


    setIsSubmitting(true);
    const finalImageUrls: string[] = [];

    const uploadPromises = imageSlots.map(async (slot, index) => {
      if (slot.file) {
        setImageSlots(prev => prev.map((s, i) => i === index ? { ...s, isUploading: true, uploadProgress: 0 } : s));
        try {
          const SRef = storageRef(storage, `products/${Date.now()}_${slot.file.name}`);
          const uploadTask = uploadBytesResumable(SRef, slot.file);

          return new Promise<string>((resolve, reject) => {
            uploadTask.on('state_changed',
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setImageSlots(prev => prev.map((s, i) => i === index ? { ...s, uploadProgress: progress } : s));
              },
              (error) => {
                console.error(`Fallo en la subida para el slot ${index}:`, error);
                toast({ variant: "destructive", title: `Fallo en la subida: ${slot.file?.name}`, description: error.message });
                setImageSlots(prev => prev.map((s, i) => i === index ? { ...s, isUploading: false } : s));
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setImageSlots(prev => prev.map((s, i) => i === index ? { ...s, isUploading: false } : s));
                resolve(downloadURL);
              }
            );
          });
        } catch (error) {
          setImageSlots(prev => prev.map((s, i) => i === index ? { ...s, isUploading: false } : s));
          throw error; 
        }
      } else if (slot.manualUrl) {
        return Promise.resolve(slot.manualUrl);
      } else if (slot.currentUrl) { 
        return Promise.resolve(slot.currentUrl);
      }
      return Promise.resolve(null); 
    });

    try {
      const resolvedUrls = await Promise.all(uploadPromises);
      resolvedUrls.forEach(url => {
        if (url) finalImageUrls.push(url);
      });
    } catch (uploadError) {
      setIsSubmitting(false);
      toast({ variant: "destructive", title: "Error en Subida de Imagen", description: "Una o más imágenes no pudieron subirse. Por favor, inténtalo de nuevo." });
      return;
    }
    
    let productImagesToSave = finalImageUrls.filter(url => url.trim() !== "").slice(0, MAX_IMAGE_SLOTS);
    if (productImagesToSave.length === 0) {
        productImagesToSave = ["https://placehold.co/600x400.png?text=No+Image"];
    }

    const productDataPayload: Omit<Product, 'createdAt' | 'updatedAt' | 'priceInCurrency'> & { isFeatured: boolean } = {
      id: formData.id!.trim(), // SKU
      name: formData.name!,
      description: formData.description!,
      price: finalPrice, // This is not stored, but used for the return type
      currency: formData.currency!,
      costPrice: Number(formData.costPrice),
      profitMargin: Number(formData.profitMargin),
      imageUrls: productImagesToSave,
      category: finalCategory!,
      stock: stockTotal,
      brand: formData.brand || '',
      line: formData.line || '',
      series: formData.series || '',
      isFeatured: !!formData.isFeatured,
    };

    try {
      if (isEditing && originalSku) {
        await updateProduct(originalSku, productDataPayload); 
        toast({ title: "Producto Actualizado", description: `${productDataPayload.name} ha sido actualizado exitosamente.` });
      } else {
        await addProduct(productDataPayload);
        toast({ title: "Producto Añadido", description: `${productDataPayload.name} ha sido añadido exitosamente.` });
      }
      router.push('/admin/products');
      router.refresh(); 
    } catch (error: any) {
      console.error("Error al guardar el producto:", error);
      toast({ variant: "destructive", title: "Fallo al Guardar", description: error.message || "No se pudo guardar el producto." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Producto' : 'Añadir Nuevo Producto'}</CardTitle>
        <CardDescription>
          {isEditing ? `Actualiza los detalles para ${initialProduct?.name}.` : 'Rellena los detalles para el nuevo producto.'}
          Proporciona hasta {MAX_IMAGE_SLOTS} imágenes subiendo archivos o pegando URLs.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="id">SKU (ID del Producto)</Label>
              <Input 
                id="id" 
                name="id" 
                value={formData.id || ''} 
                onChange={handleChange} 
                required 
                className={isEditing && formData.id === originalSku ? "bg-muted/30" : ""}
              />
              {isEditing && formData.id !== originalSku && <p className="text-xs text-orange-600 dark:text-orange-400">El SKU será cambiado de '{originalSku}'. Esto creará una nueva entrada de producto y eliminará la anterior si el nuevo SKU es único.</p>}
              {isEditing && formData.id === originalSku && <p className="text-xs text-muted-foreground">SKU Original: {originalSku}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre del Producto</Label>
              <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="description">Descripción</Label>
            </div>
            <Textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} rows={5} />
          </div>

          <Card className="p-4 bg-muted/30">
              <CardTitle className="text-lg mb-2">Clasificación</CardTitle>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Categoría (Sección)</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={handleCategoryChange} 
                    required 
                    disabled={disableCategorySelection}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {disableCategorySelection && <p className="text-xs text-muted-foreground">La selección está desactivada debido a un error al cargar las categorías.</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="brand">Marca</Label>
                  <Input id="brand" name="brand" value={formData.brand || ''} onChange={handleChange} />
                </div>
                 <div className="space-y-1.5">
                  <Label htmlFor="line">Línea</Label>
                  <Input id="line" name="line" value={formData.line || ''} onChange={handleChange} />
                </div>
                 <div className="space-y-1.5">
                  <Label htmlFor="series">Serie</Label>
                  <Input id="series" name="series" value={formData.series || ''} onChange={handleChange} />
                </div>
              </div>
          </Card>


          <Card className="p-4 bg-muted/30">
            <CardTitle className="text-lg mb-2">Precios</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="currency">Moneda de Costo</Label>
                     <Select value={formData.currency || 'MXN'} onValueChange={handleCurrencyChange as any}>
                        <SelectTrigger id="currency">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MXN">Pesos Mexicanos (MXN)</SelectItem>
                            <SelectItem value="USD">Dólares Americanos (USD)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="mt-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="costPrice">Precio de Costo (en {formData.currency})</Label>
                   <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="costPrice"
                          name="costPrice"
                          type="number"
                          step="0.01"
                          placeholder="ej. 100.00"
                          value={formData.costPrice || ''}
                          onChange={handleChange}
                          min="0"
                          required
                          className="pl-8"
                        />
                   </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profitMargin">Margen de Ganancia (%)</Label>
                  <div className="relative">
                    <Input
                      id="profitMargin"
                      name="profitMargin"
                      type="number"
                      step="0.1"
                      placeholder="ej. 25"
                      value={formData.profitMargin || ''}
                      onChange={handleChange}
                      min="0"
                      required
                      className="pr-8"
                    />
                    <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                  </div>
                </div>
                 <div className="space-y-1.5">
                  <Label>Precio Final (IVA Incluido)</Label>
                  <Input
                      type="text"
                      value={priceDisplay}
                      readOnly
                      className="bg-muted/50 font-semibold"
                  />
                </div>
              </div>
            </div>
            <CardDescription className="text-xs mt-2">
                El precio final se calcula a partir del Costo + Margen + IVA ({vatRate * 100}%).
                Si el costo es en USD, se usa el tipo de cambio de la configuración (actual: {exchangeRate.toFixed(2)} MXN/USD).
            </CardDescription>
          </Card>
          
          <Card className="p-4 bg-muted/30">
            <CardTitle className="text-lg mb-2">Inventario y Visibilidad</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="space-y-1.5">
                    <Label htmlFor="stock">Total de Piezas</Label>
                    <Input id="stock" name="stock" type="number" value={formData.stock || 0} onChange={handleChange} min="0" />
                </div>
                <div className="md:col-span-2 pt-6">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isFeatured"
                            checked={formData.isFeatured}
                            onCheckedChange={(checked) => setFormData(prev => ({...prev, isFeatured: !!checked}))}
                        />
                        <Label htmlFor="isFeatured" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Marcar como Producto Destacado
                        </Label>
                    </div>
                </div>
            </div>
          </Card>
          
          <div className="space-y-4">
            <Label>Imágenes del Producto (hasta {MAX_IMAGE_SLOTS})</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {imageSlots.map((slot, index) => (
                <div key={slot.id} className="space-y-2 p-3 border rounded-lg shadow-sm bg-muted/20">
                  <div className="relative w-full aspect-square rounded-md border bg-white flex items-center justify-center overflow-hidden">
                    {slot.previewUrl ? (
                      <NextImage src={slot.previewUrl} alt={`Vista previa ${index + 1}`} layout="fill" objectFit="contain" data-ai-hint="product image preview"/>
                    ) : (
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  
                  {slot.isUploading && (
                    <Progress value={slot.uploadProgress} className="w-full h-2 my-1" />
                  )}

                  <div className="space-y-1">
                    <Label htmlFor={`manualUrl-${index}`} className="text-xs font-medium">URL de Imagen {index + 1}</Label>
                    <Input
                      id={`manualUrl-${index}`}
                      type="text"
                      placeholder="Pega la URL de la imagen"
                      value={slot.manualUrl}
                      onChange={(e) => handleManualUrlChangeForSlot(index, e.target.value)}
                      className="h-8 text-xs"
                      disabled={isSubmitting || slot.isUploading}
                    />
                  </div>
                  <div className="space-y-1">
                     <Label htmlFor={`file-${index}`} className="text-xs font-medium">O Subir Archivo {index + 1}</Label>
                    <Input
                      id={`file-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChangeForSlot(index, e)}
                      className="h-8 text-xs file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      disabled={isSubmitting || slot.isUploading}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8 border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
                    onClick={() => removeImageFromSlot(index)}
                    disabled={isSubmitting || slot.isUploading}
                  >
                    <XCircle className="mr-1 h-3 w-3" /> Limpiar Espacio {index + 1}
                  </Button>
                </div>
              ))}
            </div>
             <p className="text-xs text-muted-foreground mt-1">
                Recuerda configurar las reglas de Firebase Storage para permitir subidas a la ruta 'products/'.
            </p>
          </div>

        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting || imageSlots.some(s => s.isUploading)}>
            {(isSubmitting || imageSlots.some(s => s.isUploading)) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {imageSlots.some(s => s.isUploading) ? 'Subiendo Imágenes...' : (isEditing ? 'Actualizar Producto' : 'Añadir Producto')}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="ml-2" disabled={isSubmitting || imageSlots.some(s => s.isUploading)}>
            Cancelar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
