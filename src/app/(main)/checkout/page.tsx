"use client";

import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Mail, Phone, Truck, CheckCircle2, ArrowLeft, ShieldCheck, Lock, CreditCard, MapPin, Plus, Edit, Building, Clock, FileDown, Store } from 'lucide-react';
import { addDoc, collection, doc, Timestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, OrderItem, UserAddress, BillingData } from '@/lib/types';
import Link from 'next/link';
import Script from 'next/script';
import { updateProductStock } from '@/services/productService';
import { getShippingSettings, getProfitMargin, getVatRate } from '@/services/settingsService';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  OPENPAY_MERCHANT_ID,
  OPENPAY_PUBLIC_KEY,
  OPENPAY_IS_SANDBOX,
  translateOpenpayError,
} from '@/lib/openpay';

export default function CheckoutPage() {
  const { cartItems, cartSubtotal, clearCart } = useCart();
  const { userProfile, currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [shippingSettings, setShippingSettings] = useState<{ cost: number; freeShippingThreshold?: number | null }>({ cost: 0, freeShippingThreshold: null });
  const [profitMargin, setProfitMargin] = useState(0);
  const [vatRate, setVatRate] = useState(0);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Pasos: 1 = Envio, 2 = Pago Seguro, 3 = Completado
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Address Book Logic
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  const [newAddressForm, setNewAddressForm] = useState<UserAddress>({
    id: '', alias: 'Mi Casa', firstName: '', lastName: '', street: '', city: '', state: '', zip: '', country: 'México', phone: '', isDefault: false
  });
  const [contactEmail, setContactEmail] = useState('');
  
  // Nivel logístico de checkout
  const [paymentMethod, setPaymentMethod] = useState<'openpay_card' | 'spei' | 'oxxo' | 'paypal'>('openpay_card');
  const [isProcessingManualPayment, setIsProcessingManualPayment] = useState(false);

  // Openpay Card & Antifraud State
  const [openpayScriptLoaded, setOpenpayScriptLoaded] = useState(false);
  const [openpayDataScriptLoaded, setOpenpayDataScriptLoaded] = useState(false);
  const [deviceSessionId, setDeviceSessionId] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpMonth, setCardExpMonth] = useState('');
  const [cardExpYear, setCardExpYear] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessingOpenpayCard, setIsProcessingOpenpayCard] = useState(false);
  const [paynetVoucher, setPaynetVoucher] = useState<{
    reference: string;
    barcodeUrl: string;
    pdfUrl: string;
  } | null>(null);

  // Billing Logic
  const [requiresBilling, setRequiresBilling] = useState(false);
  const [savedBillingList, setSavedBillingList] = useState<BillingData[]>([]);
  const [selectedBillingId, setSelectedBillingId] = useState<string | null>(null);
  const [isAddingNewBilling, setIsAddingNewBilling] = useState(false);
  const [newBillingForm, setNewBillingForm] = useState<BillingData>({
      id: '', alias: 'Mi Factura', rfc: '', razonSocial: '', regimenFiscal: '601', usoCFDI: 'G03', zip: '', email: '', isDefault: false
  });

  const [formValid, setFormValid] = useState(false);
  const [orderReference, setOrderReference] = useState("");
  
  const isProfileStillLoading = !!currentUser && !userProfile;

  useEffect(() => {
    if (userProfile) {
      setContactEmail(userProfile.email || '');
      
      let addresses: UserAddress[] = userProfile.savedAddresses || [];

      // Migrar dirección antigua si existe y no hay guardadas
      if (addresses.length === 0 && userProfile.address && userProfile.address.street) {
         const names = (userProfile.displayName || '').split(' ');
         const legacyAddr: UserAddress = {
             id: 'legacy-1',
             alias: 'Dirección Principal',
             firstName: names[0] || '',
             lastName: names.slice(1).join(' ') || '',
             street: userProfile.address.street || '',
             city: userProfile.address.city || '',
             state: (userProfile.address as any).state || userProfile.address.city || '',
             zip: userProfile.address.zip || '',
             country: userProfile.address.country || 'México',
             phone: userProfile.address.phone || '',
             isDefault: true
         };
         addresses = [legacyAddr];
      }

      setSavedAddresses(addresses);
      
      if (addresses.length > 0) {
          const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
          setSelectedAddressId(defaultAddr.id);
          setIsAddingNewAddress(false);
      } else {
          setIsAddingNewAddress(true);
      }
      
      let billing = userProfile.savedBilling || [];
      setSavedBillingList(billing);
      if (billing.length > 0) {
          const defaultBill = billing.find(b => b.isDefault) || billing[0];
          setSelectedBillingId(defaultBill.id);
          setIsAddingNewBilling(false);
      } else {
          setIsAddingNewBilling(true);
      }
    }
  }, [userProfile]);
  
  useEffect(() => {
    async function fetchSettings() {
        setLoadingSettings(true);
        const [settings, profit, vat] = await Promise.all([
            getShippingSettings(),
            getProfitMargin(),
            getVatRate(),
        ]);
        setShippingSettings(settings);
        setProfitMargin(profit);
        setVatRate(vat);
        setLoadingSettings(false);
    }
    fetchSettings();
  }, []);

  const shippingCost = useMemo(() => {
    if (loadingSettings || cartItems.length === 0) return null;
    const { cost, freeShippingThreshold } = shippingSettings;
    if (typeof freeShippingThreshold === 'number' && freeShippingThreshold > 0 && cartSubtotal >= freeShippingThreshold) {
      return 0; // Envío gratis detectado
    }
    return cost;
  }, [shippingSettings, loadingSettings, cartSubtotal, cartItems.length]);

  const finalTotal = useMemo(() => {
    if (shippingCost === null || loadingSettings) return null;
    return cartSubtotal + shippingCost;
  }, [cartSubtotal, shippingCost, loadingSettings]);

  const netSubtotal = useMemo(() => cartSubtotal / 1.16, [cartSubtotal]);
  const vatAmount = useMemo(() => cartSubtotal - netSubtotal, [cartSubtotal, netSubtotal]);

  const validateShippingForm = useCallback(() => {
    if (!contactEmail) return false;
    let isAddressValid = false;
    if (!isAddingNewAddress && selectedAddressId) isAddressValid = true;
    if (isAddingNewAddress) {
       isAddressValid = !!(newAddressForm.firstName && newAddressForm.lastName && newAddressForm.street && newAddressForm.city && newAddressForm.state && newAddressForm.zip && newAddressForm.phone);
    }
    
    if (!isAddressValid) return false;

    if (requiresBilling) {
       if (!isAddingNewBilling && selectedBillingId) return true;
       if (isAddingNewBilling) {
           return !!(newBillingForm.rfc && newBillingForm.razonSocial && newBillingForm.zip && newBillingForm.email);
       }
       return false;
    }
    return true;
  }, [isAddingNewAddress, selectedAddressId, newAddressForm, contactEmail, requiresBilling, isAddingNewBilling, selectedBillingId, newBillingForm]);

  useEffect(() => {
    setFormValid(validateShippingForm());
  }, [validateShippingForm]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login?redirect=/checkout');
    }
  }, [currentUser, authLoading, router]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAddressForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleBillingInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBillingForm(prev => ({ ...prev, [name]: name === 'rfc' ? value.toUpperCase() : value }));
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const getFinalAddress = (): UserAddress => {
      if (!isAddingNewAddress && selectedAddressId) {
          return savedAddresses.find(a => a.id === selectedAddressId)!;
      }
      return newAddressForm;
  }

  const getFinalBilling = (): BillingData | null => {
      if (!requiresBilling) return null;
      if (!isAddingNewBilling && selectedBillingId) {
          return savedBillingList.find(b => b.id === selectedBillingId)!;
      }
      return newBillingForm;
  }
  
  // Inicializar Openpay.js + Antifraude (device_session_id)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as any;
    if (win.OpenPay && openpayScriptLoaded && openpayDataScriptLoaded && !deviceSessionId) {
      try {
        win.OpenPay.setId(OPENPAY_MERCHANT_ID);
        win.OpenPay.setApiKey(OPENPAY_PUBLIC_KEY);
        win.OpenPay.setSandboxMode(OPENPAY_IS_SANDBOX);
        const sessionId = win.OpenPay.deviceData.setup();
        if (sessionId) setDeviceSessionId(sessionId);
      } catch (err) {
        console.error('Error configurando Openpay deviceData:', err);
      }
    }
  }, [openpayScriptLoaded, openpayDataScriptLoaded, deviceSessionId]);

  // Guardar datos en Firebase tras captura exitosa o pedido manual
  const saveOrderToFirebase = async (
    transactionId: string,
    method: 'openpay_card' | 'paypal' | 'spei' | 'oxxo' = 'openpay_card',
    extraInstructions?: string
  ) => {
    if (!currentUser || cartItems.length === 0 || shippingCost === null || finalTotal === null) return;
    
    let activeAddress = getFinalAddress();

    // Guardar en la libreta si era "Nueva Dirección"
    if (isAddingNewAddress) {
        const addrToSave = { ...activeAddress, id: `addr_${Date.now()}` };
        try {
            await updateDoc(doc(db, "users", currentUser.uid), {
                savedAddresses: arrayUnion(addrToSave)
            });
            activeAddress = addrToSave;
        } catch (e) {
            console.error("Error guardando agenda", e);
        }
    }

    const finalBilling = getFinalBilling();
    if (requiresBilling && isAddingNewBilling && finalBilling) {
        const billToSave = { ...finalBilling, id: `bill_${Date.now()}` };
        try {
            await updateDoc(doc(db, "users", currentUser.uid), {
                savedBilling: arrayUnion(billToSave)
            });
        } catch (e) {
            console.error("Error guardando factura", e);
        }
    }

    const orderItems: OrderItem[] = cartItems.map(item => ({
      productId: item.id,
      sku: (item as any).line || item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      imageUrl: (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : "https://placehold.co/100x100.png",
    }));

    const isPaidImmediately = method === 'paypal' || method === 'openpay_card';
    const defaultInstructions =
      method === 'openpay_card'
        ? `Pagado con Tarjeta vía Openpay BBVA. Autorización / ID: ${transactionId}`
        : method === 'paypal'
        ? `Pagado vía PayPal. ID Transacción: ${transactionId}`
        : extraInstructions || `Pendiente de cobro en ${method.toUpperCase()}`;

    const finalOrderData: Omit<Order, 'id'> = {
      userId: currentUser.uid, 
      items: orderItems, 
      subtotal: cartSubtotal, 
      vatAmount: (cartSubtotal / 1.16) * 0.16,
      shippingCost: shippingCost,
      totalAmount: finalTotal,
      status: isPaidImmediately ? 'paid' : 'pending', 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString(),
      shippingAddress: { 
          street: activeAddress.street, city: activeAddress.city, zip: activeAddress.zip, country: activeAddress.country, phone: activeAddress.phone, contactEmail: contactEmail 
      },
      requiresBilling: requiresBilling,
      paymentReference: transactionId,
      paymentDetails: {  
        method: method,
        transactionId: transactionId,
        instructions: defaultInstructions,
      },
    };

    if (requiresBilling && finalBilling) {
        finalOrderData.billingDetails = finalBilling;
    }

    const adminNotification = {
      type: 'new_order',
      orderRef: transactionId,
      customer: `${activeAddress.firstName} ${activeAddress.lastName}`,
      total: finalTotal,
      createdAt: Timestamp.now(),
      read: false
    };

    try {
      const ordersCollectionRef = collection(db, 'orders');
      const firestoreOrderData = {
        ...finalOrderData,
        createdAt: Timestamp.fromDate(new Date(finalOrderData.createdAt || Date.now())),
        updatedAt: Timestamp.fromDate(new Date(finalOrderData.updatedAt || Date.now())),
      };
      const orderDocRef = await addDoc(ordersCollectionRef, firestoreOrderData);
      await addDoc(collection(db, 'adminNotifications'), adminNotification);

      // Notificar la venta a ventas@borarly.com (no bloquea la compra si falla)
      try {
        const token = await currentUser.getIdToken().catch(() => '');
        await fetch('/api/orders/notify', {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            orderId: orderDocRef.id,
            reference: transactionId,
            createdAt: finalOrderData.createdAt,
            status: finalOrderData.status,
            paymentMethod: method,
            customer: {
              name: `${activeAddress.firstName} ${activeAddress.lastName}`.trim() || userProfile?.displayName || '',
              email: contactEmail,
              phone: activeAddress.phone,
            },
            shipping: {
              street: activeAddress.street,
              city: activeAddress.city,
              state: activeAddress.state,
              zip: activeAddress.zip,
              country: activeAddress.country,
            },
            items: orderItems.map(({ name, sku, quantity, price, imageUrl }) => ({ name, sku, quantity, price, imageUrl })),
            subtotal: parseFloat(netSubtotal.toFixed(2)),
            vatAmount: parseFloat(vatAmount.toFixed(2)),
            shippingCost,
            total: finalTotal,
            billing: requiresBilling && finalBilling ? finalBilling : null,
          }),
        });
      } catch (e) {
        console.error('No se pudo enviar el correo de venta', e);
      }
      
      for (const item of orderItems) {
        await updateProductStock(item.productId, item.quantity).catch(e => console.error("No se pudo descontar stock local", e));
      }

      setOrderReference(transactionId);
      setCurrentStep(3); // ÉXITO
      clearCart();
    } catch (error) {
      console.error(`Error guardando en BD tras pago:`, error);
      toast({ title: "Advertencia", description: "Ocurrió un error registrando en la base de datos.", variant: "destructive" });
    }
  };

  // Verificar retorno de 3D Secure (?openpay_3ds=1&id=tr_...)
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser || loadingSettings || finalTotal === null) return;
    const params = new URLSearchParams(window.location.search);
    const is3dsReturn = params.get('openpay_3ds');
    const trId = params.get('id');
    if (!is3dsReturn || !trId) return;

    // Limpiar la URL para no reprocesar al recargar
    window.history.replaceState({}, '', '/checkout');

    (async () => {
      setIsProcessingOpenpayCard(true);
      setPaymentMethod('openpay_card');
      setCurrentStep(2);
      try {
        const res = await fetch(`/api/openpay/verify?id=${encodeURIComponent(trId)}`);
        const data = await res.json();
        if (data.ok && data.completed) {
          toast({
            title: '¡Autenticación 3D Secure Exitosa!',
            description: `Cargo autorizado por tu banco (${data.authorization || trId}).`,
          });
          await saveOrderToFirebase(data.authorization || trId, 'openpay_card');
        } else {
          toast({
            variant: 'destructive',
            title: 'Pago no completado en 3D Secure',
            description: data.errorMessage || data.error || 'El banco no autorizó la transacción.',
          });
        }
      } catch {
        toast({
          variant: 'destructive',
          title: 'Error de verificación',
          description: 'No se pudo verificar el estado del cargo con Openpay.',
        });
      } finally {
        setIsProcessingOpenpayCard(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, loadingSettings, finalTotal]);

  const handleOpenpayCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalTotal) return;

    const win = typeof window !== 'undefined' ? (window as any) : null;
    if (!win?.OpenPay) {
      toast({
        variant: 'destructive',
        title: 'Cargando pasarela...',
        description: 'Espera un segundo mientras se inicializa el módulo seguro de Openpay.',
      });
      return;
    }

    const cleanCardNum = cardNumber.replace(/\s+/g, '');
    const cleanMonth = cardExpMonth.trim().padStart(2, '0');
    const cleanYear = cardExpYear.trim().slice(-2);
    const cleanCvv = cardCvv.trim();

    if (!cardHolderName.trim()) {
      toast({ variant: 'destructive', title: 'Falta el titular', description: 'Ingresa el nombre del titular tal como aparece en la tarjeta.' });
      return;
    }
    if (!win.OpenPay.card.validateCardNumber(cleanCardNum)) {
      toast({ variant: 'destructive', title: 'Tarjeta inválida', description: 'Verifica los dígitos del número de tarjeta.' });
      return;
    }
    if (!win.OpenPay.card.validateExpiry(cleanMonth, cleanYear)) {
      toast({ variant: 'destructive', title: 'Fecha de vencimiento inválida', description: 'Verifica el mes (MM) y año (AA) de expiración.' });
      return;
    }
    if (!win.OpenPay.card.validateCVC(cleanCvv, cleanCardNum)) {
      toast({ variant: 'destructive', title: 'CVV inválido', description: 'Verifica el código de seguridad de tu tarjeta.' });
      return;
    }

    setIsProcessingOpenpayCard(true);

    try {
      win.OpenPay.setId(OPENPAY_MERCHANT_ID);
      win.OpenPay.setApiKey(OPENPAY_PUBLIC_KEY);
      win.OpenPay.setSandboxMode(OPENPAY_IS_SANDBOX);

      const activeSessionId = deviceSessionId || win.OpenPay.deviceData?.setup?.() || `sess_${Date.now()}`;
      if (!deviceSessionId && activeSessionId) setDeviceSessionId(activeSessionId);

      const finalAddr = getFinalAddress();

      // Tokenizar tarjeta directamente con Openpay.js (PCI-DSS: nunca toca nuestro servidor)
      const tokenId: string = await new Promise((resolve, reject) => {
        win.OpenPay.token.create(
          {
            card_number: cleanCardNum,
            holder_name: cardHolderName.trim(),
            expiration_year: cleanYear,
            expiration_month: cleanMonth,
            cvv2: cleanCvv,
            address: {
              city: finalAddr.city || 'Mérida',
              country_code: 'MX',
              postal_code: finalAddr.zip || '97000',
              line1: finalAddr.street || 'Domicilio conocido',
              state: finalAddr.state || 'Yucatán',
            },
          },
          (response: any) => resolve(response?.data?.id),
          (error: any) => reject(error)
        );
      });

      const orderRef = `BOR-${Date.now().toString().slice(-8)}`;
      const returnUrl = `${window.location.origin}/checkout?openpay_3ds=1`;

      const chargeRes = await fetch('/api/openpay/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'card',
          source_id: tokenId,
          device_session_id: activeSessionId,
          amount: finalTotal,
          description: `Pedido Borarly ${orderRef} (${cartItems.length} art.)`,
          order_id: orderRef,
          use_3d_secure: !OPENPAY_IS_SANDBOX,
          redirect_url: returnUrl,
          customer: {
            name: finalAddr.firstName || cardHolderName.trim(),
            last_name: finalAddr.lastName || 'Cliente',
            phone_number: finalAddr.phone || '9999040931',
            email: contactEmail || currentUser?.email || 'ventas@borarly.com',
          },
        }),
      });

      const chargeData = await chargeRes.json();

      if (!chargeRes.ok || !chargeData.ok) {
        toast({
          variant: 'destructive',
          title: 'Cargo rechazado',
          description: chargeData.error || 'El banco no autorizó la operación.',
        });
        setIsProcessingOpenpayCard(false);
        return;
      }

      // Si el cargo requiere redirección a 3D Secure del banco
      if (chargeData.status === 'charge_pending' && chargeData.redirectUrl) {
        toast({
          title: 'Redirigiendo a 3D Secure de tu banco...',
          description: 'Confirma tu compra en la ventana de seguridad de tu banco.',
        });
        window.location.href = chargeData.redirectUrl;
        return;
      }

      // Cargo aprobado directamente
      toast({
        title: '¡Pago Aprobado!',
        description: `Autorización bancaria: ${chargeData.authorization || chargeData.transactionId}`,
      });
      await saveOrderToFirebase(chargeData.authorization || chargeData.transactionId, 'openpay_card');
    } catch (err: any) {
      const code = err?.data?.error_code;
      const desc = err?.data?.description || err?.message;
      toast({
        variant: 'destructive',
        title: 'No se pudo procesar la tarjeta',
        description: translateOpenpayError(code, desc),
      });
    } finally {
      setIsProcessingOpenpayCard(false);
    }
  };

  const handleManualCheckout = async () => {
    setIsProcessingManualPayment(true);
    try {
      if (paymentMethod === 'oxxo' && finalTotal) {
        const finalAddr = getFinalAddress();
        const orderRef = `PAYNET-${Date.now().toString().slice(-8)}`;
        const res = await fetch('/api/openpay/charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'store',
            amount: finalTotal,
            description: `Pedido Borarly ${orderRef}`,
            order_id: orderRef,
            customer: {
              name: finalAddr.firstName || 'Cliente',
              last_name: finalAddr.lastName || 'Borarly',
              phone_number: finalAddr.phone || '9999040931',
              email: contactEmail || currentUser?.email || 'ventas@borarly.com',
            },
          }),
        });
        const data = await res.json();
        if (res.ok && data.ok && data.reference) {
          setPaynetVoucher({
            reference: data.reference,
            barcodeUrl: data.barcodeUrl,
            pdfUrl: data.paynetPdfUrl,
          });
          await saveOrderToFirebase(
            data.reference,
            'oxxo',
            `Ficha Paynet Openpay: ${data.reference} · Recibo PDF: ${data.paynetPdfUrl}`
          );
          return;
        }
      }

      // Flujo SPEI Directo (o fallback)
      const reference = `${paymentMethod.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;
      await saveOrderToFirebase(reference, paymentMethod === 'openpay_card' ? 'spei' : paymentMethod);
    } finally {
      setIsProcessingManualPayment(false);
    }
  };
  
  if (currentStep === 3) {
      const isCardOrPaypalPaid = paymentMethod === 'paypal' || paymentMethod === 'openpay_card';
      return (
          <div className="max-w-2xl mx-auto text-center py-16 space-y-6">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-inner ${isCardOrPaypalPaid ? 'bg-green-100 text-green-500' : 'bg-primary/20 text-primary'}`}>
                 {isCardOrPaypalPaid ? <CheckCircle2 className="h-14 w-14" /> : <Clock className="h-14 w-14" />}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-foreground">{isCardOrPaypalPaid ? '¡Pago Completado!' : '¡Pedido Generado!'}</h1>
              <p className="text-lg text-muted-foreground">
                {isCardOrPaypalPaid
                  ? 'Tu orden ha sido procesada y autorizada de manera segura por la pasarela bancaria Openpay BBVA.'
                  : paynetVoucher
                  ? 'Presenta esta referencia o descarga tu ficha oficial Paynet para pagar en efectivo en tiendas afiliadas.'
                  : 'Tu pedido ha sido creado y está en espera de pago. Sigue las instrucciones en tu historial para depositar y activarlo.'}
              </p>
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-8 my-6 border border-primary/20 shadow-sm backdrop-blur-sm space-y-4">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                    {paynetVoucher ? 'Referencia Oficial Paynet (Openpay)' : 'Código de Autorización / Referencia'}
                  </p>
                  <p className="font-mono text-2xl sm:text-3xl text-primary font-bold break-all">{orderReference}</p>
                  {paynetVoucher?.barcodeUrl && (
                    <div className="bg-white p-4 rounded-xl inline-block shadow border">
                      <img src={paynetVoucher.barcodeUrl} alt="Código de barras Paynet" className="mx-auto h-16 object-contain" />
                    </div>
                  )}
                  {paynetVoucher?.pdfUrl && (
                    <div className="pt-2">
                      <Button asChild variant="default" className="gap-2 rounded-full">
                        <a href={paynetVoucher.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <FileDown className="w-4 h-4" /> Descargar Recibo Oficial de Pago (PDF)
                        </a>
                      </Button>
                    </div>
                  )}
              </div>
              <p className="text-muted-foreground">Te hemos enviado un recibo a <span className="font-medium text-foreground">{contactEmail}</span>.</p>
              <div className="pt-6">
                <Button asChild size="lg" className="rounded-full px-8 shadow-lg hover:scale-105 transition-transform">
                    <Link href="/profile/orders"><ArrowLeft className="mr-2 w-4 h-4" /> Ver mis Pedidos</Link>
                </Button>
              </div>
          </div>
      )
  }

  if (authLoading || loadingSettings || finalTotal === null) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 mb-12">
      
      {/* BREADCRUMB / STEPPER VISUAL */}
      <div className="mb-10 px-4">
          <div className="flex items-center justify-center max-w-2xl mx-auto">
              <div className={`flex flex-col items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground opacity-50'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-sm transition-colors ${currentStep >= 1 ? 'bg-primary text-white shadow-primary/30' : 'bg-muted border-2 border-muted-foreground/20'}`}>1</div>
                  <span className="font-semibold text-xs uppercase tracking-wider hidden sm:block">Envío</span>
              </div>
              
              <div className={`flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-colors duration-500 ${currentStep >= 2 ? 'bg-primary/80' : 'bg-muted max-w-[80px]'}`}></div>
              
              <div className={`flex flex-col items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground opacity-50'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-sm transition-colors duration-500 ${currentStep >= 2 ? 'bg-primary text-white shadow-primary/30' : 'bg-muted border-2 border-muted-foreground/20'}`}>2</div>
                  <span className="font-semibold text-xs uppercase tracking-wider hidden sm:block">Pago Seguro</span>
              </div>
              
              <div className={`flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-colors duration-500 ${currentStep >= 3 ? 'bg-primary/80' : 'bg-muted max-w-[80px]'}`}></div>
              
              <div className={`flex flex-col items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground opacity-50'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-sm transition-colors duration-500 ${currentStep >= 3 ? 'bg-primary text-white shadow-primary/30' : 'bg-muted border-2 border-muted-foreground/20'}`}>3</div>
                  <span className="font-semibold text-xs uppercase tracking-wider hidden sm:block">Confirmación</span>
              </div>
          </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between mb-10 gap-4">
        <div>
            <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Checkout Seguro</h1>
            <p className="text-muted-foreground mt-2">Protección al comprador garantizada.</p>
        </div>
        <div className="flex items-center gap-3 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200 text-sm font-medium">
            <Lock className="w-4 h-4" /> Encriptación SSL 256-bit
        </div>
      </div>

      {cartItems.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-xl shadow-2xl border-0">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-6 text-lg">Tu carrito está vacío. Agrega productos para poder pagar.</p>
            <Button asChild size="lg" className="rounded-full"><Link href="/">Ir al Catálogo</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-12 gap-10">
          {/* LADO IZQUIERDO: Pasos dinámicos */}
          <div className="lg:col-span-7 space-y-8 relative z-10 transition-all duration-300">
            
            {/* PASO 1: DATOS DE ENVÍO (SOLO VISIBLE EN PASO 1) */}
            {currentStep === 1 && (
            <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0 overflow-hidden ring-1 ring-primary/50 shadow-primary/10 transition-all duration-300 animate-in fade-in slide-in-from-right-4">
              <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-3">
                      <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">1</span> 
                      Datos de Envío
                  </CardTitle>
              </div>
              
              <CardContent className="p-6">
                
                {/* SELECTOR DE LISTA DE DIRECCIONES */}
                {savedAddresses.length > 0 && !isAddingNewAddress && (
                    <div className="space-y-4 mb-6">
                        <Label className="text-muted-foreground">Selecciona una dirección de tu libreta</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {savedAddresses.map(addr => (
                                <div key={addr.id} 
                                   onClick={() => setSelectedAddressId(addr.id)}
                                   className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40 bg-background'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-foreground flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/> {addr.alias}</h3>
                                        {selectedAddressId === addr.id && <CheckCircle2 className="w-5 h-5 text-primary"/>}
                                    </div>
                                    <p className="text-sm text-foreground/80 font-medium">{addr.firstName} {addr.lastName}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{addr.street}, {addr.city}</p>
                                    <p className="text-xs text-muted-foreground mt-1">CP: {addr.zip}</p>
                                </div>
                            ))}
                            <div onClick={() => setIsAddingNewAddress(true)}
                                className={`p-4 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-all flex flex-col items-center justify-center text-muted-foreground hover:text-primary bg-muted/10`}>
                                <Plus className="w-6 h-6 mb-2"/>
                                <span className="font-medium text-sm">Agregar Nueva Dirección</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* FORMULARIO NUEVA DIRECCIÓN */}
                {(isAddingNewAddress || savedAddresses.length === 0) && (
                    <div className="space-y-5 animate-in slide-in-from-bottom-4 fade-in duration-300">
                        {savedAddresses.length > 0 && (
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold border-b border-primary/20 pb-1 text-primary">Ingresar Nueva Dirección</h3>
                                <Button variant="ghost" size="sm" onClick={() => setIsAddingNewAddress(false)} className="text-xs flex items-center gap-1"><ArrowLeft className="w-3 h-3"/> Volver a la libreta</Button>
                            </div>
                        )}
                        <div className="space-y-1">
                          <Label htmlFor="alias" className="text-muted-foreground">Guardar como (Alias)</Label>
                          <Input id="alias" name="alias" placeholder="Ej. Casa, Oficina..." value={newAddressForm.alias} onChange={handleInputChange} required className="bg-muted/30 focus:bg-background" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <Label htmlFor="firstName" className="text-muted-foreground">Nombre</Label>
                                <Input id="firstName" name="firstName" value={newAddressForm.firstName} onChange={handleInputChange} required className="bg-muted/30 focus:bg-background" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="lastName" className="text-muted-foreground">Apellidos</Label>
                                <Input id="lastName" name="lastName" value={newAddressForm.lastName} onChange={handleInputChange} required className="bg-muted/30 focus:bg-background" />
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                        <Label htmlFor="street" className="text-muted-foreground">Dirección (Calle y Número)</Label>
                        <Input id="street" name="street" value={newAddressForm.street} onChange={handleInputChange} required className="bg-muted/30 focus:bg-background" />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="sm:col-span-2 space-y-1">
                            <Label htmlFor="city" className="text-muted-foreground">Ciudad / Municipio</Label>
                            <Input id="city" name="city" value={newAddressForm.city} onChange={handleInputChange} required className="bg-muted/30 focus:bg-background" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="zip" className="text-muted-foreground">Cód. Postal</Label>
                            <Input id="zip" name="zip" value={newAddressForm.zip} onChange={handleInputChange} required className="bg-muted/30 focus:bg-background" />
                        </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <Label htmlFor="state" className="text-muted-foreground">Estado / Entidad</Label>
                            <Input id="state" name="state" value={newAddressForm.state} onChange={handleInputChange} required className="bg-muted/30 focus:bg-background" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="country" className="text-muted-foreground">País</Label>
                            <Input id="country" name="country" value={newAddressForm.country} onChange={handleInputChange} required disabled className="bg-muted/50 cursor-not-allowed" />
                        </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 pt-2 border-t border-border/50">
                            <div className="space-y-1">
                                <Label htmlFor="phone" className="text-muted-foreground">Teléfono Móvil (El paquetere se comunicará aquí)</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                    <Input id="phone" name="phone" type="tel" value={newAddressForm.phone} onChange={handleInputChange} required className="pl-10 bg-muted/30 focus:bg-background"/>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* EMAIL GLOBAL AL FINAL DEL STEP 1 */}
                <div className="mt-6 pt-6 border-t border-border/50 space-y-1">
                    <Label htmlFor="contactEmail" className="text-foreground font-bold">Correo electrónico para recibir notificaciones del pedido</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                        <Input id="contactEmail" name="contactEmail" type="email" value={contactEmail} onChange={(e)=>setContactEmail(e.target.value)} required className="pl-10 bg-muted/30 focus:bg-background"/>
                    </div>
                </div>

                {/* MODULO OPCIONAL FACTURACIÓN */}
                <div className="mt-8 pt-6 border-t font-semibold border-border/50">
                    <div className="flex bg-muted/20 items-center justify-between p-4 rounded-xl border border-primary/20">
                        <div>
                            <Label className="text-base text-foreground font-bold cursor-pointer">¿Requiere Factura Fiscal (CFDI)?</Label>
                            <p className="text-xs text-muted-foreground font-normal">Activa el motor de facturación en México (CFDI 4.0).</p>
                        </div>
                        <Switch checked={requiresBilling} onCheckedChange={setRequiresBilling} />
                    </div>

                    {requiresBilling && (
                        <div className="mt-6 animate-in fade-in slide-in-from-top-4">
                            {savedBillingList.length > 0 && !isAddingNewBilling && (
                                <div className="space-y-4 mb-6">
                                    <Label className="text-muted-foreground font-normal">Tus Datos Fiscales Guardados</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {savedBillingList.map(bill => (
                                            <div key={bill.id} onClick={() => setSelectedBillingId(bill.id)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedBillingId === bill.id ? 'border-blue-500 bg-blue-500/5 shadow-sm' : 'border-border hover:border-blue-500/40 bg-background'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-bold text-foreground flex items-center gap-2 text-blue-600 dark:text-blue-400">{bill.alias}</h3>
                                                    {selectedBillingId === bill.id && <CheckCircle2 className="w-5 h-5 text-blue-500"/>}
                                                </div>
                                                <p className="text-sm font-bold tracking-widest">{bill.rfc}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">{bill.razonSocial}</p>
                                            </div>
                                        ))}
                                        <div onClick={() => setIsAddingNewBilling(true)} className={`p-4 rounded-xl border-2 border-dashed border-border hover:border-blue-500 cursor-pointer transition-all flex flex-col items-center justify-center text-muted-foreground hover:text-blue-500 bg-muted/10`}>
                                            <Plus className="w-6 h-6 mb-2"/>
                                            <span className="font-medium text-sm">Nuevo RFC</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(isAddingNewBilling || savedBillingList.length === 0) && (
                                <div className="space-y-4 p-5 rounded-xl border border-blue-500/20 bg-blue-500/5">
                                    {savedBillingList.length > 0 && (
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-bold text-blue-600 dark:text-blue-400">Capturar Nuevo RFC</h3>
                                            <Button variant="ghost" size="sm" onClick={() => setIsAddingNewBilling(false)} className="text-xs flex items-center gap-1"><ArrowLeft className="w-3 h-3"/> Volver</Button>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Alias</Label>
                                        <Input name="alias" value={newBillingForm.alias} onChange={handleBillingInputChange} required placeholder="Ej. Corporativo" className="bg-background"/>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-muted-foreground">RFC (Obligatorio)</Label>
                                            <Input name="rfc" value={newBillingForm.rfc} onChange={handleBillingInputChange} required className="bg-background uppercase font-mono" placeholder="XAXX010101000"/>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-muted-foreground">Código Postal Fiscal</Label>
                                            <Input name="zip" value={newBillingForm.zip} onChange={handleBillingInputChange} required className="bg-background font-mono"/>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Razón Social</Label>
                                        <Input name="razonSocial" value={newBillingForm.razonSocial} onChange={handleBillingInputChange} required className="bg-background uppercase"/>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Email de Envío Factura</Label>
                                        <Input name="email" type="email" value={newBillingForm.email} onChange={handleBillingInputChange} required className="bg-background" placeholder="facturas@empresa.com"/>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-muted-foreground">Régimen</Label>
                                            <Select value={newBillingForm.regimenFiscal} onValueChange={(val) => setNewBillingForm(prev => ({...prev, regimenFiscal: val}))}>
                                                <SelectTrigger className="bg-background"><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="601">601 General Morales</SelectItem>
                                                    <SelectItem value="612">612 Persona Física Emp.</SelectItem>
                                                    <SelectItem value="626">626 RESICO</SelectItem>
                                                    <SelectItem value="616">616 Sin Obligaciones</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-muted-foreground">Uso CFDI</Label>
                                            <Select value={newBillingForm.usoCFDI} onValueChange={(val) => setNewBillingForm(prev => ({...prev, usoCFDI: val}))}>
                                                <SelectTrigger className="bg-background"><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="G01">G01 Adquisición mecancías</SelectItem>
                                                    <SelectItem value="G03">G03 Gastos en general</SelectItem>
                                                    <SelectItem value="I04">I04 Equipo Computo</SelectItem>
                                                    <SelectItem value="S01">S01 Sin efectos fiscales</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

              </CardContent>
            </Card>
            )}

            {/* PASO 2: PAGO SEGURO (SOLO VISIBLE EN PASO 2) */}
            {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Librerías Oficiales Openpay.js + Sistema Antifraude */}
                <Script
                  src="https://js.openpay.mx/openpay.v1.min.js"
                  strategy="afterInteractive"
                  onLoad={() => setOpenpayScriptLoaded(true)}
                />
                <Script
                  src="https://js.openpay.mx/openpay-data.v1.min.js"
                  strategy="afterInteractive"
                  onLoad={() => setOpenpayDataScriptLoaded(true)}
                />
                
                {/* MINI RESUMEN DE LA DIRECCIÓN ELEGIDA */}
                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl p-4 shadow-sm">
                    <div className="flex gap-3 text-sm text-muted-foreground items-start">
                        <MapPin className="w-5 h-5 shrink-0 text-primary mt-0.5"/>
                        <div>
                        <p className="font-semibold text-foreground">{getFinalAddress().firstName} {getFinalAddress().lastName}</p>
                        <p>{getFinalAddress().street}, {getFinalAddress().city}</p>
                        <p>CP {getFinalAddress().zip} &bull; {contactEmail}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)} className="text-xs bg-background border-border">Modificar</Button>
                </div>

                <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0 overflow-hidden ring-1 ring-blue-500/50 shadow-blue-500/10">
                <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/30">
                    <CardTitle className="text-xl flex items-center gap-3">
                        <span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">2</span> 
                        Pago Seguro
                    </CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground opacity-80">
                        {OPENPAY_IS_SANDBOX && (
                          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Sandbox Openpay Activo
                          </span>
                        )}
                        <CreditCard className="w-5 h-5"/>
                    </div>
                </div>
                <CardContent className="p-6 bg-card rounded-b-xl border-t border-blue-100 dark:border-blue-900/50">
                  <div className="mb-6 text-center">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex justify-center items-center gap-1.5"><Lock className="w-3.5 h-3.5"/> Selector de Método de Pago</p>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                      {/* TARJETA OPENPAY BBVA */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('openpay_card')}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'openpay_card' ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 shadow-md scale-[1.03]' : 'border-border bg-background hover:bg-muted/50'}`}>
                          <CreditCard className={`w-7 h-7 mb-1.5 ${paymentMethod === 'openpay_card' ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`} />
                          <span className={`text-xs sm:text-sm font-bold text-center leading-tight ${paymentMethod === 'openpay_card' ? 'text-foreground' : 'text-muted-foreground'}`}>Tarjeta Crédito / Débito</span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1">Openpay BBVA</span>
                      </button>

                      {/* SPEI */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('spei')}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'spei' ? 'border-primary bg-primary/5 shadow-md scale-[1.03]' : 'border-border bg-background hover:bg-muted/50'}`}>
                          <Building className={`w-7 h-7 mb-1.5 ${paymentMethod === 'spei' ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`text-xs sm:text-sm font-bold text-center leading-tight ${paymentMethod === 'spei' ? 'text-foreground' : 'text-muted-foreground'}`}>Transferencia SPEI</span>
                          <span className="text-[10px] text-muted-foreground mt-1 opacity-80">Directo BBVA</span>
                      </button>

                      {/* EFECTIVO EN TIENDAS (PAYNET OPENPAY) */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('oxxo')}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'oxxo' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow-md scale-[1.03]' : 'border-border bg-background hover:bg-muted/50'}`}>
                          <Store className={`w-7 h-7 mb-1.5 ${paymentMethod === 'oxxo' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                          <span className={`text-xs sm:text-sm font-bold text-center leading-tight ${paymentMethod === 'oxxo' ? 'text-orange-700 dark:text-orange-400' : 'text-muted-foreground'}`}>Efectivo en Tiendas</span>
                          <span className="text-[10px] text-muted-foreground mt-1 opacity-80">Paynet / OXXO</span>
                      </button>

                      {/* PAYPAL */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'paypal' ? 'border-[#0070ba] bg-blue-50 dark:bg-blue-950/30 shadow-md scale-[1.03]' : 'border-border bg-background hover:bg-muted/50'}`}>
                          <svg className={`w-7 h-7 mb-1.5 opacity-80 ${paymentMethod === 'paypal' ? 'text-[#0070ba]' : 'text-muted-foreground'}`} viewBox="0 0 24 24" fill="currentColor">
                              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zM6.92 13.33H11.53c4.156 0 6.643-1.637 7.412-5.597.55-2.82.016-4.63-2.024-5.69-1.076-.56-2.613-.778-4.576-.778H7.31L5.346 13.33h1.574z"/>
                              <path d="M21.2 7.03c-.244-1.272-1.066-2.22-2.316-2.8a5.2 5.2 0 0 0-1.42 5.163c-.878 4.49-4.103 6.012-7.838 6.012H7.28a.507.507 0 0 0-.498.411L5.372 24.87a.64.64 0 0 0 .633.74H10.15c.524 0 .968-.382 1.05-.9l.758-4.805a.507.507 0 0 1 .498-.412h1.61c3.842 0 6.847-1.575 7.632-5.6.363-1.854.26-3.79-.5-6.862z"/>
                          </svg>
                          <span className={`text-xs sm:text-sm font-bold text-center leading-tight ${paymentMethod === 'paypal' ? 'text-[#0070ba] dark:text-[#3b82f6]' : 'text-muted-foreground'}`}>PayPal</span>
                          <span className="text-[10px] text-muted-foreground mt-1 opacity-80">Internacional</span>
                      </button>
                  </div>

                  <Separator className="my-6 bg-blue-100 dark:bg-blue-900/50" />

                  {/* FLUJO TARJETA CRÉDITO / DÉBITO (OPENPAY BBVA) */}
                  {paymentMethod === 'openpay_card' && (
                    <form id="openpay-payment-form" onSubmit={handleOpenpayCardPayment} className="space-y-5 animate-in fade-in duration-300">
                      <input type="hidden" name="deviceIdHiddenFieldName" value={deviceSessionId} />

                      {/* Encabezado de marcas aceptadas */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3.5 rounded-xl border border-border/60">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-foreground">Tarjetas de Crédito y Débito</p>
                          <p className="text-[11px] text-muted-foreground">Visa, Mastercard, American Express, Carnet (BBVA, Banamex, Santander, Banorte, HSBC)</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span className="px-2 py-1 rounded bg-blue-900 text-white tracking-wider">VISA</span>
                          <span className="px-2 py-1 rounded bg-orange-600 text-white tracking-wider">MC</span>
                          <span className="px-2 py-1 rounded bg-sky-600 text-white tracking-wider">AMEX</span>
                        </div>
                      </div>

                      {/* Botones rápidos de prueba en modo Sandbox para Certificación */}
                      {OPENPAY_IS_SANDBOX && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                            Modo Pruebas (Certificación Sandbox Openpay) — Autocompletar tarjeta de prueba:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-green-500/40 text-green-700 dark:text-green-400"
                              onClick={() => {
                                setCardHolderName(`${getFinalAddress().firstName || 'Juan'} ${getFinalAddress().lastName || 'Perez'}`.trim());
                                setCardNumber('4111 1111 1111 1111');
                                setCardExpMonth('12');
                                setCardExpYear('28');
                                setCardCvv('123');
                              }}
                            >
                              ✓ Tarjeta Aprobada (Visa)
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-red-500/40 text-red-700 dark:text-red-400"
                              onClick={() => {
                                setCardHolderName(`${getFinalAddress().firstName || 'Juan'} ${getFinalAddress().lastName || 'Perez'}`.trim());
                                setCardNumber('4222 2222 2222 2220');
                                setCardExpMonth('12');
                                setCardExpYear('28');
                                setCardCvv('123');
                              }}
                            >
                              ✕ Tarjeta Declinada (3001)
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-orange-500/40 text-orange-700 dark:text-orange-400"
                              onClick={() => {
                                setCardHolderName(`${getFinalAddress().firstName || 'Juan'} ${getFinalAddress().lastName || 'Perez'}`.trim());
                                setCardNumber('4444 4444 4444 4448');
                                setCardExpMonth('12');
                                setCardExpYear('28');
                                setCardCvv('123');
                              }}
                            >
                              ✕ Sin Fondos (3003)
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="op-holder" className="text-xs font-semibold">Nombre del titular (como aparece en la tarjeta) *</Label>
                          <Input
                            id="op-holder"
                            data-openpay-card="holder_name"
                            placeholder="Ej. JUAN PEREZ LOPEZ"
                            value={cardHolderName}
                            onChange={e => setCardHolderName(e.target.value.toUpperCase())}
                            autoComplete="cc-name"
                            required
                            className="bg-background uppercase font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="op-number" className="text-xs font-semibold">Número de tarjeta *</Label>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                            <Input
                              id="op-number"
                              data-openpay-card="card_number"
                              placeholder="0000 0000 0000 0000"
                              inputMode="numeric"
                              maxLength={19}
                              value={cardNumber}
                              onChange={e => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                                const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
                                setCardNumber(formatted);
                              }}
                              autoComplete="cc-number"
                              required
                              className="pl-10 bg-background font-mono tracking-wider text-base"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="op-month" className="text-xs font-semibold">Mes (MM) *</Label>
                            <Input
                              id="op-month"
                              data-openpay-card="expiration_month"
                              placeholder="MM"
                              inputMode="numeric"
                              maxLength={2}
                              value={cardExpMonth}
                              onChange={e => setCardExpMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                              autoComplete="cc-exp-month"
                              required
                              className="bg-background font-mono text-center"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="op-year" className="text-xs font-semibold">Año (AA) *</Label>
                            <Input
                              id="op-year"
                              data-openpay-card="expiration_year"
                              placeholder="AA"
                              inputMode="numeric"
                              maxLength={2}
                              value={cardExpYear}
                              onChange={e => setCardExpYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
                              autoComplete="cc-exp-year"
                              required
                              className="bg-background font-mono text-center"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="op-cvv" className="text-xs font-semibold">CVV2 *</Label>
                            <Input
                              id="op-cvv"
                              data-openpay-card="cvv2"
                              type="password"
                              placeholder="123"
                              inputMode="numeric"
                              maxLength={4}
                              value={cardCvv}
                              onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              autoComplete="cc-csc"
                              required
                              className="bg-background font-mono text-center"
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isProcessingOpenpayCard}
                        className="w-full h-14 font-black text-lg shadow-xl bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
                      >
                        {isProcessingOpenpayCard ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Procesando cargo seguro con Openpay...
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5 mr-2" />
                            Pagar {formatCurrency(finalTotal!)} MXN
                          </>
                        )}
                      </Button>

                      {/* Sellos Oficiales requeridos para la Certificación de Openpay */}
                      <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px]">Transacciones realizadas vía:</span>
                          <span className="font-black tracking-tight text-sm text-[#004481] dark:text-blue-400">
                            Openpay <span className="font-semibold text-xs opacity-80">by BBVA</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                          <span>Tus pagos se realizan de forma segura con encriptación de 256 bits</span>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* FLUJO SPEI / EFECTIVO PAYNET */}
                  {(paymentMethod === 'spei' || paymentMethod === 'oxxo') && (
                     <div className="text-center space-y-6 py-4 animate-in fade-in duration-500">
                         <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 max-w-lg mx-auto">
                             <p className="text-sm font-medium text-foreground mb-1">
                                {paymentMethod === 'spei'
                                  ? 'Realizarás una transferencia interbancaria SPEI a cuenta BBVA.'
                                  : 'Generarás una ficha oficial Paynet (Openpay) con código de barras para pagar en efectivo en tiendas afiliadas (7-Eleven, Farmacias del Ahorro, Walmart, Sam\'s, Bodega Aurrera, Circle K).'}
                             </p>
                             <p className="text-xs text-muted-foreground">
                                {paymentMethod === 'spei'
                                  ? 'Tu orden se generará y podrás ver la CLABE para transferir y subir tu comprobante desde tu Historial de Pedidos.'
                                  : 'Al confirmar se generará tu código de barras y recibo oficial en PDF de Openpay.'}
                             </p>
                         </div>
                         <Button 
                            className="h-14 font-black shadow-xl hover:scale-105 transition-all text-lg px-10 w-full sm:w-auto"
                            onClick={handleManualCheckout}
                            disabled={isProcessingManualPayment}
                         >
                            {isProcessingManualPayment ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Clock className="w-5 h-5 mr-2" />}
                            {isProcessingManualPayment
                              ? 'Generando Ficha...'
                              : paymentMethod === 'oxxo'
                              ? 'Generar Ficha Oficial Paynet (PDF)'
                              : 'Generar Orden y Ver Ficha SPEI'}
                         </Button>
                     </div>
                  )}

                  {/* FLUJO PAYPAL */}
                  {paymentMethod === 'paypal' && (
                    <div className="max-w-xl mx-auto py-2 animate-in fade-in duration-500">
                      <PayPalScriptProvider 
                        options={{ 
                            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
                            currency: "MXN",
                            intent: "capture", // Cobro inmediato
                            locale: "es_MX"
                        }}>
                        <PayPalButtons 
                            style={{ layout: "vertical", shape: "rect", color: "blue", label: "pay", disableMaxWidth: true }}
                            createOrder={async (data, actions) => {
                                try {
                                    const finalAddr = getFinalAddress();
                                    const payerPayload = {
                                        firstName: finalAddr.firstName,
                                        lastName: finalAddr.lastName,
                                        street: finalAddr.street,
                                        city: finalAddr.city,
                                        state: finalAddr.state,
                                        zip: finalAddr.zip,
                                        contactEmail: contactEmail
                                    };
                                    
                                    const finalBill = getFinalBilling();

                                    const response = await fetch('/api/orders', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ 
                                            cart: cartItems, 
                                            shippingCost: shippingCost,
                                            payerDetails: payerPayload, // INYECCIÓN ZERO-FRICTION
                                            requiresBilling,
                                            billingDetails: finalBill
                                        }),
                                    });
                                    
                                    const orderData = await response.json();
                                    
                                    if (orderData.id) {
                                        return orderData.id;
                                    } else {
                                        const errorDetail = orderData?.details?.[0];
                                        const errorMessage = errorDetail ? `${errorDetail.issue} ${errorDetail.description}` : JSON.stringify(orderData);
                                        throw new Error(errorMessage);
                                    }
                                } catch (error) {
                                    console.error(error);
                                    toast({ title: "Error Cifrado", description: "No pudimos conectar con la pasarela bancaria.", variant: "destructive" });
                                    throw error;
                                }
                            }}
                            onApprove={async (data, actions) => {
                                try {
                                    const response = await fetch(`/api/orders/${data.orderID}/capture`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' }
                                    });
                                    
                                    const captureData = await response.json();
                                    
                                    if (captureData.status === "COMPLETED" || captureData.purchase_units) {
                                        const transactionId = captureData.purchase_units[0].payments.captures[0].id;
                                        toast({ title: "Fondos Procesados", description: "Verificando firmas digitales de tu pago...", duration: 5000 });
                                        await saveOrderToFirebase(transactionId, 'paypal');
                                    } else {
                                      throw new Error("El estado de captura bancaria fue inesperado.");
                                    }
                                } catch (error) {
                                    console.error(error);
                                    toast({ title: "Operación Restringida", description: "Tu banco rechazó la operación o hubo un corte temporal.", variant: "destructive" });
                                }
                            }}
                        />
                      </PayPalScriptProvider>
                    </div>
                  )}
                </CardContent>
                </Card>
            </div>
            )}
          </div>

          {/* LADO DERECHO: Resumen Glassmórfico Flotante con Botón de Acción Principal en el Paso 1 */}
          <div className="lg:col-span-5 relative z-0">
            <div className="sticky top-28 xl:top-32 h-fit">
              <Card className="shadow-2xl border border-border bg-card/80 backdrop-blur-2xl">
                <CardHeader className="border-b border-border/50 bg-muted/40 backdrop-blur-md rounded-t-xl px-6 py-5">
                  <CardTitle className="text-2xl font-bold flex items-center justify-between">
                    Resumen
                    <ShieldCheck className="w-6 h-6 text-green-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-muted">
                      {cartItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm p-3 rounded-lg bg-background/50 shadow-sm border border-border/40 hover:border-primary/30 transition-colors">
                          <div className="flex items-start gap-3">
                              <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-xs">{item.quantity}</span>
                              <span className="truncate max-w-[180px] font-medium leading-snug">{item.name}</span>
                          </div>
                          <span className="font-bold whitespace-nowrap pl-4">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                      ))}
                  </div>
                  
                  <Separator className="bg-border/60"/>
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground/80 font-medium">Subtotal sin IVA</span>
                      <span className="font-semibold">{formatCurrency(netSubtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground/80 font-medium">Impuestos (IVA 16%)</span>
                      <span className="font-semibold">{formatCurrency(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground/80 font-medium flex items-center gap-1.5"><Truck className="w-4 h-4"/> Logística y Envío</span>
                        {shippingCost === 0 ? (
                            <span className="font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded uppercase text-xs tracking-wider">Gratis</span>
                        ) : (
                            <span className="font-semibold">{formatCurrency(shippingCost!)}</span>
                        )}
                    </div>
                  </div>
                   
                  <div className="pt-4 border-t border-border/50"> 
                    <div className="flex justify-between items-end bg-gradient-to-tr from-primary/10 to-transparent p-5 rounded-xl border border-primary/20">
                      <div className="flex flex-col">
                        <span className="text-xs lg:text-sm uppercase tracking-widest text-primary font-bold">Cobro Total</span>
                        <span className="text-muted-foreground text-xs">Incluye inventario reservado</span>
                      </div>
                      <span className="text-2xl lg:text-4xl font-black text-foreground tracking-tight">{formatCurrency(finalTotal!)}</span>
                    </div>
                  </div>

                  {/* EL BOTÓN MÁGICO DEL USUARIO (De la Fase 1 a la 2) */}
                  <div className="pt-2">
                      <Button 
                          onClick={() => setCurrentStep(2)}
                          disabled={!formValid || currentStep === 2}
                          className={`w-full py-6 text-lg font-bold rounded-xl transition-all duration-300 shadow-xl overflow-hidden
                              ${currentStep === 2 ? 'opacity-0 h-0 p-0 m-0 border-0 absolute pointer-events-none' : 'opacity-100'}
                          `}
                      >
                          Realizar Pago
                      </Button>
                      {!formValid && currentStep === 1 && (
                          <p className="text-xs text-red-500/80 text-center mt-2 animate-pulse">Debes completar y seleccionar los datos de envío para poder avanzar.</p>
                      )}
                  </div>

                </CardContent>
                <div className="px-6 pb-6 text-center">
                   <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 opacity-80">
                    <Lock className="w-4 h-4"/> Conexión blindada bajo protocolo PCI DSS
                   </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
