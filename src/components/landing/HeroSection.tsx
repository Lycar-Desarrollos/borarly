
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
      <section className="relative w-full aspect-[12/5]">
        <Skeleton className="w-full h-full" />
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative w-full aspect-[12/5] group bg-muted">
        <Image
          src="https://placehold.co/1200x500.png"
          alt="Banner promocional"
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-500 group-hover:scale-105"
          priority
          data-ai-hint="store promotion sales"
        />
        <div className="absolute inset-0 bg-black/30 flex flex-col items-start justify-end p-6 md:p-12">
          <div className="bg-white/80 backdrop-blur-sm p-4 md:p-6 rounded-lg max-w-md">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900">
              Bienvenido a <span className="text-primary">BORARLY</span>
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-700">
              Tu tienda para ofertas increíbles. Configura los slides del carrusel en el panel de admin.
            </p>
            <Link href="/?category=all" passHref legacyBehavior>
              <Button size="lg" className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                Comprar Ahora <span className="ml-2 text-lg">›</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full group">
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
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id}>
              <div className="relative w-full aspect-[12/5]">
                <Image
                  src={slide.imageUrl || "https://placehold.co/1200x500.png"}
                  alt={slide.altText}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-500 group-hover:scale-105"
                  priority={index === 0}
                  data-ai-hint={slide.altText.split(' ').slice(0,2).join(' ') || "hero banner"}
                />
                 {(slide.title || slide.description || slide.buttonText) && (
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-start justify-end p-6 md:p-12">
                    <div className="bg-white/80 backdrop-blur-sm p-4 md:p-6 rounded-lg max-w-md">
                      {slide.title && (
                        <h1 className="text-2xl md:text-4xl font-bold text-gray-900">
                          {slide.title}
                        </h1>
                      )}
                      {slide.description && (
                        <p className="mt-2 text-sm md:text-base text-gray-700">
                          {slide.description}
                        </p>
                      )}
                      {slide.buttonText && slide.buttonLink && (
                        <Link href={slide.buttonLink} passHref legacyBehavior>
                          <Button size="lg" className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                            {slide.buttonText} <span className="ml-2 text-lg">›</span>
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/50 hover:bg-white/80 text-primary" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/50 hover:bg-white/80 text-primary" />
      </Carousel>
    </section>
  );
}
