
import { ProductForm } from '@/components/admin/ProductForm';
import { getCategories } from '@/services/productService';
import type { Category } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default async function NewProductPage() {
  let categories: Category[] = [];
  let categoryError = null;

  try {
    categories = await getCategories();
  } catch (error: any) {
    console.error("Non-critical error fetching categories on New page (likely missing index):", error.message);
    if (error.message.includes('firestore/failed-precondition')) {
        categoryError = "No se pudieron cargar las categorías. Por favor, crea el índice compuesto requerido en Firestore: `categories` collection, `level` (ASC), `name` (ASC).";
    } else {
        categoryError = "Ocurrió un error inesperado al cargar las categorías.";
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Añadir Nuevo Producto</h1>
      {categoryError && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Problema al Cargar Categorías</AlertTitle>
                <AlertDescription>
                    {categoryError}
                </AlertDescription>
            </Alert>
        )}
      <ProductForm 
        categories={categories} 
        disableCategorySelection={!!categoryError}
      />
    </div>
  );
}
