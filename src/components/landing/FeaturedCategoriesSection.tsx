"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import type { Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCategoryImageByName } from '@/services/syscom';

interface FeaturedCategoriesSectionProps {
  categories: Category[];
}

export function FeaturedCategoriesSection({ categories }: FeaturedCategoriesSectionProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setShowLeftArrow(container.scrollLeft > 10);
      setShowRightArrow(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="w-full py-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          CATEGORÍAS DESTACADAS
        </h2>
        <Button variant="link" onClick={() => router.push('/?category=all')} className="text-primary hover:underline font-bold text-xs sm:text-sm">
          Mostrar todas
        </Button>
      </div>
      
      {categories.length === 0 ? (
          <div className="text-center py-6 px-4 border border-dashed rounded-md">
             <p className="text-muted-foreground">No hay categorías destacadas en este momento.</p>
             <p className="text-sm text-muted-foreground mt-1">El administrador puede agregar categorías destacadas desde el panel de administración.</p>
          </div>
      ) : (
        <div className="relative group">
          {/* Botones de navegación hermosos */}
          {showLeftArrow && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-md rounded-full -ml-4 hover:bg-primary hover:text-white transition-all hidden md:flex"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          
          {showRightArrow && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-md rounded-full -mr-4 hover:bg-primary hover:text-white transition-all hidden md:flex"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          {/* Gradientes hermosos para indicar más contenido */}
          <div className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-[5] pointer-events-none transition-opacity duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-[5] pointer-events-none transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0'}`} />

          <div 
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="w-full flex space-x-4 pb-4 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {categories.map((category) => {
              const rawImg = category.featuredImageUrl || '';
              const isValidCustom = rawImg && !rawImg.includes('images.unsplash.com') && !rawImg.includes('placehold.co');
              const imageUrl = isValidCustom ? rawImg : getCategoryImageByName(category.name || category.alias || '');
              const nameParts = category.name?.toLowerCase().split(' ') || [];
              const hintText = nameParts.length > 1 ? nameParts.slice(0, 2).join(' ') : nameParts[0] || 'category';
              const aiHint = !isValidCustom ? hintText : undefined;

              return (
                <Link key={category.id} href={`/?category=${encodeURIComponent(category.id)}`} className="block w-48 md:w-56 shrink-0 group">
                    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-transform duration-300 hover:-translate-y-1 rounded-lg h-full flex flex-col border border-border/50">
                      <div className="relative w-full aspect-[3/2] bg-white">
                        <Image
                          src={imageUrl}
                          alt={category.alias || category.name}
                          fill
                          sizes="(max-width: 768px) 192px, 224px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                          unoptimized={!imageUrl.startsWith('/')}
                          {...(aiHint && { "data-ai-hint": aiHint })}
                        />
                      </div>
                      <CardContent className="p-3 bg-card flex-grow flex items-center justify-center border-t border-border/10">
                        <h3 className="text-sm font-semibold text-center text-card-foreground line-clamp-2">{category.alias || category.name}</h3>
                      </CardContent>
                    </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
