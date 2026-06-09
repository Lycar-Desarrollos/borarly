
"use client";

import { useEffect, useState, useMemo } from 'react';
import { notFound, useRouter, useParams, useSearchParams } from 'next/navigation';
import { getProductById } from '@/services/productService';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Mail, Phone, Building, User, MapPin, MessageCircle, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getShippingSettings } from '@/services/settingsService';

export default function QuickBuyPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [shippingDetails, setShippingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    zip: '',
    country: '',
  });

  const [shippingSettings, setShippingSettings] = useState<{ cost: number; freeShippingThreshold: number | null }>({ cost: 0, freeShippingThreshold: null });
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const productId = params.id as string;
    const qty = parseInt(searchParams.get('quantity') || '1', 10);
    setQuantity(qty);

    if (!productId) {
      notFound();
      return;
    }

    const fetchProduct = async () => {
      const fetchedProduct = await getProductById(productId);
      if (fetchedProduct) {
        setProduct(fetchedProduct);
      } else {
        notFound();
      }
      setLoadingProduct(false);
    };

    const fetchSettings = async () => {
        const settings = await getShippingSettings();
        setShippingSettings(settings);
        setLoadingSettings(false);
    };

    fetchProduct();
    fetchSettings();
  }, [params, searchParams]);

  const subtotal = product ? product.price * quantity : 0;

  const shippingCost = useMemo(() => {
    if (loadingSettings || !product) return 0;
    const { cost, freeShippingThreshold } = shippingSettings;
    if (freeShippingThreshold !== null && freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
      return 0; // Free shipping
    }
    return cost;
  }, [subtotal, shippingSettings, loadingSettings, product]);

  const total = subtotal + shippingCost;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const { name, email, phone, street, city, zip, country } = shippingDetails;
    if (!name || !email || !phone || !street || !city || !zip || !country) {
        toast({
            variant: "destructive",
            title: "Datos Incompletos",
            description: "Por favor, rellena todos los campos de envío para continuar.",
        });
        return;
    }

    setIsProcessing(true);
    
    const formattedSubtotal = formatCurrency(subtotal);
    const formattedShipping = shippingCost === 0 ? 'Gratis' : formatCurrency(shippingCost);
    const formattedTotal = formatCurrency(total);

    const message = `¡Hola! Quiero comprar el siguiente producto:
*Producto:* ${product.name} (SKU: ${product.id})
*Cantidad:* ${quantity}

*Resumen:*
- *Subtotal (IVA Incl.):* ${formattedSubtotal}
- *Envío:* ${formattedShipping}
--------------------
*Total a Pagar:* ${formattedTotal}

*Mis datos de envío son:*
- *Nombre:* ${name}
- *Email:* ${email}
- *Teléfono:* ${phone}
- *Dirección:* ${street}, ${city}, C.P. ${zip}, ${country}

Por favor, confírmame los datos para realizar la transferencia SPEI. Gracias.`;
    
    const whatsappUrl = `https://wa.me/5219999040931?text=${encodeURIComponent(message)}`;
    
    toast({
        title: "¡Casi listo!",
        description: "Serás redirigido a WhatsApp para finalizar tu compra.",
        duration: 5000,
    });

    window.open(whatsappUrl, '_blank');
    setIsProcessing(false);
    
    setTimeout(() => {
        router.push('/');
    }, 3000);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  if (loadingProduct || loadingSettings) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (!product) {
      return (
        <div className="text-center py-10">
            <h1 className="text-2xl font-bold">Producto no encontrado</h1>
            <Link href="/" legacyBehavior passHref><Button variant="link">Volver a la tienda</Button></Link>
        </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-0">
      <h1 className="text-3xl font-bold mb-2">Compra Rápida (Sin Registro)</h1>
      <p className="text-muted-foreground mb-8">Completa tus datos para finalizar por WhatsApp.</p>
      
        <form onSubmit={handleFinalize} className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>1. Datos de Envío</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name"><User className="inline-block mr-1 h-4 w-4 text-muted-foreground"/>Nombre Completo</Label>
                    <Input id="name" name="name" value={shippingDetails.name} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="phone"><Phone className="inline-block mr-1 h-4 w-4 text-muted-foreground"/>Teléfono de Contacto</Label>
                    <Input id="phone" name="phone" type="tel" value={shippingDetails.phone} onChange={handleInputChange} required />
                  </div>
                 </div>
                 <div>
                    <Label htmlFor="email"><Mail className="inline-block mr-1 h-4 w-4 text-muted-foreground"/>Email</Label>
                    <Input id="email" name="email" type="email" value={shippingDetails.email} onChange={handleInputChange} required />
                  </div>
                <div>
                  <Label htmlFor="street"><MapPin className="inline-block mr-1 h-4 w-4 text-muted-foreground"/>Dirección (Calle y Número)</Label>
                  <Input id="street" name="street" value={shippingDetails.street} onChange={handleInputChange} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input id="city" name="city" value={shippingDetails.city} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="zip">Código Postal</Label>
                    <Input id="zip" name="zip" value={shippingDetails.zip} onChange={handleInputChange} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="country">País</Label>
                  <Input id="country" name="country" value={shippingDetails.country} onChange={handleInputChange} required />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>2. Método de Pago</CardTitle></CardHeader>
              <CardContent>
                 <div className="p-4 mt-2 border border-dashed border-primary/50 rounded-lg bg-primary/5 shadow-sm">
                    <h3 className="text-md font-semibold text-primary mb-2 flex items-center"><Building className="mr-2 h-4 w-4"/>Pagar con Transferencia SPEI</h3>
                    <div className="space-y-1.5 text-sm text-foreground/90">
                        <p><strong>Cuenta CLABE:</strong> <span className="font-mono tracking-wider">012 180 01576278534 6</span></p>
                        <p><strong>Beneficiario:</strong> Borarly S.A. de C.V.</p>
                        <p className="mt-3 text-sm text-muted-foreground">
                         Al hacer clic en "Finalizar", se abrirá WhatsApp con un mensaje pre-llenado. Envíanoslo y te confirmaremos para que puedas realizar la transferencia.
                        </p>
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card className="sticky top-24 shadow-lg">
              <CardHeader>
                <CardTitle>Resumen de Compra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 bg-white rounded-md border object-cover">
                        <Image src={product.imageUrls[0]} alt={product.name} layout="fill" objectFit="contain" className="p-1"/>
                    </div>
                    <div>
                        <p className="font-semibold leading-tight">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Cantidad: {quantity}</p>
                    </div>
                 </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span>Subtotal (IVA Incl.)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Envío</span>
                  {shippingCost === 0 ? (
                    <span className="font-semibold text-green-600">Gratis</span>
                  ) : (
                    <span>{formatCurrency(shippingCost)}</span>
                  )}
                </div>
                {/* IVA line removed */}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total a Pagar</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                 {shippingSettings.freeShippingThreshold !== null && shippingSettings.freeShippingThreshold > 0 && subtotal < shippingSettings.freeShippingThreshold && (
                    <div className="text-center text-xs text-muted-foreground pt-2 border-t mt-3">
                        <Truck className="inline-block mr-1 h-4 w-4"/>
                        Te faltan {formatCurrency(shippingSettings.freeShippingThreshold - subtotal)} para <span className="font-semibold text-foreground">envío gratis</span>.
                    </div>
                )}
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button type="submit" size="lg" className="w-full bg-green-600 hover:bg-green-700" disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-5 w-5" />}
                  {isProcessing ? 'Procesando...' : 'Finalizar y Contactar por WhatsApp'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Serás redirigido a WhatsApp para confirmar tu pedido.
                </p>
              </CardFooter>
            </Card>
          </div>
        </form>
    </div>
  );
}

    