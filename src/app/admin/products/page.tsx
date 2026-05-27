
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ProductDataTable } from '@/components/admin/ProductDataTable';
import { getCategories, getProducts } from '@/services/productService';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product, Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  // Fetch products and categories in parallel
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories().catch(error => {
      // Gracefully handle category fetching errors, especially missing index errors.
      console.error("Failed to load categories, continuing without them. Please check Firestore indexes.", error);
      return []; // Return an empty array on error
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestionar Productos</h1>
        <Link href="/admin/products/new" legacyBehavior passHref>
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nuevo Producto
          </Button>
        </Link>
      </div>
      
      <Suspense fallback={<DataTableSkeleton />}>
        <ProductDataTable products={products} categories={categories} />
      </Suspense>
    </div>
  );
}

function DataTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-12 w-full" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" /> 
      ))}
       <div className="flex justify-end">
        <Skeleton className="h-10 w-1/3" />
      </div>
    </div>
  );
}
