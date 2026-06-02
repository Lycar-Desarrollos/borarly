
import { getProductById, getProducts, getCategories } from '@/services/productService';
import { notFound } from 'next/navigation';
import { ProductDetailView } from '@/components/products/ProductDetailView';
import type { Product, Category } from '@/lib/types';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { Metadata, ResolvingMetadata } from 'next';
import { Product as ProductSchema } from 'schema-dts';
import { JsonLd } from 'react-schemaorg';


interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

/** 
 * EFICIENCIA Y PROTECCIÓN DE API: 
 * Aplicamos un cache de 24 horas (ISR) para que Google y los bots no saturen la API de Syscom.
 * Los datos se refrescan en segundo plano una vez al día.
 */
export const revalidate = 3600; // Refrescar stock/precios cada 1 hora para SEO dinámico

// Pre-generar los productos más populares/recientes para carga instantánea
export async function generateStaticParams() {
  try {
    // Obtenemos los primeros 144 productos para pre-construirlos (3 páginas de 48)
    const products = await getProducts(undefined, undefined, 144);
    return products.map((product) => ({
      id: product.id,
    }));
  } catch (error) {
    console.error("Error pre-generando parámetros estáticos:", error);
    return [];
  }
}

// SEO: Generate dynamic metadata for each product page
export async function generateMetadata(
  props: ProductDetailPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const productSku = params.id;
  if (!productSku) {
    return {
      title: 'Producto no encontrado | Borarly Mayorista',
      description: 'El producto que buscas no existe o no está disponible.',
    }
  }
 
  const product = await getProductById(productSku);
 
  if (!product) {
    return {
      title: 'Producto no encontrado | Borarly Mayorista',
      description: 'El producto que buscas no existe o no está disponible.',
    }
  }
 
  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || []
 
  return {
    title: `${product.name} | Borarly Mayorista`,
    description: product.description.substring(0, 160) || `Encuentra ${product.name} al mejor precio en Borarly Mayorista.`,
    keywords: [product.name, product.brand, product.category, 'Borarly Mayorista'].filter(Boolean).join(', '),
    alternates: {
      canonical: `https://borarly.com/products/${product.id}`,
    },
    openGraph: {
      title: product.name,
      description: product.description.substring(0, 160),
      images: product.imageUrls.length > 0 ? [product.imageUrls[0], ...previousImages] : previousImages,
      type: 'website',
      siteName: 'Borarly Mayorista',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description.substring(0, 160),
      images: product.imageUrls.length > 0 ? [product.imageUrls[0]] : [],
    }
  }
}


export default async function ProductDetailPage(props: ProductDetailPageProps) {
  const params = await props.params;
  const productSku = params.id;

  if (!productSku) {
    notFound();
  }

  const product = await getProductById(productSku);
  
  if (!product) {
    notFound();
  }

  const [allCategories, allProductsInSameCategory] = await Promise.all([
    getCategories(),
    product.categoryId ? getProducts(product.categoryId) : (product.category ? getProducts(product.category) : Promise.resolve([])),
  ]);

  const relatedProducts = allProductsInSameCategory
    .filter(p => p.id !== product.id)
    .slice(0, 4);

  // SEO: Create JSON-LD structured data for Google Shopping and rich results
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.imageUrls,
    sku: product.id,
    mpn: product.id,
    brand: product.brand ? {
      '@type': 'Brand',
      name: product.brand
    } : {
      '@type': 'Brand',
      name: 'Borarly'
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'MXN',
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: (product.stock && product.stock > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://borarly.com/products/${product.id}`,
      seller: {
        '@type': 'Organization',
        name: 'Borarly Mayorista'
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'MXN'
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY'
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 5,
            unitCode: 'DAY'
          }
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'MX'
        }
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'MX',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 5,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn'
      }
    },
  };

  return (
    <>
      <JsonLd item={productSchema as any} />
      <Suspense fallback={<ProductDetailSkeleton />}>
          <ProductDetailView 
              product={product} 
              relatedProducts={relatedProducts} 
              allCategories={allCategories} 
          />
      </Suspense>
    </>
  );
}


function ProductDetailSkeleton() {
    return (
      <div className="space-y-12">
        <Skeleton className="h-10 w-36 mb-4" /> 
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="space-y-4">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <div className="grid grid-cols-5 gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-md" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" /> 
              <Skeleton className="h-6 w-28" />
            </div>
            <Skeleton className="h-10 w-3/4" /> 
            <Skeleton className="h-8 w-1/2" /> 
            <Skeleton className="h-6 w-20" /> 
            <Separator />
            <Skeleton className="h-6 w-1/3 mb-2" /> 
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-12 w-full mt-4" /> 
            <Skeleton className="h-12 w-full mt-2" /> 
          </div>
        </div>
        <div className="mt-16">
          <Skeleton className="h-8 w-1/4 mb-6" /> 
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
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
