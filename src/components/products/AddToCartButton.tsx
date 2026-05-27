
"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/lib/types";
import { ShoppingCart, Zap } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();

  const handleAddToCart = () => {
    if (quantity > 0) {
      addToCart(product, quantity);
    }
  };

  const handleBuyNow = () => {
    if (quantity > 0) {
      addToCart(product, quantity);
      router.push('/cart');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="flex items-center border rounded-md w-full sm:w-28">
        <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-r-none"
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            disabled={quantity <=1}
            aria-label="Disminuir cantidad"
        >
          -
        </Button>
        <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full sm:w-12 h-10 text-center border-y-0 sm:border-y sm:border-x-0 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Cantidad"
        />
        <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-l-none"
            onClick={() => setQuantity(q => q + 1)}
            aria-label="Aumentar cantidad"
        >
          +
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 flex-grow">
        <Button
          onClick={handleAddToCart}
          size="lg"
          className="flex-grow"
          disabled={!product.stock || product.stock <= 0}
          aria-label={`Añadir ${product.name} al carrito`}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          {product.stock && product.stock > 0 ? "Añadir al Carrito" : "Agotado"}
        </Button>
        <Button
          onClick={handleBuyNow}
          size="lg"
          variant="outline"
          className="flex-grow"
          disabled={!product.stock || product.stock <= 0}
          aria-label={`Comprar ${product.name} ahora`}
        >
          <Zap className="mr-2 h-5 w-5" />
          Comprar Ahora
        </Button>
      </div>
    </div>
  );
}
