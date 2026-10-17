"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { ShoppingCart, Package, Plus, Minus, Copy, Check, ShieldCheck, Flame } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { AddToWishlistButton } from './AddToWishlistButton';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isProductInWishlist } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const rawPrimaryImage = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls[0] 
    : "https://placehold.co/600x400.png?text=Sin+Imagen";

  const primaryImage = rawPrimaryImage.includes('syscom.mx')
    ? `/api/image-proxy?url=${encodeURIComponent(rawPrimaryImage)}`
    : rawPrimaryImage;

  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
    setQuantity(1);
  };

  const stock = product.stock || 0;
  const isLowStock = stock > 0 && stock <= 5;

  return (
    <div className="flex flex-col h-full rounded-2xl bg-card dark:bg-[#1A1F2D] border border-border dark:border-slate-800/60 hover:border-primary/40 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Upper Container (Image) */}
      <Link href={`/products/${product.id}`} className="block relative bg-white dark:bg-[#242933]/60 p-5 sm:p-6 flex justify-center items-center h-[210px] sm:h-[230px] overflow-hidden">
        {/* Top-left psychological badge */}
        <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
          {isLowStock ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-zinc-950 shadow-xs">
              <Flame className="w-3 h-3 fill-current" /> ¡Últimas {stock}!
            </span>
          ) : stock > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
              Envío Inmediato
            </span>
          ) : null}
        </div>

        <div className="relative w-full h-full max-h-[175px] z-0 transition-transform duration-500 group-hover:scale-105">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain drop-shadow-sm"
            loading="lazy"
            decoding="async"
            unoptimized={true}
          />
        </div>
      </Link>
      
      {/* Lower Container (Details & Actions) */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow relative bg-card dark:bg-[#1A1F2D] z-20">
        
        {/* Brand */}
        {product.brand && (
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-600 dark:text-[#00E676] mb-1.5 leading-none">
            {product.brand}
          </p>
        )}
        
        {/* Title */}
        <Link href={`/products/${product.id}`} className="block mb-2 flex-grow">
          <h3 className="text-sm sm:text-[15px] font-bold leading-snug text-foreground dark:text-white group-hover:text-primary transition-colors line-clamp-3">
            {product.name}
          </h3>
        </Link>
        
        {/* SKU */}
        {product.line && (
          <div 
            className="flex items-center gap-1.5 mt-auto group/sku cursor-pointer w-fit"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.writeText(product.line || '');
              toast({ description: "Modelo copiado al portapapeles" });
            }}
            title="Copiar Modelo"
          >
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wide group-hover/sku:underline">
              Modelo: {product.line}
            </p>
            <Copy className="w-3 h-3 text-primary opacity-60 group-hover/sku:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Price + IVA / Facturación Trust Trigger */}
        <div className="mt-2.5 mb-3.5">
          <p className="text-xl sm:text-[22px] font-black text-foreground dark:text-white tracking-tight flex items-baseline gap-1">
            <span className="text-xs font-bold text-muted-foreground">MXN</span>
            <span className="text-2xl sm:text-[26px]">${new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2 }).format(product.price)}</span>
          </p>
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>IVA incluido · Facturación CFDI 4.0</span>
          </p>
        </div>

        {/* Actions Grid */}
        <div className="space-y-2.5">
          {/* Top Row: Stock | Wishlist */}
          <div className="flex items-center gap-2 h-9">
            <div className="flex items-center justify-center gap-1.5 bg-blue-600/10 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800/50 rounded-lg px-2.5 h-full font-bold text-blue-600 dark:text-blue-400 flex-1 cursor-default">
              <Package className="w-3.5 h-3.5 shrink-0" /> 
              <span className="text-xs whitespace-nowrap">
                {stock > 0 ? `Stock: ${stock >= 500 ? '500+' : stock}` : 'Bajo pedido'}
              </span>
            </div>
            
            <div className="relative h-full w-11 shrink-0">
              <AddToWishlistButton 
                productId={product.id} 
                size="icon" 
                className={`absolute inset-0 w-full h-full rounded-lg border-0 shadow-xs transition-all [&>svg]:w-4 [&>svg]:h-4 ${isProductInWishlist?.(product.id) ? "bg-[#FF3B30] hover:bg-[#FF3B30]/80 text-white [&>svg]:fill-white [&>svg]:text-white" : "bg-muted dark:bg-[#2D3342] hover:bg-slate-200 dark:hover:bg-[#3E4658] text-muted-foreground dark:text-slate-300 [&>svg]:text-muted-foreground dark:[&>svg]:text-slate-300"}`}
              />
            </div>
          </div>

          <div className="flex items-stretch h-10 gap-2">
            {/* Qty Selector */}
            <div className="flex items-center bg-muted dark:bg-[#2D3342] rounded-lg overflow-hidden shrink-0 w-24 h-full border border-border dark:border-slate-700/50">
              <button 
                type="button"
                aria-label="Disminuir cantidad"
                className="w-8 h-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[#3E4658] text-muted-foreground dark:text-slate-300 transition-colors"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1 h-full flex items-center justify-center text-sm font-bold text-foreground dark:text-white">
                {quantity}
              </div>
              <button 
                type="button"
                aria-label="Aumentar cantidad"
                className="w-8 h-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[#3E4658] text-muted-foreground dark:text-slate-300 transition-colors"
                onClick={() => setQuantity(q => q + 1)}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Add to Cart Button */}
            <button 
              type="button"
              onClick={handleAddToCart}
              disabled={stock <= 0}
              className={`flex-1 flex items-center justify-center gap-1.5 font-black rounded-lg transition-all text-xs sm:text-sm shadow-xs ${
                isAdded 
                  ? 'bg-emerald-500 text-zinc-950 font-black' 
                  : 'bg-[#FFD54F] hover:bg-[#FFE082] disabled:bg-slate-700 disabled:text-slate-500 text-[#1A1F2D]'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 text-zinc-950 stroke-[3]" />
                  <span>¡Agregado!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Agregar</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
