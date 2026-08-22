
import { getProducts, getCategories, getFeaturedCategories } from '@/services/productService';
import type { Product, Category } from '@/lib/types';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductDisplay } from '@/components/products/ProductDisplay';

// Import new landing page sections
import { HeroSection } from '@/components/landing/HeroSection';
import { ServiceHighlights } from '@/components/landing/ServiceHighlights';
import { FeaturedCategoriesSection } from '@/components/landing/FeaturedCategoriesSection';
import { FeaturedProductsSection } from '@/components/landing/FeaturedProductsSection';
import { FeaturedBrands } from '@/components/landing/FeaturedBrands';
import { UpcomingEventsSection } from '@/components/landing/UpcomingEventsSection';
import { CategoryShowcaseCarousel, ShowcaseTab } from '@/components/home/CategoryShowcaseCarousel';

// Configuración de Pestañas para 'En Tendencia' (Switches & Routing como primera pestaña)
const TRENDING_TABS: ShowcaseTab[] = [
  { id: 'switches', label: 'Switches & Routing', searchQuery: 'switch administrable switch poe router gigabit' },
  { id: 'cabling', label: 'Cableado Estructurado', searchQuery: 'cable utp cat6 bobina bobinas patch cord' },
  { id: 'networking', label: 'Redes y Wi-Fi', searchQuery: 'switch poe router access point mesh wifi' },
  { id: 'fiber', label: 'Fibra Óptica & SFP', searchQuery: 'fibra optica transceptor sfp convertidor medios' },
  { id: 'racks', label: 'Racks y Gabinetes', searchQuery: 'rack gabinete pared organizador horizontal charola' },
  { id: 'cctv', label: 'Videovigilancia IP', searchQuery: 'camara ip nvr hikvision dvr cctv colorvu' },
  { id: 'access-control', label: 'Control de Acceso', searchQuery: 'biometrico facial huella cerradura electroiman torniquete' },
  { id: 'storage', label: 'Servidores & Almacenamiento', searchQuery: 'disco duro purz ssd servidor nas synology' },
  { id: 'audio-video', label: 'Audio & Video Profesional', searchQuery: 'bocina ip amplificador microfono matriz hdmi' },
  { id: 'solar', label: 'Energía & Respaldo UPS', searchQuery: 'ups no break regulador bateria solar' },
];

// Configuración de Pestañas para 'Para Ti' (Redes Inalámbricas & IT como primera pestaña)
const FOR_YOU_TABS: ShowcaseTab[] = [
  { id: 'wireless', label: 'Redes Inalámbricas & IT', searchQuery: 'access point router mesh wifi ruijie ubiquiti' },
  { id: 'cabling-tech', label: 'Cableado y Conectividad', searchQuery: 'bobina utp cat6 patch cord jack rj45 linkedpro' },
  { id: 'cctv-smart', label: 'Cámaras & Seguridad', searchQuery: 'camara ip bala domo nvr 4k hikvision' },
  { id: 'ubiquiti', label: 'UBIQUITI', marca: 'UBIQUITI' },
  { id: 'ruijie', label: 'RUIJIE REYEE', marca: 'RUIJIE' },
  { id: 'hikvision', label: 'HIKVISION', marca: 'HIKVISION' },
  { id: 'linkedpro', label: 'LINKEDPRO', marca: 'LINKEDPRO BY EPCOM' },
  { id: 'cambium', label: 'CAMBIUM NETWORKS', marca: 'CAMBIUM NETWORKS' },
  { id: 'epcom-power', label: 'EPCOM POWERLINE', marca: 'EPCOM POWERLINE' },
];

interface HomePageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    marca?: string;
    orden?: string;
    sucursal?: string;
    nuevo?: string;
    caja_abierta?: string;
    en_existencia?: string;
    en_oferta?: string;
    outlet?: string;
  }>;
}

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;
  const isLandingView = 
    !searchParams.category && 
    !searchParams.search && 
    !searchParams.marca && 
    !searchParams.nuevo && 
    !searchParams.caja_abierta && 
    !searchParams.en_existencia && 
    !searchParams.en_oferta && 
    !searchParams.outlet && 
    !searchParams.orden;

  const categoryForFilter = searchParams.category === 'all' ? undefined : searchParams.category;
  const searchTerm = searchParams.search || undefined;
  const marca = searchParams.marca || undefined;
  const orden = searchParams.orden || undefined;
  const sucursal = searchParams.sucursal || undefined;
  const nuevo = searchParams.nuevo === 'true';
  const cajaAbierta = searchParams.caja_abierta === 'true';
  const enExistencia = searchParams.en_existencia === 'true';
  const oferta = searchParams.en_oferta === 'true';
  const outlet = searchParams.outlet === 'true';

  let categories: Category[] = [];
  let sucursales: {id: string, nombre: string}[] = [];
  try {
    const [cats, sucs] = await Promise.all([
      getCategories(),
      import('@/services/productService').then(m => m.getSucursales())
    ]);
    categories = cats;
    sucursales = sucs;
  } catch (error) {
    console.error("Error fetching categories on HomePage", error);
  }

  let productsToDisplay: Product[] = [];
  let featuredProductsForSection: Product[] = []; 
  let featuredCategoriesForSection: Category[] = [];

  if (isLandingView) {
    // Fetch data for landing page sections in parallel
    [featuredProductsForSection, featuredCategoriesForSection] = await Promise.all([
      getProducts(undefined, undefined, 4),
      getCategories().then(cats => {
        const featured = cats.filter(c => c.isFeatured === true);
        return featured.length > 0 
          ? featured 
          : cats.filter(c => c.level === 1 && c.isVisible !== false).slice(0, 6);
      })
    ]);
  } else {
    productsToDisplay = await getProducts(
      categoryForFilter, 
      searchTerm, 
      undefined, 
      marca, 
      orden, 
      sucursal, 
      nuevo, 
      cajaAbierta, 
      enExistencia,
      oferta,
      outlet
    );
  }

  return (
    <div className="space-y-10 md:space-y-14 lg:space-y-16">
      {isLandingView ? (
        <>
          {/* SEO: H1 server-rendered */}
          <h1 className="sr-only">Borarly — Mayorista Tecnológico en Seguridad Electrónica, Videovigilancia y Redes en México</h1>
          <HeroSection />
          
          <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {/* 1. SERVICIOS INTEGRALES BORARLY (PRIMERA SECCIÓN) */}
            <ServiceHighlights />

            {/* 2. CATEGORÍAS DESTACADAS */}
            <FeaturedCategoriesSection categories={featuredCategoriesForSection} />

            {/* 3. SECCIÓN EN TENDENCIA (SYSCOM STYLE) */}
            <CategoryShowcaseCarousel
              title="En Tendencia"
              icon="trend"
              tabs={TRENDING_TABS}
              defaultTabId="switches"
            />

            {/* 3. SECCIÓN PARA TI (SYSCOM STYLE) */}
            <CategoryShowcaseCarousel
              title="Para Ti"
              icon="sparkle"
              tabs={FOR_YOU_TABS}
              defaultTabId="wireless"
            />

            {/* 4. MARCAS DESTACADAS Y EVENTOS */}
            <FeaturedBrands />
            <UpcomingEventsSection />
          </div>
        </>
      ) : (
        <div className="container mx-auto py-8">
           <Suspense fallback={<ProductDisplaySkeleton categories={categories} />}>
            <ProductDisplay
              initialProducts={productsToDisplay}
              categories={categories}
              currentCategory={searchParams.category === 'all' ? null : searchParams.category || null}
              currentSearch={searchTerm}
              currentMarca={marca}
              currentOrden={orden}
              currentSucursal={sucursal}
              currentNuevo={nuevo}
              currentCajaAbierta={cajaAbierta}
              currentEnExistencia={enExistencia}
              currentOferta={oferta}
              currentOutlet={outlet}
              sucursales={sucursales}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}

function FeaturedProductsSkeleton() {
  return (
    <div className="container px-4 md:px-6">
      <div className="mb-8 text-center">
        <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CardSkeleton() {
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

function ProductDisplaySkeleton({ categories }: { categories: Category[] }) {
  return (
    <>
      <div className="mb-8">
        <Skeleton className="h-7 w-1/4 mb-3" />
        <div className="flex w-full space-x-2 p-2 border rounded-md">
            <Skeleton className="h-10 w-24" />
          {categories.slice(0,4).map((category) => (
            <Skeleton key={category.id} className="h-10 w-24" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
