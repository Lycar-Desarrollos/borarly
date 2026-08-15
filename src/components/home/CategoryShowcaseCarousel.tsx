"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronLeft, ChevronRight, ShoppingCart, Check, Copy, 
  Loader2, Plus, Minus, Flame, Sparkles, Box, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface ShowcaseTab {
  id: string;
  label: string;
  categoryId?: string;
  searchQuery?: string;
  marca?: string;
}

interface CategoryShowcaseCarouselProps {
  title: string;
  icon?: 'trend' | 'sparkle';
  tabs: ShowcaseTab[];
  defaultTabId?: string;
  initialProducts?: Product[];
}

export function CategoryShowcaseCarousel({
  title,
  icon = 'trend',
  tabs,
  defaultTabId,
  initialProducts = []
}: CategoryShowcaseCarouselProps) {
  const [activeTabId, setActiveTabId] = useState<string>(defaultTabId || tabs[0]?.id || '');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState<boolean>(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Fetch products when tab changes
  useEffect(() => {
    if (!activeTab) return;

    let isMounted = true;
    async function loadTabProducts() {
      setLoading(true);
      try {
        let url = '/api/search?';
        if (activeTab.categoryId) {
          url = `/api/search?category=${activeTab.categoryId}`;
        } else if (activeTab.searchQuery) {
          url = `/api/search?q=${encodeURIComponent(activeTab.searchQuery)}`;
        } else if (activeTab.marca) {
          url = `/api/search?q=${encodeURIComponent(activeTab.marca)}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.results)) {
            setProducts(data.results);
          }
        }
      } catch (error) {
        console.error("Error loading showcase products", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTabProducts();
    return () => { isMounted = false; };
  }, [activeTabId, activeTab]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = (product: Product) => {
    const qty = quantities[product.id] || 1;
    for (let i = 0; i < qty; i++) {
      addToCart(product);
    }
    toast({
      title: "Agregado al Carrito",
      description: `${qty}x ${product.name} añadido a tu cotización`,
    });
  };

  const handleCopySku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
    toast({ description: `Modelo ${sku} copiado` });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const sectionId = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');

  return (
    <section id={sectionId} className="space-y-4 my-10 scroll-mt-24">
      
      {/* 1. HEADER: TÍTULO Y BOTONES DE NAVEGACIÓN */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {icon === 'trend' ? (
            <Flame className="w-6 h-6 text-amber-500" />
          ) : (
            <Sparkles className="w-6 h-6 text-cyan-500" />
          )}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {title}
          </h2>
        </div>

        {/* Flechas de desplazamiento */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            className="h-8 w-8 rounded-full border-border/80 hover:bg-primary/10 shadow-2xs"
            aria-label="Desplazar a la izquierda"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            className="h-8 w-8 rounded-full border-border/80 hover:bg-primary/10 shadow-2xs"
            aria-label="Desplazar a la derecha"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. CHIPS / TABS DE CATEGORÍAS Y MARCAS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 border select-none",
                isActive 
                  ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/80 border-border/60"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. CARRUSEL HORIZONTAL DE PRODUCTOS (SYSCOM STYLE) */}
      <div className="relative group/carousel">
        {loading ? (
          <div className="flex items-center justify-center h-80 bg-card/40 border rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : products.length > 0 ? (
          <div 
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-0.5"
          >
            {products.map((product) => {
              const rawImg = product.imageUrls?.[0] || 'https://placehold.co/400x400.png';
              const thumbUrl = rawImg.includes('syscom.mx') 
                ? `/api/image-proxy?url=${encodeURIComponent(rawImg)}` 
                : rawImg;

              const qty = quantities[product.id] || 1;
              const modelSku = product.line || product.id;

              return (
                <div 
                  key={product.id}
                  className="w-[240px] sm:w-[260px] flex-shrink-0 flex flex-col justify-between bg-card border border-border/70 rounded-2xl p-3.5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all group"
                >
                  <div>
                    {/* Imagen del Producto con Zoom Hover */}
                    <Link href={`/products/${product.id}`} className="block relative aspect-square w-full bg-white rounded-xl overflow-hidden mb-3 border border-border/40 p-2">
                      <Image 
                        src={thumbUrl} 
                        alt={product.name} 
                        fill 
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        unoptimized={true}
                      />
                    </Link>

                    {/* Marca y Modelo con Copiar */}
                    <div className="space-y-1 mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                        {product.brand || 'SYSCOM'}
                      </p>

                      <Link href={`/products/${product.id}`}>
                        <h3 className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {product.name}
                        </h3>
                      </Link>

                      {/* SKU / Modelo */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-mono font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                          {modelSku}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopySku(modelSku)}
                          title="Copiar Modelo"
                          className="text-muted-foreground hover:text-foreground p-1"
                        >
                          {copiedSku === modelSku ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Precios, Stock y Botón Agregar */}
                  <div className="pt-2 border-t border-border/50 space-y-2.5">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground font-bold">MXN </span>
                        <span className="text-base font-black text-foreground">{formatCurrency(product.price).replace('MXN', '').trim()}</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground font-medium uppercase">IVA incluido</span>
                    </div>

                    {/* Badge de Stock */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <Box className="w-3 h-3" />
                        {product.stock > 0 ? `${product.stock}+ en stock` : 'Disponible'}
                      </span>
                    </div>

                    {/* Stepper Cantidad + Botón Agregar Amarillo/Ámbar */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center border rounded-xl bg-background overflow-hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(product.id, -1)}
                          className="px-2 py-1 text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-foreground select-none">{qty}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(product.id, 1)}
                          className="px-2 py-1 text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        className="flex-grow bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black text-xs rounded-xl gap-1.5 shadow-2xs transition-all active:scale-95"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </Button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-card/40 border rounded-2xl text-muted-foreground text-sm">
            No hay productos disponibles en esta categoría temporalmente.
          </div>
        )}
      </div>

    </section>
  );
}
