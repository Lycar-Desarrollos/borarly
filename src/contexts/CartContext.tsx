
"use client";

import type { CartItem, Product } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
// VAT rate is no longer needed here as it's included in the product price.

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartVat: number; // This will now be 0, but kept for type consistency to avoid breaking other components immediately.
  cartTotal: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function initializeCart() {
      setLoading(true);
      try {
        const storedCart = await localStorage.getItem('eCommCentralCart');
        if (storedCart) {
          setCartItems(JSON.parse(storedCart));
        }
      } catch (error) {
        console.error("No se pudo cargar el carrito desde localStorage", error);
        localStorage.removeItem('eCommCentralCart');
      }
      setLoading(false);
    }
    initializeCart();
  }, []);


  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem('eCommCentralCart', JSON.stringify(cartItems));
      } catch (error) {
        console.error("No se pudo guardar el carrito en localStorage", error);
      }
    }
  }, [cartItems, loading]);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevItems, { ...product, quantity }];
    });
    toast({ title: "Añadido al carrito", description: `${product.name} ha sido añadido a tu carrito.` });
  }, [toast]);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    toast({ title: "Eliminado del carrito", description: "El artículo ha sido eliminado de tu carrito." });
  }, [toast]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    toast({ title: "Carrito vaciado", description: "Tu carrito de compras está ahora vacío." });
  }, [toast]);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  
  const { cartSubtotal, cartVat, cartTotal } = useMemo(() => {
    // The subtotal is now the sum of VAT-inclusive prices.
    const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    // VAT is already included in the price, so it's no longer calculated separately.
    const vat = 0; 
    const total = subtotal; // Total is just the subtotal. Shipping is added elsewhere.
    return {
      cartSubtotal: subtotal,
      cartVat: vat,
      cartTotal: total,
    };
  }, [cartItems]);


  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        cartVat,
        cartTotal,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};
