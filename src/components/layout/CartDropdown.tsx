"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export function CartDropdown() {
  const { cartCount } = useCart();

  return (
    <Link
      href="/cart"
      className="h-11 sm:h-12 px-4 sm:px-5 rounded-2xl flex items-center gap-2.5 sm:gap-3 transition-all duration-200 outline-none cursor-pointer group select-none border bg-[#131b2e] hover:bg-[#1a2540] border-slate-700/80 hover:border-blue-500/50 text-slate-100 shadow-md hover:shadow-lg hover:shadow-blue-950/30 active:scale-[0.98]"
      title="Ir al Carrito de compras"
    >
      <div className="relative flex items-center justify-center">
        <ShoppingCart className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform stroke-[2.2]" />
        {cartCount > 0 && (
          <span className="sm:hidden absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-[#090d16] animate-in zoom-in">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </div>

      <span className="hidden sm:inline font-semibold text-sm tracking-tight text-slate-100 group-hover:text-white">
        Carrito
      </span>

      {/* Badge de cantidad visible en pantallas medianas hacia arriba */}
      {cartCount > 0 && (
        <span className="hidden sm:flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-blue-600 text-white font-bold text-xs shadow-sm ring-1 ring-blue-400/40 animate-in zoom-in">
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </Link>
  );
}








