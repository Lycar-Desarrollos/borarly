
"use client";

import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Minus, Plus, ShoppingCart, MessageCircle, Truck, UserPlus, LogIn, ShieldAlert, UserCheck } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SecureCheckoutBox } from '@/components/trust/PaymentShippingLogos';
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
  const { currentUser, loading: authLoading } = useAuth();
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
        <Button asChild size="lg">
          <Link href="/">Empezar a Comprar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!currentUser && !authLoading && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-bold text-foreground">
                  Cuenta requerida para realizar tu compra
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  Requisito
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Para procesar tu pedido, calcular el envío y emitir tu factura, es necesario iniciar sesión o crear una cuenta antes de proceder al pago.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="px-4 sm:px-6">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl">Tu Carrito ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})</CardTitle>
                <Button variant="outline" onClick={clearCart} className="text-destructive border-destructive hover:bg-destructive/10 text-xs sm:text-sm h-8 sm:h-9">
                  <Trash2 className="mr-1 h-4 w-4" /> Vaciar Carrito
                </Button>
              </div>
            </CardHeader>
            <CardContent className="divide-y px-4 sm:px-6">
            {cartItems.map((item) => {
              const rawImageSrc = item.imageUrls && item.imageUrls.length > 0 
                ? item.imageUrls[0] 
                : "https://placehold.co/100x100.png";
              const imageSrc = rawImageSrc.includes('syscom.mx')
                ? `/api/image-proxy?url=${encodeURIComponent(rawImageSrc)}`
                : rawImageSrc;
              return (
                <div key={item.id} className="py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden border bg-white shrink-0">
                      <Image
                        src={imageSrc}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-contain p-1.5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/products/${item.id}`} className="hover:text-primary">
                        <h3 className="font-semibold text-sm sm:text-base line-clamp-2 leading-snug">{item.name}</h3>
                      </Link>
                      {item.line && (
                        <p className="text-[11px] font-mono text-muted-foreground mt-0.5">Modelo: {item.line}</p>
                      )}
                      <p className="text-xs sm:text-sm font-semibold text-primary mt-1">{formatCurrency(item.price)} c/u <span className="text-[10px] font-normal text-muted-foreground">(IVA incl.)</span></p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <div className="flex items-center border rounded-lg overflow-hidden h-9">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-11 h-9 text-center text-sm font-bold border-none focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min="1"
                      />
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="font-bold text-sm sm:text-base min-w-[95px] text-right">{formatCurrency(item.price * item.quantity)}</p>
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="h-9 w-9 text-destructive hover:text-destructive-foreground hover:bg-destructive shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card className="shadow-lg sticky top-28">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Resumen del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <p className="text-muted-foreground">Subtotal (Sin IVA)</p>
              <p className="font-medium">{formatCurrency(netSubtotal)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-muted-foreground">IVA Desglosado (16%)</p>
              <p className="font-medium">{formatCurrency(vatAmount)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-muted-foreground">Envío Asegurado</p>
              {shippingCost === 0 && cartSubtotal > 0 ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400">¡Gratis!</span>
              ) : (
                <p className="font-medium">{formatCurrency(shippingCost)}</p>
              )}
            </div>
            <Separator />
            <div className="flex justify-between font-black text-lg sm:text-xl">
              <p>Total (MXN)</p>
              <p className="text-primary">{formatCurrency(finalTotal)}</p>
            </div>
            {shippingSettings.freeShippingThreshold !== null && shippingSettings.freeShippingThreshold > 0 && cartSubtotal < shippingSettings.freeShippingThreshold && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-300 mt-3 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Truck className="h-4 w-4 shrink-0" />
                  <span>¡Te faltan {formatCurrency(shippingSettings.freeShippingThreshold - cartSubtotal)} para Envío Gratis!</span>
                </div>
                <div className="w-full h-1.5 bg-emerald-500/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (cartSubtotal / shippingSettings.freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-3">
            {currentUser ? (
              <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl text-base shadow-md">
                <Link href="/checkout">Proceder al Pago Seguro</Link>
              </Button>
            ) : (
              <div className="w-full space-y-2.5">
                <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 text-sm">
                  <Link href="/signup?redirect=/checkout">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Crear Cuenta para Comprar
                  </Link>
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  ¿Ya tienes cuenta?{' '}
                  <Link href="/login?redirect=/checkout" className="font-semibold text-primary hover:underline">
                    Inicia sesión
                  </Link>
                </p>
              </div>
            )}
            <SecureCheckoutBox className="w-full" />
            <Button asChild variant="ghost" className="w-full text-xs text-muted-foreground hover:text-foreground">
              <Link href="/">Continuar Comprando</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
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
