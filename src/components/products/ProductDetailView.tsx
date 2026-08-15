"use client"; 

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ChevronRight, ChevronDown, Package, CheckCircle2, 
  Share2, Heart, ShoppingCart, Zap, ShieldCheck, Copy, 
  FileText, ExternalLink, MessageSquare, Layers, Check
} from 'lucide-react'; 

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ProductList } from '@/components/products/ProductList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getProfitMargin, getShippingSettings } from '@/services/settingsService';
import type { Product, Category } from '@/lib/types';

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

  const rawMainImageUrl = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls[selectedImageIndex] 
    : "https://placehold.co/600x400.png?text=Sin+Imagen";

  const mainImageUrl = rawMainImageUrl.includes('syscom.mx') 
    ? `/api/image-proxy?url=${encodeURIComponent(rawMainImageUrl)}` 
    : rawMainImageUrl;

  const whatsappMessage = encodeURIComponent(
    `Hola, me interesa el producto: ${product.name} (Modelo: ${product.line || product.id}). ¿Tienen disponibilidad y precio por volumen?`
  );

  return (
    <div className="space-y-8">
      {/* NAVEGACIÓN SUPERIOR / BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <ArrowLeft className="h-4 w-4" /> Volver a Productos
          </Button>
        </Link>
        <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-1.5 py-1">
          <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          {product.categorias_adicionales && product.categorias_adicionales.length > 0 ? (
            product.categorias_adicionales.map((cat, index) => (
              <React.Fragment key={cat.id}>
                 <Link href={`/?category=${cat.id}`} className="hover:text-foreground transition-colors truncate">
                    {cat.nombre}
                 </Link>
                 {index < (product.categorias_adicionales?.length || 0) - 1 && <ChevronRight className="h-3 w-3 shrink-0" />}
              </React.Fragment>
            ))
          ) : (
            categoryPath.map((cat, index) => (
              <React.Fragment key={cat.id}>
                  <Link href={`/?category=${cat.id}`} className="hover:text-foreground transition-colors">
                      {cat.alias || cat.name}
                  </Link>
                  {index < categoryPath.length - 1 && <ChevronRight className="h-3 w-3 shrink-0" />}
              </React.Fragment>
            ))
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-semibold truncate">{product.line || product.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: HERO GALERÍA, BADGES Y PUNTOS CLAVE (7 COL) */}
        <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Galería con Miniaturas */}
                <div className="md:col-span-2 order-2 md:order-1 relative group h-full">
                    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar scroll-smooth h-full max-h-[480px] pb-2 md:pb-0 pr-1 select-none" id="thumbnail-container">
                        {product.imageUrls && product.imageUrls.map((url, index) => {
                            const thumbUrl = url.includes('syscom.mx') 
                              ? `/api/image-proxy?url=${encodeURIComponent(url)}` 
                              : url;
                            return (
                              <div
                                  key={index}
                                  className={cn(
                                      "w-16 h-16 md:w-full aspect-square relative rounded-xl border-2 cursor-pointer bg-white shrink-0 transition-all hover:border-primary/50 overflow-hidden shadow-sm",
                                      index === selectedImageIndex ? "border-primary ring-2 ring-primary/20" : "border-border/60"
                                  )}
                                  onClick={() => setSelectedImageIndex(index)}
                              >
                                  <Image src={thumbUrl} alt={`thumbnail-${index}`} fill className="object-contain p-1.5" />
                              </div>
                            );
                        })}
                    </div>
                </div>

                {/* Imagen Principal */}
                <div className="md:col-span-10 order-1 md:order-2">
                    <div className="aspect-[4/3] relative rounded-2xl overflow-hidden bg-white border border-border/60 group cursor-zoom-in shadow-sm"
                         onDoubleClick={handleMainImageDoubleClick}>
                        <Image
                            src={mainImageUrl}
                            alt={product.name}
                            fill
                            priority
                            unoptimized={true}
                            className="object-contain p-8 transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute bottom-3 right-3 text-[10px] text-zinc-400 bg-white/80 dark:bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm pointer-events-none">
                          Doble clic para ampliar
                        </div>
                    </div>
                </div>
            </div>

            {/* Badges / Iconos Tecnológicos de Syscom */}
            {product.iconos && product.iconos.length > 0 && (
              <div className="bg-card/50 border border-border/60 rounded-2xl p-4 flex flex-wrap items-center gap-3 shadow-sm">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" /> Tecnologías:
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.iconos.map((ico, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-background border px-2.5 py-1 rounded-lg text-xs font-medium shadow-xs" title={ico.nombre || ''}>
                      {ico.imagen && (
                        <img src={ico.imagen} alt={ico.nombre || 'icono'} className="w-4 h-4 object-contain" />
                      )}
                      <span>{ico.nombre || 'Certificación'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Puntos Clave */}
            {product.puntos_clave && product.puntos_clave.length > 0 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2.5">
                        {product.puntos_clave.map((punto: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/40">
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                <span className="text-xs sm:text-sm text-foreground/90 font-medium leading-snug">{punto}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Resumen Físico y Datos Técnicos Rápidos */}
            {(product.peso || product.dimensiones || product.sat_code || product.brand || product.line) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-card/60 p-4 rounded-2xl border border-border/50 shadow-xs">
                {product.brand && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Marca</p>
                    <p className="text-xs sm:text-sm font-bold text-foreground">{product.brand}</p>
                  </div>
                )}
                {product.line && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Modelo</p>
                    <p className="text-xs sm:text-sm font-bold text-foreground">{product.line}</p>
                  </div>
                )}
                {product.peso && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Peso</p>
                    <p className="text-xs sm:text-sm font-bold text-foreground">{product.peso} kg</p>
                  </div>
                )}
                {product.dimensiones && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Dimensiones</p>
                    <p className="text-xs sm:text-sm font-bold text-foreground">{product.dimensiones}</p>
                  </div>
                )}
                {product.sat_code && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Clave SAT</p>
                    <p className="text-xs sm:text-sm font-bold text-foreground">{product.sat_code}</p>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* COLUMNA DERECHA: PREMIUM BUY BOX (5 COL) */}
        <div className="lg:col-span-5 sticky top-24 z-10 transition-all duration-300">
            <div className="bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-5 xl:p-6 shadow-xl space-y-5">
                
                {/* 1. PRODUCT HEADER */}
                <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                        {product.brand && (
                            <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-extrabold rounded-full uppercase tracking-wider border border-primary/20">
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
                                    className="object-contain h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white p-1 border border-border shadow-xs"
                                    unoptimized={true}
                                />
                            </div>
                        )}
                    </div>
                    
                    <h1 className="text-lg md:text-xl font-extrabold text-foreground leading-snug tracking-tight">
                        {product.name}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pb-1">
                        <div className="flex items-center gap-1.5 group">
                            <p className="text-xs font-bold text-primary tracking-wider uppercase">
                                Modelo: <span className="text-muted-foreground ml-0.5">{product.line || product.id}</span>
                            </p>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(product.line || product.id || '');
                                    toast({ description: "Modelo copiado al portapapeles" });
                                }}
                                className="text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                                title="Copiar Modelo"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        {product.sat_code && (
                            <p className="text-xs text-muted-foreground font-medium">
                                SAT: <span className="font-semibold">{product.sat_code}</span>
                            </p>
                        )}
                    </div>
                </div>

                <Separator />

                {/* 2. PRICING SECTION */}
                <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">Precio Mayorista</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                            MXN {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product.price).replace('MXN', '').trim()}
                        </span>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1.5 pt-1">
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> IVA Incluido &middot; Facturación Disponible
                    </p>
                </div>

                {/* 3. PRIMARY ACTIONS */}
                <div className="space-y-3">
                    <div className="flex gap-3">
                        {/* Selector de Cantidad */}
                        <div className="flex items-center bg-muted border border-border rounded-xl px-1.5 py-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            >
                                -
                            </Button>
                            <span className="text-foreground font-extrabold text-sm w-7 text-center">{quantity}</span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                                onClick={() => setQuantity(q => q + 1)}
                            >
                                +
                            </Button>
                        </div>
                        {/* Add to Cart */}
                        <Button 
                            onClick={handleAddToCart}
                            variant="outline"
                            className="flex-1 h-12 font-bold rounded-xl gap-2 shadow-sm text-sm"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Añadir al Carrito
                        </Button>
                    </div>

                    {/* Quick Buy Now */}
                    <Button 
                        onClick={handleBuyNow}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 font-extrabold rounded-xl gap-2 text-sm md:text-base uppercase tracking-wider shadow-lg transition-all"
                    >
                        <Zap className="w-5 h-5 fill-current flex-shrink-0" />
                        Comprar Ahora
                    </Button>

                    {/* Botón Asesor Especialista WhatsApp */}
                    <a
                      href={`https://wa.me/5219999040931?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full h-11 rounded-xl font-bold text-xs gap-2 text-green-700 dark:text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 transition-all"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Consultar con un Asesor por WhatsApp
                      </Button>
                    </a>
                </div>

                {/* 4. TRUST BADGES GRID */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-muted/40 border border-border/60 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <Package className="w-5 h-5 text-primary mb-1" />
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Inventario</p>
                        <p className="text-sm font-extrabold text-foreground">{product.stock > 0 ? `${product.stock >= 500 ? '500+' : product.stock} en stock` : 'Agotado'}</p>
                    </div>
                    <div className="bg-muted/40 border border-border/60 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <ShieldCheck className="w-5 h-5 text-green-600 mb-1" />
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Garantía</p>
                        <p className="text-sm font-extrabold text-foreground">Oficial de Fábrica</p>
                    </div>
                </div>

                {/* 5. SECONDARY ACTIONS */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleToggleWishlist}
                        className={cn(
                            "text-xs font-bold gap-2 rounded-xl",
                            isInWishlist ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground"
                        )}
                    >
                        <Heart className={cn("w-4 h-4", isInWishlist && "fill-destructive")} /> 
                        {isInWishlist ? 'Guardado' : 'Guardar'}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleShare}
                        className="text-xs font-bold gap-2 text-muted-foreground rounded-xl"
                    >
                        <Share2 className="w-4 h-4" /> Compartir
                    </Button>
                </div>

            </div>
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL: ESPECIFICACIONES TÉCNICAS Y CONTENIDO HTML NATIVO (FULL WIDTH) */}
      <div suppressHydrationWarning className="w-full space-y-8 mt-10">
        <div suppressHydrationWarning className="bg-card border border-border/80 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground border-b border-border/50 pb-4">
            Especificaciones
          </h2>

          {product.description ? (
            product.description.includes('<') ? (
              <div 
                suppressHydrationWarning
                className="syscom-html-content text-sm sm:text-base leading-relaxed overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <div className="prose dark:prose-invert max-w-none text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            )
          ) : null}

          {/* Características Técnicas de Fábrica adicionales si existen */}
          {product.caracteristicas && product.caracteristicas.length > 0 && (
            <div className="space-y-4 pt-8 border-t border-border/50">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Características Técnicas de Fábrica
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {product.caracteristicas.map((carac: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3.5 rounded-xl bg-muted/40 border border-border/50 shadow-xs">
                    <span className="text-primary font-bold select-none">•</span>
                    <span className="text-xs sm:text-sm text-foreground/90 leading-snug">{carac}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fichas Técnicas y Manuales Descargables */}
        {product.recursos && product.recursos.length > 0 && (
          <div className="bg-card/50 border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Documentos y Manuales Oficiales
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {product.recursos.map((rec, index) => (
                <a
                  key={index}
                  href={rec.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/60 hover:border-primary hover:bg-primary/5 transition-all group shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {rec.recurso || 'Documento Oficial'}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">{rec.formato || 'PDF'}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN DE ACCESORIOS Y PRODUCTOS RELACIONADOS (ESTILO SYSCOM) */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 pt-8 border-t border-border/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[11px] font-black uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Accesorios Compatibles & Ecosistema</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Accesorios y Productos Relacionados
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Componentes de instalación, accesorios certificados y complementos directos para este modelo.
              </p>
            </div>
            <span className="text-xs font-bold text-muted-foreground self-start sm:self-auto">
              {relatedProducts.length} productos compatibles
            </span>
          </div>

          <ProductList products={relatedProducts} />
        </div>
      )}

      <Dialog open={isZoomModalOpen} onOpenChange={setIsZoomModalOpen}>
        <DialogContent className="bg-transparent border-none shadow-none w-auto h-auto max-w-[90vw] max-h-[90vh] p-6 flex flex-col items-center justify-center">
          <DialogHeader className="w-full">
            <DialogTitle className="text-center text-sm text-white mb-2">
              {product.name}
            </DialogTitle>
          </DialogHeader>
          <Image
            src={zoomedImageUrl}
            alt={`Imagen ampliada de ${product.name}`}
            width={1200} 
            height={800} 
            objectFit="contain"
            className="block max-w-full max-h-full rounded-2xl bg-white p-4"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
