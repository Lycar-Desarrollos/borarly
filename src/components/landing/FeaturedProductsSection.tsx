"use client";
import type { Product } from '@/lib/types';
import { ProductList } from '@/components/products/ProductList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface FeaturedProductsSectionProps {
  initialProducts: Product[];
}

export function FeaturedProductsSection({ initialProducts }: FeaturedProductsSectionProps) {

  return (
    <section className="container px-4 md:px-6 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
        <h2 className="text-2xl font-bold text-center sm:text-left">PRODUCTOS DESTACADOS</h2>
      </div>
      {initialProducts.length > 0 ? (
        <ProductList products={initialProducts} />
      ) : (
        <p className="text-center text-muted-foreground">No hay productos destacados en este momento.</p>
      )}
      <div className="text-center mt-8">
        <Link href="/?category=all" passHref legacyBehavior>
          <Button variant="outline" size="lg">Ver Todos los Productos</Button>
        </Link>
      </div>
    </section>
  );
}
