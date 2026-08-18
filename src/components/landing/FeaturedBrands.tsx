
"use client";

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { FeaturedBrand } from '@/lib/types';
import { getFeaturedBrands } from '@/services/featuredBrandService';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const FALLBACK_BRANDS: FeaturedBrand[] = [
  { id: 'hikvision', name: 'Hikvision', logoUrl: 'https://www.syscom.mx/imagetipos/hikvision.png', order: 1, createdAt: '', updatedAt: '' },
  { id: 'epcom', name: 'EPCOM', logoUrl: 'https://www.syscom.mx/imagetipos/epcom.png', order: 2, createdAt: '', updatedAt: '' },
  { id: 'hilook', name: 'HiLook', logoUrl: 'https://www.syscom.mx/imagetipos/hilook.png', order: 3, createdAt: '', updatedAt: '' },
  { id: 'ubiquiti', name: 'Ubiquiti', logoUrl: 'https://www.syscom.mx/imagetipos/ubiquiti.png', order: 4, createdAt: '', updatedAt: '' },
  { id: 'tp-link', name: 'TP-Link', logoUrl: 'https://www.syscom.mx/imagetipos/tplink.png', order: 5, createdAt: '', updatedAt: '' },
  { id: 'grandstream', name: 'Grandstream', logoUrl: 'https://www.syscom.mx/imagetipos/grandstream.png', order: 6, createdAt: '', updatedAt: '' },
  { id: 'western_digital', name: 'Western Digital', logoUrl: 'https://www.syscom.mx/imagetipos/western_digital.png', order: 7, createdAt: '', updatedAt: '' },
  { id: 'seagate', name: 'Seagate', logoUrl: 'https://www.syscom.mx/imagetipos/seagate.png', order: 8, createdAt: '', updatedAt: '' },
  { id: 'zkteco', name: 'ZKTeco', logoUrl: 'https://www.syscom.mx/imagetipos/zkteco.png', order: 9, createdAt: '', updatedAt: '' },
  { id: 'honeywell', name: 'Honeywell', logoUrl: 'https://www.syscom.mx/imagetipos/honeywell.png', order: 10, createdAt: '', updatedAt: '' },
  { id: 'resideo', name: 'Resideo', logoUrl: 'https://www.syscom.mx/imagetipos/resideo.png', order: 11, createdAt: '', updatedAt: '' },
  { id: 'linkedpro', name: 'LinkedPro', logoUrl: 'https://www.syscom.mx/imagetipos/linkedpro.png', order: 12, createdAt: '', updatedAt: '' },
  { id: 'precision', name: 'Precision', logoUrl: 'https://www.syscom.mx/imagetipos/precision.png', order: 13, createdAt: '', updatedAt: '' },
  { id: 'dahua', name: 'Dahua', logoUrl: 'https://www.syscom.mx/imagetipos/dahua.png', order: 14, createdAt: '', updatedAt: '' },
  { id: 'axis', name: 'Axis', logoUrl: 'https://www.syscom.mx/imagetipos/axis.png', order: 15, createdAt: '', updatedAt: '' },
  { id: 'bosch', name: 'Bosch', logoUrl: 'https://www.syscom.mx/imagetipos/bosch.png', order: 16, createdAt: '', updatedAt: '' },
  { id: 'pelco', name: 'Pelco', logoUrl: 'https://www.syscom.mx/imagetipos/pelco.png', order: 17, createdAt: '', updatedAt: '' },
  { id: 'cisco', name: 'Cisco', logoUrl: 'https://www.syscom.mx/imagetipos/cisco.png', order: 18, createdAt: '', updatedAt: '' },
  { id: 'panduit', name: 'Panduit', logoUrl: 'https://www.syscom.mx/imagetipos/panduit.png', order: 19, createdAt: '', updatedAt: '' },
  { id: 'belden', name: 'Belden', logoUrl: 'https://www.syscom.mx/imagetipos/belden.png', order: 20, createdAt: '', updatedAt: '' },
];

export function FeaturedBrands() {
  const [brands, setBrands] = useState<FeaturedBrand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      try {
        const fetchedBrands = await getFeaturedBrands();
        setBrands(fetchedBrands.length > 0 ? fetchedBrands : FALLBACK_BRANDS);
      } catch (error) {
        console.error("Failed to load featured brands:", error);
        setBrands(FALLBACK_BRANDS);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-slate-900/30">
        <div className="container px-4 mx-auto">
           <Skeleton className="h-8 w-64 mx-auto mb-10" />
           <div className="flex gap-8 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-40 shrink-0 rounded-xl" />
              ))}
           </div>
        </div>
      </section>
    );
  }

  // Duplicate brands for seamless marquee
  const displayBrands = [...brands, ...brands];

  return (
    <section className="py-10 sm:py-16 md:py-24 bg-gradient-to-b from-transparent to-slate-900/50 overflow-hidden">
      <div className="container px-4 mx-auto mb-8 sm:mb-12 text-center">
        <h2 className="text-xs sm:text-sm font-black text-[#00E676] uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-3">Nuestros Aliados</h2>
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tighter">MARCAS DESTACADAS</h3>
      </div>

      <div className="relative flex overflow-hidden">
        <div className="flex gap-5 sm:gap-8 md:gap-12 animate-marquee whitespace-nowrap py-4">
          {displayBrands.map((brand, index) => (
            <Link
              key={`${brand.id}-${index}`}
              href={`/?marca=${encodeURIComponent(brand.name)}`}
              className="group relative flex items-center justify-center bg-white p-4 sm:p-6 rounded-2xl w-32 sm:w-40 md:w-56 h-16 sm:h-20 md:h-28 shadow-xl hover:shadow-2xl hover:shadow-[#00E676]/20 transition-all duration-500 hover:-translate-y-2 shrink-0 border border-transparent hover:border-[#00E676]/30"
            >
              <Image
                src={brand.logoUrl}
                alt={`${brand.name} logo`}
                layout="fill"
                objectFit="contain"
                unoptimized={true}
                className="p-3 md:p-4 transition-all duration-500 transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
