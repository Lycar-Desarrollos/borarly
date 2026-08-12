"use client"; 

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X, ChevronRight, ChevronDown, Package, CheckCircle2, Share2, Heart, Info, ShoppingCart, Zap, ShieldCheck, Copy } from 'lucide-react'; 
import { AddToCartButton } from '@/components/products/AddToCartButton';
import { AddToWishlistButton } from '@/components/products/AddToWishlistButton'; 
import { ShareButtons } from '@/components/products/ShareButtons';
import { ProductList } from '@/components/products/ProductList';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Product, Category } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getProfitMargin, getShippingSettings } from '@/services/settingsService';

interface ProductDetailViewProps {
    product: Product;
    relatedProducts: Product[];
    allCategories: Category[];
}

export function ProductDetailView({ product, relatedProducts, allCategories }: ProductDetailViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [profitMargin, setProfitMargin] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { currentUser, addToWishlist, removeFromWishlist, isProductInWishlist } = useAuth();
  const router = useRouter();
  
  const isInWishlist = isProductInWishlist(product.id);

  const categoryPath = useMemo(() => {
    if (!product.category || !allCategories.length) return [];
    
    const path: Category[] = [];
    const categoryMap = new Map(allCategories.map(c => [c.id, c]));
    
    let currentId: string | null | undefined = product.category;
    while(currentId) {
        const category = categoryMap.get(currentId);
        if (category) {
            path.unshift(category);
            currentId = category.parentId;
        } else {
            break;
        }
    }
    return path;
  }, [product.category, allCategories]);

  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleMainImageDoubleClick = () => {
    if (product.imageUrls && product.imageUrls.length > 0) {
      setZoomedImageUrl(product.imageUrls[selectedImageIndex]);
      setIsZoomModalOpen(true);
    }
  };

  useEffect(() => {
    async function loadSettings() {
        const margin = await getProfitMargin();
        const ship = await getShippingSettings();
        setProfitMargin(margin);
        setShippingCost(ship.cost);
    }
    loadSettings();
  }, []);

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    if (quantity > 0) {
      addToCart(product, quantity);
      router.push('/cart');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: product.name,
                text: `Mira este producto: ${product.name}`,
                url: window.location.href,
            });
        } catch (error) {
            console.log("Error compartiendo", error);
        }
    } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ description: "Enlace copiado al portapapeles" });
    }
  };

  const handleToggleWishlist = () => {
    if (!currentUser) {
        toast({ description: "Inicia sesión para guardar productos", variant: "destructive" });
        return;
    }
    if (isInWishlist) {
        removeFromWishlist(product.id);
        toast({ description: "Producto eliminado de guardados" });
    } else {
        addToWishlist(product.id);
        toast({ description: "Producto guardado correctamente" });
    }
  };

  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(product.price);

  const mainImageUrl = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls[selectedImageIndex] 
    : "https://placehold.co/600x400.png?text=Sin+Imagen";
  
  const mainImageAiHint = (product.imageUrls && product.imageUrls.length > 0 && product.imageUrls[selectedImageIndex].includes('placehold.co')) || !product.imageUrls || product.imageUrls.length === 0
    ? (product.name.split(" ").slice(0,2).join(" ").toLowerCase() || `imagen de producto ${selectedImageIndex + 1}`) 
    : undefined;

  return (
    <div className="space-y-8">
      <div className="flex items-baseline gap-6">
        <Link href="/" legacyBehavior passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Productos
          </Button>
        </Link>
      <div className="flex flex-wrap items-center text-[13px] text-muted-foreground gap-1.5 py-2">
        <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
        <ChevronRight className="h-3 w-3" />
        {product.categorias_adicionales && product.categorias_adicionales.length > 0 ? (
          product.categorias_adicionales.map((cat, index) => (
            <React.Fragment key={cat.id}>
               <Link href={`/?category=${cat.id}`} className="hover:text-white transition-colors truncate">
                  {cat.nombre}
               </Link>
               {index < (product.categorias_adicionales?.length || 0) - 1 && <ChevronRight className="h-3 w-3 shrink-0" />}
            </React.Fragment>
          ))
        ) : (
          categoryPath.map((cat, index) => (
            <React.Fragment key={cat.id}>
                <Link href={`/?category=${cat.id}`} className="hover:text-white transition-colors">
                    {cat.alias || cat.name}
                </Link>
                {index < categoryPath.length - 1 && <ChevronRight className="h-3 w-3 shrink-0" />}
            </React.Fragment>
          ))
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-500 truncate">{product.line}</span>
      </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: GALERIA Y CARACTERISTICAS (8 COL) */}
        <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Galería con Carrusel Interactiva */}
                <div className="md:col-span-2 order-2 md:order-1 relative group h-full">
                    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar scroll-smooth h-full max-h-[480px] pb-2 md:pb-0 pr-1 select-none" id="thumbnail-container">
                        {product.imageUrls && product.imageUrls.map((url, index) => {
                            const proxyUrl = url.includes('syscom.mx') ? `/api/image-proxy?url=${encodeURIComponent(url)}` : url;
                            return (
                              <div
                                  key={index}
                                  className={cn(
                                      "w-16 h-16 md:w-full aspect-square relative rounded-lg border-2 cursor-pointer bg-white shrink-0 transition-all hover:border-primary/50",
                                      index === selectedImageIndex ? "border-primary shadow-sm" : "border-slate-100 dark:border-slate-800"
                                  )}
                                  onClick={() => setSelectedImageIndex(index)}
                              >
                                  <Image src={proxyUrl} alt={`thumbnail-${index}`} fill className="object-contain p-1.5 rounded-md" />
                              </div>
                            );
                        })}
                    </div>
                    
                    {/* Botones de Navegación del Carrusel (Solo si hay más de 5 imágenes) */}
                    {product.imageUrls && product.imageUrls.length > 5 && (
                        <>
                            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-background to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden md:block z-10" />
                            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden md:block z-10" />
                            
                            <button 
                                onClick={() => {
                                    const container = document.getElementById('thumbnail-container');
                                    if (container) container.scrollBy({ top: -120, behavior: 'smooth' });
                                }}
                                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-popover border rounded-full p-1.5 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hidden md:block z-20"
                            >
                                <ChevronDown className="w-4 h-4 rotate-180" />
                            </button>
                            <button 
                                onClick={() => {
                                    const container = document.getElementById('thumbnail-container');
                                    if (container) container.scrollBy({ top: 120, behavior: 'smooth' });
                                }}
                                className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-popover border rounded-full p-1.5 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hidden md:block z-20"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>

                {/* Imagen Principal */}
                <div className="md:col-span-10 order-1 md:order-2">
                    <div className="aspect-[4/3] relative rounded-xl overflow-hidden bg-white border border-slate-800 group cursor-zoom-in"
                         onDoubleClick={handleMainImageDoubleClick}>
                        <Image
                            src={mainImageUrl.includes('syscom.mx') ? `/api/image-proxy?url=${encodeURIComponent(mainImageUrl)}` : mainImageUrl}
                            alt={product.name}
                            fill
                            priority
                            unoptimized={true}
                            className="object-contain p-8 transition-transform group-hover:scale-105"
                        />
                    </div>
                </div>
            </div>

            {/* Puntos Clave */}
            <div className="space-y-6">
                {product.puntos_clave && product.puntos_clave.length > 0 && (
                    <div className="grid grid-cols-1 gap-3">
                        {product.puntos_clave.map((punto: string, i: number) => (
                            <div key={i} className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-[#00E676] shrink-0 mt-0.5" />
                                <span className="text-[15px] text-zinc-300">{punto}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <Separator className="bg-slate-800" />
            
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground dark:text-white uppercase tracking-tighter">Especificaciones Técnicas</h3>
                {product.description && product.description.includes('<') ? (
                    <div 
                        className="prose dark:prose-invert max-w-none text-muted-foreground dark:text-zinc-400 text-sm leading-relaxed syscom-html-content"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                ) : (
                    <div className="prose dark:prose-invert max-w-none text-muted-foreground dark:text-zinc-400 text-sm leading-relaxed">
                        {product.description}
                    </div>
                )}
            </div>
        </div>

        {/* COLUMNA DERECHA: PREMIUM BUY BOX (4 COL) */}
        <div className="lg:col-span-4 sticky top-24 z-10 transition-all duration-300">
            <div className="bg-card/80 dark:bg-[#0b1120]/80 backdrop-blur-xl border border-border dark:border-slate-800 rounded-3xl p-5 xl:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-5">
                
                {/* 1. PRODUCT HEADER (Compact & Elegant) */}
                <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                        {product.brand && (
                            <span className="px-2 py-1 bg-[#00E676]/10 text-[#00E676] text-[10px] md:text-[11px] font-black rounded-full uppercase tracking-widest border border-[#00E676]/20">
                                {product.brand}
                            </span>
                        )}
                        {product.marca_logo && (
                            <div className="shrink-0">
                                <Image 
                                    src={product.marca_logo} 
                                    alt="brand" 
                                    width={48} 
                                    height={48} 
                                    className="object-contain h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/5 p-1 border border-white/10 shadow-sm"
                                    unoptimized={true}
                                />
                            </div>
                        )}
                    </div>
                    
                    <h1 className="text-[17px] md:text-[19px] font-black text-foreground dark:text-white leading-snug tracking-tighter">
                        {product.name}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-2">
                        <div className="flex items-center gap-1.5 group">
                            <p className="text-[10px] md:text-[11px] font-bold text-[#007AFF] tracking-wider uppercase">
                                Modelo: <span className="text-muted-foreground dark:text-zinc-300 ml-0.5">{product.line}</span>
                            </p>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(product.line || '');
                                    toast({ description: "Modelo copiado al portapapeles" });
                                }}
                                className="text-muted-foreground opacity-50 group-hover:opacity-100 dark:text-zinc-500 hover:text-foreground dark:hover:text-white transition-opacity"
                                title="Copiar Modelo"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                        {product.sat_code && (
                            <p className="text-[11px] md:text-xs font-bold text-zinc-500 tracking-wider uppercase">
                                Código SAT: <span className="text-muted-foreground dark:text-zinc-300 ml-0.5">{product.sat_code}</span>
                            </p>
                        )}
                    </div>
                </div>

                <Separator className="bg-slate-800/50" />

                {/* 2. PRICING SECTION */}
                <div className="relative overflow-hidden group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#00E676]/10 to-transparent rounded-2xl blur opacity-25 group-hover:opacity-60 transition duration-1000"></div>
                    <div className="relative">
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Precio final</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl md:text-4xl font-black text-foreground dark:text-white tracking-tighter drop-shadow-sm">
                                MXN {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product.price).replace('MXN', '').trim()}
                            </span>
                        </div>
                        <p className="text-[10px] text-[#00E676] font-bold flex flex-wrap items-center gap-1.5 mt-2 leading-tight">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> <span className="whitespace-nowrap">IVA INCLUIDO</span> <span className="hidden sm:inline">•</span> <span className="whitespace-nowrap">ENTREGA INMEDIATA</span>
                        </p>
                    </div>
                </div>

                {/* 3. PRIMARY ACTIONS */}
                <div className="space-y-3">
                    <div className="flex gap-3">
                        {/* Selector de Cantidad Premium */}
                        <div className="flex items-center bg-muted dark:bg-slate-900/50 border border-border dark:border-slate-800 rounded-xl px-1.5 py-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white rounded-lg"
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            >
                                -
                            </Button>
                            <span className="text-foreground dark:text-white font-black text-sm w-6 text-center">{quantity}</span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white rounded-lg"
                                onClick={() => setQuantity(q => q + 1)}
                            >
                                +
                            </Button>
                        </div>
                        {/* Add to Cart */}
                        <Button 
                            onClick={handleAddToCart}
                            className="flex-1 bg-foreground hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-background dark:text-black h-12 font-black rounded-xl gap-2 shadow-lg transition-all text-sm group"
                        >
                            <ShoppingCart className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                            Añadir
                        </Button>
                    </div>

                    {/* Quick Checkout (Highlight) */}
                    <Button 
                        onClick={handleBuyNow}
                        className="w-full bg-[#007AFF] hover:bg-blue-600 text-white h-14 font-black rounded-xl gap-2 text-sm md:text-base uppercase tracking-wider transition-all shadow-[0_8px_25px_rgba(0,122,255,0.25)] group"
                    >
                        <Zap className="w-5 h-5 fill-white flex-shrink-0 group-hover:scale-110 transition-transform" />
                        Comprar Ahora
                    </Button>
                </div>

                {/* 4. TRUST BADGES GRID */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-muted/50 dark:bg-slate-900/40 border border-border dark:border-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center text-center group hover:border-[#007AFF]/30 transition-colors">
                        <Package className="w-5 h-5 text-[#007AFF] mb-1.5 group-hover:-translate-y-0.5 transition-transform" />
                        <p className="text-[9px] text-muted-foreground dark:text-zinc-500 font-black uppercase tracking-tighter">Existencias</p>
                        <p className="text-sm font-black text-foreground dark:text-white leading-none mt-1">{product.stock >= 500 ? '500+' : product.stock}</p>
                    </div>
                    <div className="bg-muted/50 dark:bg-slate-900/40 border border-border dark:border-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center text-center group hover:border-[#00E676]/30 transition-colors">
                        <ShieldCheck className="w-5 h-5 text-[#00E676] mb-1.5 group-hover:-translate-y-0.5 transition-transform" />
                        <p className="text-[9px] text-muted-foreground dark:text-zinc-500 font-black uppercase tracking-tighter">Garantía</p>
                        <p className="text-sm font-black text-foreground dark:text-white leading-none mt-1">3 Años</p>
                    </div>
                </div>

                {/* 5. SECONDARY METADATA & ACTIONS */}
                <div className="pt-3">
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <Button 
                            variant="ghost" 
                            onClick={handleToggleWishlist}
                            className={cn(
                                "h-8 text-[10px] font-black uppercase rounded-lg gap-2 transition-colors",
                                isInWishlist 
                                    ? "text-destructive hover:bg-destructive/10" 
                                    : "text-muted-foreground hover:text-foreground dark:text-zinc-500 dark:hover:text-white"
                            )}
                        >
                            <Heart className={cn("w-3.5 h-3.5", isInWishlist && "fill-destructive")} /> 
                            {isInWishlist ? 'Guardado' : 'Guardar'}
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={handleShare}
                            className="text-muted-foreground hover:text-foreground dark:text-zinc-500 dark:hover:text-white dark:hover:bg-white/5 h-8 text-[10px] font-black uppercase rounded-lg gap-2"
                        >
                            <Share2 className="w-3.5 h-3.5" /> Compartir
                        </Button>
                    </div>
                </div>

            </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-semibold mb-6">Productos Relacionados</h2>
          <ProductList products={relatedProducts} />
        </div>
      )}

      <Dialog open={isZoomModalOpen} onOpenChange={setIsZoomModalOpen}>
        <DialogContent className="bg-transparent border-none shadow-none w-auto h-auto max-w-[90vw] max-h-[90vh] p-6 flex flex-col items-center justify-center">
          <DialogHeader className="w-full">
            <DialogTitle className="text-center text-sm text-primary-foreground mb-2">
              {product.name}
            </DialogTitle>
          </DialogHeader>
          <Image
            src={zoomedImageUrl}
            alt={`Imagen ampliada de ${product.name}`}
            width={1200} 
            height={800} 
            objectFit="contain"
            className="block max-w-full max-h-full rounded-md"
            data-ai-hint={product.name.split(" ").slice(0,2).join(" ").toLowerCase() || "zoomed product image"}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
