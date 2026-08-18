
import { ProductForm } from '@/components/admin/ProductForm';
import { getProductById, getCategories } from '@/services/productService';
import { notFound } from 'next/navigation';
import type { Category } from '@/lib/types';
import React from 'react'; 
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';


interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

// Helper component to render an error message
function ErrorDisplay({ error, productId }: { error: Error; productId: string }) {
  return (
    <div className="container mx-auto py-8 text-center">
      <h1 className="text-2xl font-bold text-destructive mb-4">Error al Cargar la Página de Edición</h1>
      <p className="mb-2">Encontramos un problema al cargar la información del producto con ID: {productId}.</p>
      <p className="text-sm text-muted-foreground mb-4">
        Por favor, asegúrate de que el producto exista y tu conexión sea estable. Si el problema persiste, contacta a soporte.
      </p>
      <pre className="mt-4 p-4 bg-muted text-left text-xs rounded-md overflow-auto">
        Detalles del error: {error.message}
        {error.stack && `\nStack: ${error.stack.substring(0, 500)}...`}
      </pre>
    </div>
  );
}

export default async function EditProductPage(props: EditProductPageProps) {
  const params = await props.params;
  const { id: productId } = params;
  let categories: Category[] = [];
  let categoryError = null;

  if (!productId) {
    console.error("EditProductPage: Product ID is missing from params.");
    notFound();
    return null;
  }
  
  try {
    // Fetch categories first and handle potential index error gracefully
    categories = await getCategories();
  } catch (error: any) {
    console.error("Non-critical error fetching categories on Edit page (likely missing index):", error.message);
    if (error.message.includes('firestore/failed-precondition')) {
        categoryError = "No se pudieron cargar las categorías. Por favor, crea el índice compuesto requerido en Firestore: `categories` collection, `level` (ASC), `name` (ASC).";
    } else {
        // For other unexpected errors, we can still allow the form to render but show a generic error
        categoryError = "Ocurrió un error inesperado al cargar las categorías.";
    }
  }

  try {
    const product = await getProductById(productId);
    
    if (!product) {
      notFound();
      return null;
    }

    // Render the successful view
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold">Editar Producto</h1>
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
            product={product} 
            categories={categories} 
            disableCategorySelection={!!categoryError}
        />
      </div>
    );

  } catch (error) {
    // This will catch errors from getProductById or other critical failures
    console.error("Error crítico al renderizar EditProductPage para ID:", productId, error);
    if (error instanceof Error) {
        return <ErrorDisplay error={error} productId={productId} />;
    }
    // Fallback for non-Error objects
    return <ErrorDisplay error={new Error(String(error))} productId={productId} />;
  }
}
