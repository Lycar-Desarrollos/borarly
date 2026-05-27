
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProductsByIds } from '@/services/productService'; // Updated import
import type { Product } from '@/lib/types';
import { ProductList } from '@/components/products/ProductList';
import { Skeleton } from '@/components/ui/skeleton';
import { HeartCrack } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function WishlistPage() {
  const { currentUser, wishlist, loading: authLoading } = useAuth();
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      setProductsLoading(false);
      return;
    }

    if (wishlist.length === 0) {
      setWishlistProducts([]);
      setProductsLoading(false);
      return;
    }

    const fetchWishlistProducts = async () => {
      setProductsLoading(true);
      try {
        // Fetch all products in the wishlist with a single, efficient query
        const resolvedProducts = await getProductsByIds(wishlist);
        setWishlistProducts(resolvedProducts);
      } catch (error) {
        console.error("Error fetching wishlist products:", error);
        setWishlistProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlist, currentUser, authLoading]);

  if (authLoading || productsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Mi Lista de Deseos</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <HeartCrack className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-semibold mb-4">Por favor, Inicia Sesión</h1>
        <p className="text-muted-foreground mb-8">Inicia sesión para ver tu lista de deseos.</p>
        <Link href="/login?redirect=/profile/wishlist" legacyBehavior passHref>
          <Button size="lg">Iniciar Sesión</Button>
        </Link>
      </div>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <HeartCrack className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-semibold mb-4">Tu Lista de Deseos está Vacía</h1>
        <p className="text-muted-foreground mb-8">Parece que no has añadido nada todavía.</p>
        <Link href="/" legacyBehavior passHref>
          <Button size="lg">Descubrir Productos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mi Lista de Deseos ({wishlistProducts.length})</h1>
      <ProductList products={wishlistProducts} />
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-4 border rounded-lg bg-card">
      <Skeleton className="h-[180px] w-full rounded-md bg-muted-foreground/10" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px] bg-muted-foreground/10" />
        <Skeleton className="h-4 w-[150px] bg-muted-foreground/10" />
        <Skeleton className="h-6 w-[100px] mt-2 bg-muted-foreground/10" />
      </div>
      <Skeleton className="h-10 w-full mt-2 bg-muted-foreground/10" />
    </div>
  );
}
