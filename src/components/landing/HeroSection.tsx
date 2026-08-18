
"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { HeroSlide } from '@/lib/types';
import { getHeroSlides } from '@/services/heroSlideService';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Skeleton } from '@/components/ui/skeleton';

export function HeroSection() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      setIsLoading(true);
      try {
        const fetchedSlides = (await getHeroSlides(true)); 
        setSlides(fetchedSlides);
      } catch (error) {
        console.error("Error fetching hero slides:", error);
        setSlides([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSlides();
  }, []);

  if (isLoading) {
    return (
      <section className="container mx-auto px-0 sm:px-4 md:px-6">
        <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] rounded-2xl overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="container mx-auto px-0 sm:px-4 md:px-6">
        <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] group bg-muted rounded-2xl overflow-hidden border border-border/40 shadow-sm">
          <Image
            src="https://placehold.co/1200x600.png"
            alt="Banner promocional Borarly"
            layout="fill"
            objectFit="cover"
            objectPosition="center"
            className="transition-transform duration-500 group-hover:scale-105"
            priority
            data-ai-hint="store promotion sales"
          />
          <div className="absolute inset-0 bg-black/30 flex flex-col items-start justify-end p-3 sm:p-6 md:p-12">
            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-3 sm:p-4 md:p-6 rounded-xl max-w-[92%] sm:max-w-md shadow-xl border border-white/20">
              <h1 className="text-base sm:text-xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Bienvenido a <span className="text-primary">BORARLY</span>
              </h1>
              <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-300 line-clamp-2 sm:line-clamp-none">
                Distribuidor mayorista en seguridad electrónica, videovigilancia y redes.
              </p>
              <Link href="/?category=all">
                <Button size="sm" className="mt-2.5 sm:mt-4 sm:h-10 sm:px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md">
                  Explorar Catálogo <span className="ml-2 text-base">›</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-0 sm:px-4 md:px-6">
      <div className="relative w-full group">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 5000,
              stopOnInteraction: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent>
            {slides.map((slide, index) => {
              const hasOverlay = !!(slide.title || slide.description || slide.buttonText);
              const hasLink = !!slide.buttonLink;

              const slideContent = (
                <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] overflow-hidden rounded-2xl bg-muted border border-border/40 shadow-sm">
                  <Image
                    src={slide.imageUrl || "https://placehold.co/1200x600.png"}
                    alt={slide.altText || slide.title || "Banner promocional"}
                    layout="fill"
                    objectFit="cover"
                    objectPosition="center"
                    className={`transition-transform duration-700 ease-out ${hasLink ? 'hover:scale-[1.01] cursor-pointer' : ''}`}
                    priority={index === 0}
                    data-ai-hint={slide.altText?.split(' ').slice(0, 2).join(' ') || "hero banner"}
                  />
                  {hasOverlay && (
                    <div className="absolute inset-0 bg-black/30 flex flex-col items-start justify-end p-3 sm:p-6 md:p-12">
                      <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-3 sm:p-4 md:p-6 rounded-xl max-w-[92%] sm:max-w-md shadow-xl border border-white/20">
                        {slide.title && (
                          <h1 className="text-base sm:text-xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight line-clamp-2">
                            {slide.title}
                          </h1>
                        )}
                        {slide.description && (
                          <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-300 line-clamp-2 sm:line-clamp-none">
                            {slide.description}
                          </p>
                        )}
                        {slide.buttonText && (
                          <Button size="sm" className="mt-2.5 sm:mt-4 sm:h-10 sm:px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md">
                            {slide.buttonText} <span className="ml-2 text-base">›</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );

              return (
                <CarouselItem key={slide.id}>
                  {hasLink ? (
                    <Link href={slide.buttonLink!} className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl">
                      {slideContent}
                    </Link>
                  ) : (
                    slideContent
                  )}
                </CarouselItem>
              );
            })}
          </CarouselContent>
          {/* En táctil no existe el hover: las flechas se quedan visibles en móvil */}
          <CarouselPrevious className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-background/80 hover:bg-background text-foreground shadow-lg backdrop-blur-md border border-border/50 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:scale-105" />
          <CarouselNext className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-background/80 hover:bg-background text-foreground shadow-lg backdrop-blur-md border border-border/50 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:scale-105" />
        </Carousel>
      </div>
    </section>
  );
}
