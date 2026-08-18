
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
      <div className="text-center py-10 sm:py-12 px-4">
        <ShoppingCart className="mx-auto h-16 w-16 sm:h-24 sm:w-24 text-muted-foreground mb-5 sm:mb-6" />
        <h1 className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4">Tu Carrito está Vacío</h1>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">Parece que aún no has añadido nada a tu carrito.</p>
        <Link href="/" legacyBehavior passHref>
          <Button size="lg" className="w-full sm:w-auto">Empezar a Comprar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-5 lg:gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <CardTitle className="text-lg sm:text-2xl">Tu Carrito ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})</CardTitle>
              <Button variant="outline" onClick={clearCart} className="text-destructive border-destructive hover:bg-destructive/10 text-xs sm:text-sm h-9 sm:h-10 px-3">
                <Trash2 className="mr-1 h-4 w-4" /> Vaciar Carrito
              </Button>
            </div>
          </CardHeader>
          <CardContent className="divide-y p-4 pt-0 sm:p-6 sm:pt-0">
            {cartItems.map((item) => {
              const imageSrc = item.imageUrls && item.imageUrls.length > 0 
                ? item.imageUrls[0] 
                : "https://placehold.co/100x100.png";
              const aiHint = (!item.imageUrls || item.imageUrls.length === 0 || item.imageUrls[0].includes('placehold.co')) 
                ? "cart item" 
                : undefined;
              return (
                <div key={item.id} className="py-4 sm:py-6 flex gap-3 items-start sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center">
                  <div className="col-span-3 sm:col-span-2 shrink-0 relative h-20 w-20 sm:h-24 sm:w-24 rounded-md overflow-hidden border bg-white">
                    <Image
                      src={imageSrc}
                      alt={item.name}
                      layout="fill"
                      objectFit="contain"
                      {...(aiHint && { "data-ai-hint": aiHint })}
                      className="p-1"
                    />
                  </div>
                  <div className="col-span-9 sm:col-span-10 flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center">
                    <div className="md:col-span-5 min-w-0">
                      <Link href={`/products/${item.id}`} className="hover:text-primary">
                        <h3 className="font-semibold text-sm sm:text-lg line-clamp-2">{item.name}</h3>
                      </Link>
                      <p className="text-xs sm:text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                    </div>
                    {/* En móvil cantidad, importe y eliminar comparten una sola fila */}
                    <div className="flex items-center justify-between gap-2 md:contents">
                      <div className="md:col-span-4 shrink-0 flex items-center border rounded-md justify-between">
                        <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-r-none" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-11 sm:w-12 h-9 sm:h-10 text-center border-none focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="1"
                          aria-label={`Cantidad de ${item.name}`}
                        />
                        <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-l-none" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="font-semibold text-sm sm:text-base md:col-span-2 md:text-right whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</p>
                      <div className="md:col-span-1 flex justify-end shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="h-9 w-9 sm:h-10 sm:w-10 text-destructive hover:text-destructive-foreground hover:bg-destructive" aria-label="Eliminar del carrito">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card className="shadow-lg lg:sticky lg:top-24">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-2xl">Resumen del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0 text-sm sm:text-base">
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
          <CardFooter className="flex-col gap-3 p-4 pt-0 sm:p-6 sm:pt-0">
            <Link href="/checkout" className="w-full" legacyBehavior passHref>
              <Button size="lg" className="w-full h-12 bg-primary hover:bg-primary/90 text-white">Proceder al Pago</Button>
            </Link>
            <Link href="/" className="w-full" legacyBehavior passHref>
              <Button variant="outline" className="w-full h-11">Continuar Comprando</Button>
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
              <div key={i} className="flex items-center gap-3 sm:gap-4 py-6">
                <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-md" />
                <div className="flex-grow space-y-2 min-w-0">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="hidden sm:block h-10 w-28 rounded-md" />
                <Skeleton className="hidden sm:block h-6 w-20" />
                <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
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
