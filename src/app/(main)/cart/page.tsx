
"use client";

import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Minus, Plus, ShoppingCart, MessageCircle, Truck } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { getShippingSettings, getProfitMargin, getVatRate } from '@/services/settingsService';

export default function CartPage() {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSubtotal,
    // cartVat is no longer needed as it's included in prices
    loading: cartLoading
  } = useCart();
  const { toast } = useToast();
  
  const [shippingSettings, setShippingSettings] = useState<{ cost: number; freeShippingThreshold: number | null }>({ cost: 0, freeShippingThreshold: null });
  const [profitMargin, setProfitMargin] = useState(0);
  const [vatRate, setVatRate] = useState(0);
  const [loadingShipping, setLoadingShipping] = useState(true);

  useEffect(() => {
    async function fetchShippingSettings() {
        setLoadingShipping(true);
        const [settings, profit, vat] = await Promise.all([
          getShippingSettings(),
          getProfitMargin(),
          getVatRate(),
        ]);
        setShippingSettings(settings);
        setProfitMargin(profit);
        setVatRate(vat);
        setLoadingShipping(false);
    }
    fetchShippingSettings();
  }, []);

  const shippingCost = useMemo(() => {
    if (loadingShipping || cartItems.length === 0) return 0;
    const { cost, freeShippingThreshold } = shippingSettings;
    if (freeShippingThreshold !== null && freeShippingThreshold > 0 && cartSubtotal >= freeShippingThreshold) {
      return 0; // Free shipping
    }
    return cost;
  }, [cartSubtotal, shippingSettings, loadingShipping, cartItems.length]);

  const finalTotal = useMemo(() => {
    // cartSubtotal ya incluye Margen + IVA (es la suma de unit.price)
    // El envío es un extra que se suma al final.
    return cartSubtotal + shippingCost;
  }, [cartSubtotal, shippingCost]);
  
  const netSubtotal = useMemo(() => cartSubtotal / 1.16, [cartSubtotal]);
  const vatAmount = useMemo(() => cartSubtotal - netSubtotal, [cartSubtotal, netSubtotal]);
  
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  

  if (cartLoading || loadingShipping) {
    return <CartPageSkeleton />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-semibold mb-4">Tu Carrito está Vacío</h1>
        <p className="text-muted-foreground mb-8">Parece que aún no has añadido nada a tu carrito.</p>
        <Link href="/" legacyBehavior passHref>
          <Button size="lg">Empezar a Comprar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Tu Carrito ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})</CardTitle>
              <Button variant="outline" onClick={clearCart} className="text-destructive border-destructive hover:bg-destructive/10 text-xs sm:text-sm h-8 sm:h-auto">
                <Trash2 className="mr-1 h-4 w-4" /> Vaciar Carrito
              </Button>
            </div>
          </CardHeader>
          <CardContent className="divide-y">
            {cartItems.map((item) => {
              const imageSrc = item.imageUrls && item.imageUrls.length > 0 
                ? item.imageUrls[0] 
                : "https://placehold.co/100x100.png";
              const aiHint = (!item.imageUrls || item.imageUrls.length === 0 || item.imageUrls[0].includes('placehold.co')) 
                ? "cart item" 
                : undefined;
              return (
                <div key={item.id} className="py-6 grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 sm:col-span-2 relative h-20 w-20 sm:h-24 sm:w-24 rounded-md overflow-hidden border bg-white">
                    <Image
                      src={imageSrc}
                      alt={item.name}
                      layout="fill"
                      objectFit="contain"
                      {...(aiHint && { "data-ai-hint": aiHint })}
                      className="p-1"
                    />
                  </div>
                  <div className="col-span-9 sm:col-span-10 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-5">
                      <Link href={`/products/${item.id}`} className="hover:text-primary">
                        <h3 className="font-semibold text-base sm:text-lg line-clamp-2">{item.name}</h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="md:col-span-4 flex items-center border rounded-md justify-between">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-r-none" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-12 h-10 text-center border-none focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min="1"
                      />
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-l-none" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="font-semibold md:col-span-2 md:text-right">{formatCurrency(item.price * item.quantity)}</p>
                    <div className="md:col-span-1 flex justify-end">
                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="text-destructive hover:text-destructive-foreground hover:bg-destructive">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card className="shadow-lg sticky top-24">
          <CardHeader>
            <CardTitle className="text-2xl">Resumen del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <p>Subtotal (Sin IVA)</p>
              <p>{formatCurrency(netSubtotal)}</p>
            </div>
            <div className="flex justify-between">
              <p>IVA (16%)</p>
              <p>{formatCurrency(vatAmount)}</p>
            </div>
             <div className="flex justify-between">
              <p>Envío</p>
              {shippingCost === 0 && cartSubtotal > 0 ? (
                <span className="font-semibold text-green-600">Gratis</span>
              ) : (
                <p>{formatCurrency(shippingCost)}</p>
              )}
            </div>
            {/* IVA line removed as it is now included in the subtotal */}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <p>Total</p>
              <p>{formatCurrency(finalTotal)}</p>
            </div>
             {shippingSettings.freeShippingThreshold !== null && shippingSettings.freeShippingThreshold > 0 && cartSubtotal < shippingSettings.freeShippingThreshold && (
                <div className="text-center text-xs text-muted-foreground pt-2 border-t mt-3">
                    <Truck className="inline-block mr-1 h-4 w-4"/>
                    Añade {formatCurrency(shippingSettings.freeShippingThreshold - cartSubtotal)} más para <span className="font-semibold text-foreground">envío gratis</span>.
                </div>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Link href="/checkout" className="w-full" legacyBehavior passHref>
              <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white">Proceder al Pago</Button>
            </Link>
            <Link href="/" className="w-full" legacyBehavior passHref>
              <Button variant="outline" className="w-full">Continuar Comprando</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function CartPageSkeleton() {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
          <CardContent className="divide-y">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-6">
                <Skeleton className="h-24 w-24 rounded-md" />
                <div className="flex-grow space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-10 w-28 rounded-md" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-5 w-1/4" /></div>
            <div className="flex justify-between"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-5 w-1/4" /></div>
            <Separator />
            <div className="flex justify-between"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-6 w-1/4" /></div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
