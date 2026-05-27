
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Heart, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface AddToWishlistButtonProps {
  productId: string;
  className?: string;
  size?: "icon" | "default" | "sm" | "lg";
  showText?: boolean;
}

export function AddToWishlistButton({ productId, className, size = "icon", showText = false }: AddToWishlistButtonProps) {
  const { currentUser, wishlist, addToWishlist, removeFromWishlist, isProductInWishlist } = useAuth();
  const router = useRouter();

  const isInWishlist = isProductInWishlist(productId);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      router.push('/login?redirect=' + window.location.pathname);
      return;
    }

    if (isInWishlist) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  };

  if (!currentUser && !showText) {
     return (
      <Button
        variant="ghost"
        size={size}
        className={cn("text-muted-foreground hover:text-primary", className)}
        onClick={() => router.push('/login?redirect=' + window.location.pathname)}
        aria-label="Inicia sesión para añadir a la lista de deseos"
      >
        <Heart className="h-5 w-5" />
        {showText && <span className="ml-2">Añadir a Deseos</span>}
      </Button>
    );
  }
  
   if (!currentUser && showText) {
    return (
      <Button
        variant="outline"
        size={size}
        className={cn(className)}
        onClick={() => router.push('/login?redirect=' + window.location.pathname)}
      >
        <LogIn className="mr-2 h-4 w-4" /> Inicia sesión para añadir
      </Button>
    );
  }


  return (
    <Button
      variant={isInWishlist ? "secondary" : "outline"}
      size={size}
      onClick={handleToggleWishlist}
      className={cn(
        "transition-colors",
        isInWishlist ? "text-destructive hover:bg-destructive/10" : "hover:bg-accent",
        className
      )}
      aria-label={isInWishlist ? "Eliminar de la lista de deseos" : "Añadir a la lista de deseos"}
    >
      <Heart className={cn("h-5 w-5", isInWishlist && "fill-destructive text-destructive")} />
      {showText && <span className="ml-2">{isInWishlist ? "En mi Lista" : "Añadir a Deseos"}</span>}
    </Button>
  );
}
