"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { ShoppingCart, Package, Plus, Minus, Heart, Copy } from 'lucide-react';
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

  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(product.price);

  const rawImage = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls[0] 
    : "https://placehold.co/600x400.png?text=Sin+Imagen";

  // Clean Syscom FTP URL to remove blocking cdn-cgi path
  const primaryImage = rawImage.replace('ftp3.syscom.mx/cdn-cgi/image/format=webp,width=300,height=300/', 'ftp3.syscom.mx/');

  const handleAddToCart = () => {
    // Add multiple items if quantity > 1
    for (let i = 0; i < quantity; i++) {
        addToCart(product);
    }
    // Optionally reset quantity to 1 after adding
    setQuantity(1);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-card dark:bg-[#1A1F2D] border border-border dark:border-slate-800/50 shadow-xl overflow-hidden group">
      {/* Upper Container (Image) */}
      <Link href={`/products/${product.id}`} className="block relative bg-muted dark:bg-[#242933]/50 p-6 flex justify-center items-center h-[240px] overflow-hidden">
        {/* Subtle hover effect on image container */}
        <div className="absolute inset-0 bg-gradient-to-t from-card dark:from-[#1A1F2D] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
        <div className="relative w-full h-full max-h-[180px] z-0 transition-transform duration-500 group-hover:scale-110">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-contain drop-shadow-lg"
            unoptimized={true}
          />
        </div>
      </Link>
      
      {/* Lower Container (Details & Actions) */}
      <div className="p-5 flex flex-col flex-grow relative bg-card dark:bg-[#1A1F2D] z-20">
        
        {/* Brand */}
        {product.brand && (
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#00E676] mb-2 leading-none">
            {product.brand}
          </p>
        )}
        
        {/* Title */}
        <Link href={`/products/${product.id}`} className="block mb-2 flex-grow">
          <h3 className="text-[15px] font-bold leading-tight text-foreground dark:text-white group-hover:text-[#0070FF] transition-colors line-clamp-3">
            {product.name}
          </h3>
        </Link>
        
        {/* SKU */}
        {product.line && (
          <div 
            className="flex items-center gap-1.5 mt-auto group/sku cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.writeText(product.line || '');
              toast({ description: "SKU copiado al portapapeles" });
            }}
            title="Copiar SKU"
          >
            <p className="text-[11px] font-semibold text-[#2979FF] uppercase tracking-wide group-hover/sku:underline">
              SKU: {product.line}
            </p>
            <Copy className="w-3 h-3 text-[#2979FF] opacity-0 group-hover/sku:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Price */}
        <div className="mt-3 mb-4">
          <p className="text-[22px] font-black text-foreground dark:text-white tracking-tight flex items-baseline gap-1">
            MXN <span className="text-[26px]">{new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2 }).format(product.price)}</span>
          </p>
        </div>

        {/* Actions Grid */}
        <div className="space-y-3">
            {/* Top Row: Stock | Wishlist (Red) */}
            <div className="flex items-center gap-2 h-10">
                {/* Stock Badge */}
                <div className="flex items-center justify-center gap-2 bg-blue-600/10 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800/50 rounded-lg px-3 h-full font-bold text-blue-600 dark:text-blue-400 shadow-sm flex-1 cursor-default transition-all hover:bg-blue-600/20">
                    <Package className="w-3.5 h-3.5 shrink-0" /> 
                    <span className="text-xs whitespace-nowrap">Stock: {product.stock || 0}</span>
                </div>
                
                {/* Custom Red Wishlist Wrapper */}
                <div className="relative h-full w-14 shrink-0">
                    <AddToWishlistButton 
                        productId={product.id} 
                        size="icon" 
                        className={`absolute inset-0 w-full h-full rounded-lg border-0 shadow-sm transition-all [&>svg]:w-5 [&>svg]:h-5 ${isProductInWishlist?.(product.id) ? "bg-[#FF3B30] hover:bg-[#FF3B30]/80 text-white [&>svg]:fill-white [&>svg]:text-white" : "bg-muted dark:bg-[#2D3342] hover:bg-slate-200 dark:hover:bg-[#3E4658] text-muted-foreground dark:text-slate-300 [&>svg]:text-muted-foreground dark:[&>svg]:text-slate-300"}`}
                    />
                </div>
            </div>

            <div className="flex items-stretch h-10 gap-2">
                {/* Qty Selector */}
                <div className="flex items-center bg-muted dark:bg-[#2D3342] rounded-lg overflow-hidden shrink-0 w-24 h-full border border-border dark:border-slate-700/50">
                    <button 
                        className="w-8 h-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[#3E4658] text-muted-foreground dark:text-slate-300 transition-colors"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 h-full flex items-center justify-center text-sm font-bold text-foreground dark:text-white">
                        {quantity}
                    </div>
                    <button 
                        className="w-8 h-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[#3E4658] text-muted-foreground dark:text-slate-300 transition-colors"
                        onClick={() => setQuantity(q => q + 1)}
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                
                {/* Add to Cart Yellow Button */}
                <button 
                    onClick={handleAddToCart}
                    disabled={!product.stock || product.stock <= 0}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#FFD54F] hover:bg-[#FFE082] disabled:bg-slate-700 disabled:text-slate-500 text-[#1A1F2D] font-black rounded-lg transition-colors text-sm shadow-sm"
                >
                    <ShoppingCart className="w-4 h-4" /> Agregar
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}
