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

                <Card className="shadow-2xl border border-border bg-card/80 backdrop-blur-2xl overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-muted/40 backdrop-blur-md rounded-t-xl px-6 py-5">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl font-bold flex items-center gap-3 text-foreground">
                            <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">2</span> 
                            Método de Pago
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs font-semibold text-green-600 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                            <span>Pago 100% Protegido</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Selector de Método de Pago con estética unificada al Resumen */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* TARJETA OPENPAY BBVA */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('openpay_card')}
                        className={`group relative flex flex-col items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                          paymentMethod === 'openpay_card'
                            ? 'border-primary bg-gradient-to-tr from-primary/10 to-transparent shadow-sm ring-1 ring-primary/30'
                            : 'border-border/60 bg-background/60 hover:border-primary/30 hover:bg-muted/30'
                        }`}>
                          {paymentMethod === 'openpay_card' && (
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                          )}
                          <div className="h-8 flex items-center justify-center gap-1.5 mb-2">
                            {/* Visa & Mastercard Mini Real Logos */}
                            <svg className="h-5 w-auto" viewBox="0 0 48 32" fill="none" aria-label="Visa">
                              <rect width="48" height="32" rx="4" fill="#1434CB"/>
                              <path d="M19.5 21.5L21.6 10.5H25L22.9 21.5H19.5ZM34.9 10.8C34.2 10.5 33.1 10.2 31.7 10.2C28.2 10.2 25.7 12 25.7 14.5C25.7 16.4 27.4 17.4 28.7 18C30 18.6 30.5 19 30.5 19.6C30.5 20.5 29.4 20.9 28.3 20.9C26.9 20.9 26.1 20.7 24.9 20.2L24.4 20L23.9 23C24.8 23.4 26.4 23.7 28 23.7C31.7 23.7 34.1 21.9 34.1 19.2C34.1 17.7 33.2 16.5 31.1 15.6C29.9 15 29.1 14.6 29.1 14C29.1 13.4 29.8 12.8 31.2 12.8C32.4 12.8 33.3 13 34 13.3L34.4 13.5L34.9 10.8ZM43.5 10.5H40.8C39.9 10.5 39.3 10.8 38.9 11.7L33.6 21.5H37.3L38 19.5H42.5L42.9 21.5H46.2L43.5 10.5ZM39.1 17C39.4 16.2 40.6 13.1 40.6 13.1C40.6 13.1 40.9 12.3 41.1 11.8L41.4 13L42.3 17H39.1ZM16.6 10.5L13.1 18L12.7 16.1C12.1 14 10.1 11.8 7.9 10.7L11.1 21.5H14.8L20.3 10.5H16.6Z" fill="white"/>
                              <path d="M10 10.5H4.3L4.2 10.8C8.6 11.9 11.5 14.6 12.7 16.1L11.5 11.7C11.3 10.8 10.7 10.5 10 10.5Z" fill="#F9A533"/>
                            </svg>
                            <svg className="h-5 w-auto" viewBox="0 0 48 32" fill="none" aria-label="Mastercard">
                              <rect width="48" height="32" rx="4" fill="#1E293B"/>
                              <circle cx="19" cy="16" r="8.5" fill="#EB001B"/>
                              <circle cx="29" cy="16" r="8.5" fill="#F79E1B"/>
                              <path d="M24 9.36A8.48 8.48 0 0 0 20.5 16c0 2.75 1.38 5.19 3.5 6.64A8.48 8.48 0 0 0 27.5 16c0-2.75-1.38-5.19-3.5-6.64Z" fill="#FF5F00"/>
                            </svg>
                          </div>
                          <span className={`text-xs sm:text-sm font-bold text-center leading-tight ${paymentMethod === 'openpay_card' ? 'text-foreground' : 'text-muted-foreground'}`}>Tarjeta Bancaria</span>
                          <span className="text-[10px] text-primary font-semibold mt-1">Crédito o Débito</span>
                      </button>

                      {/* SPEI BBVA */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('spei')}
                        className={`group relative flex flex-col items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                          paymentMethod === 'spei'
                            ? 'border-primary bg-gradient-to-tr from-primary/10 to-transparent shadow-sm ring-1 ring-primary/30'
                            : 'border-border/60 bg-background/60 hover:border-primary/30 hover:bg-muted/30'
                        }`}>
                          {paymentMethod === 'spei' && (
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                          )}
                          <div className="h-8 flex items-center justify-center mb-2">
                            <div className="px-2.5 py-1 rounded-md bg-[#004481] text-white font-black text-[11px] tracking-widest flex items-center gap-1 shadow-xs">
                              <span>SPEI</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                            </div>
                          </div>
                          <span className={`text-xs sm:text-sm font-bold text-center leading-tight ${paymentMethod === 'spei' ? 'text-foreground' : 'text-muted-foreground'}`}>Transferencia SPEI</span>
                          <span className="text-[10px] text-muted-foreground mt-1">Interbancario BBVA</span>
                      </button>

                      {/* EFECTIVO EN TIENDAS (PAYNET OPENPAY) */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('oxxo')}
                        className={`group relative flex flex-col items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                          paymentMethod === 'oxxo'
                            ? 'border-primary bg-gradient-to-tr from-primary/10 to-transparent shadow-sm ring-1 ring-primary/30'
                            : 'border-border/60 bg-background/60 hover:border-primary/30 hover:bg-muted/30'
                        }`}>
                          {paymentMethod === 'oxxo' && (
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                          )}
                          <div className="h-8 flex items-center justify-center mb-2">
                            <div className="px-2.5 py-1 rounded-md bg-slate-800 text-white font-bold text-[11px] tracking-wide flex items-center gap-1.5 shadow-xs">
                              <Store className="w-3.5 h-3.5 text-sky-400" />
                              <span>Paynet</span>
                            </div>
                          </div>
                          <span className={`text-xs sm:text-sm font-bold text-center leading-tight ${paymentMethod === 'oxxo' ? 'text-foreground' : 'text-muted-foreground'}`}>Depósito Efectivo</span>
                          <span className="text-[10px] text-muted-foreground mt-1">Walmart, 7-Eleven, Farmacias</span>
                      </button>

                      {/* PAYPAL */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`group relative flex flex-col items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                          paymentMethod === 'paypal'
                            ? 'border-primary bg-gradient-to-tr from-primary/10 to-transparent shadow-sm ring-1 ring-primary/30'
                            : 'border-border/60 bg-background/60 hover:border-primary/30 hover:bg-muted/30'
                        }`}>
                          {paymentMethod === 'paypal' && (
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                          )}
                          <div className="h-8 flex items-center justify-center mb-2">
                            <svg className="h-6 w-auto" viewBox="0 0 24 24" fill="none" aria-label="PayPal">
                              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" fill="#003087"/>
                              <path d="M21.2 7.03c-.244-1.272-1.066-2.22-2.316-2.8a5.2 5.2 0 0 0-1.42 5.163c-.878 4.49-4.103 6.012-7.838 6.012H7.28a.507.507 0 0 0-.498.411L5.372 24.87a.64.64 0 0 0 .633.74H10.15c.524 0 .968-.382 1.05-.9l.758-4.805a.507.507 0 0 1 .498-.412h1.61c3.842 0 6.847-1.575 7.632-5.6.363-1.854.26-3.79-.5-6.862z" fill="#0070E0"/>
                            </svg>
                          </div>
                          <span className={`text-xs sm:text-sm font-bold text-center leading-tight ${paymentMethod === 'paypal' ? 'text-foreground' : 'text-muted-foreground'}`}>PayPal</span>
                          <span className="text-[10px] text-muted-foreground mt-1">Cuenta Protegida</span>
                      </button>
                  </div>

                  <Separator className="bg-border/60" />

                  {/* FLUJO TARJETA CRÉDITO / DÉBITO (OPENPAY BBVA) */}
                  {paymentMethod === 'openpay_card' && (
                    <form id="openpay-payment-form" onSubmit={handleOpenpayCardPayment} className="space-y-5 animate-in fade-in duration-300">
                      <input type="hidden" name="deviceIdHiddenFieldName" value={deviceSessionId} />

                      {/* Barra institucional de tarjetas participantes con logotipos vectoriales reales */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-tr from-primary/5 to-transparent p-4 rounded-xl border border-primary/15">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold uppercase tracking-wider text-primary">Procesamiento Bancario Directo</p>
                          <p className="text-xs text-muted-foreground">Aceptamos todas las tarjetas de crédito y débito nacionales e internacionales</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* VISA SVG */}
                          <svg className="h-7 w-auto rounded shadow-2xs border border-slate-200/80" viewBox="0 0 48 32" fill="none" aria-label="Visa">
                            <rect width="48" height="32" rx="4" fill="#ffffff"/>
                            <path d="M19.5 21.5L21.6 10.5H25L22.9 21.5H19.5ZM34.9 10.8C34.2 10.5 33.1 10.2 31.7 10.2C28.2 10.2 25.7 12 25.7 14.5C25.7 16.4 27.4 17.4 28.7 18C30 18.6 30.5 19 30.5 19.6C30.5 20.5 29.4 20.9 28.3 20.9C26.9 20.9 26.1 20.7 24.9 20.2L24.4 20L23.9 23C24.8 23.4 26.4 23.7 28 23.7C31.7 23.7 34.1 21.9 34.1 19.2C34.1 17.7 33.2 16.5 31.1 15.6C29.9 15 29.1 14.6 29.1 14C29.1 13.4 29.8 12.8 31.2 12.8C32.4 12.8 33.3 13 34 13.3L34.4 13.5L34.9 10.8ZM43.5 10.5H40.8C39.9 10.5 39.3 10.8 38.9 11.7L33.6 21.5H37.3L38 19.5H42.5L42.9 21.5H46.2L43.5 10.5ZM39.1 17C39.4 16.2 40.6 13.1 40.6 13.1C40.6 13.1 40.9 12.3 41.1 11.8L41.4 13L42.3 17H39.1ZM16.6 10.5L13.1 18L12.7 16.1C12.1 14 10.1 11.8 7.9 10.7L11.1 21.5H14.8L20.3 10.5H16.6Z" fill="#1434CB"/>
                            <path d="M10 10.5H4.3L4.2 10.8C8.6 11.9 11.5 14.6 12.7 16.1L11.5 11.7C11.3 10.8 10.7 10.5 10 10.5Z" fill="#F9A533"/>
                          </svg>
                          {/* MASTERCARD SVG */}
                          <svg className="h-7 w-auto rounded shadow-2xs border border-slate-200/80" viewBox="0 0 48 32" fill="none" aria-label="Mastercard">
                            <rect width="48" height="32" rx="4" fill="#ffffff"/>
                            <circle cx="19" cy="16" r="8.5" fill="#EB001B"/>
                            <circle cx="29" cy="16" r="8.5" fill="#F79E1B"/>
                            <path d="M24 9.36A8.48 8.48 0 0 0 20.5 16c0 2.75 1.38 5.19 3.5 6.64A8.48 8.48 0 0 0 27.5 16c0-2.75-1.38-5.19-3.5-6.64Z" fill="#FF5F00"/>
                          </svg>
                          {/* AMERICAN EXPRESS SVG */}
                          <svg className="h-7 w-auto rounded shadow-2xs border border-slate-200/80" viewBox="0 0 48 32" fill="none" aria-label="American Express">
                            <rect width="48" height="32" rx="4" fill="#006FCF"/>
                            <path d="M9.5 19.5L12.8 12.5H16.2L19.5 19.5H17.1L16.4 17.9H12.6L11.9 19.5H9.5ZM13.3 16.2H15.7L14.5 13.5L13.3 16.2ZM20.5 19.5V12.5H23.8L25.5 16.6L27.2 12.5H30.5V19.5H28.4V14.6L26.4 19.5H24.6L22.6 14.6V19.5H20.5ZM32 19.5V12.5H38.5V14.2H34.1V15.2H38.3V16.8H34.1V17.8H38.5V19.5H32Z" fill="white"/>
                          </svg>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="op-holder" className="text-xs font-semibold text-muted-foreground">Nombre del titular (como aparece en la tarjeta)</Label>
                          <Input
                            id="op-holder"
                            data-openpay-card="holder_name"
                            placeholder="NOMBRE Y APELLIDO"
                            value={cardHolderName}
                            onChange={e => setCardHolderName(e.target.value.toUpperCase())}
                            autoComplete="cc-name"
                            required
                            className="h-11 bg-background/80 border-border/70 focus:border-primary uppercase font-medium tracking-wide"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="op-number" className="text-xs font-semibold text-muted-foreground">Número de tarjeta</Label>
                          <div className="relative">
                            <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
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
                              className="h-11 pl-10 pr-16 bg-background/80 border-border/70 focus:border-primary font-mono tracking-wider text-base"
                            />
                            {/* Detección visual de marca en tiempo real */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                              {cardNumber.startsWith('4') ? (
                                <span className="text-[11px] font-black italic text-[#1434CB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">VISA</span>
                              ) : /^(5[1-5]|2[2-7])/.test(cardNumber.replace(/\s/g, '')) ? (
                                <div className="flex items-center -space-x-1.5">
                                  <span className="w-3.5 h-3.5 rounded-full bg-[#EB001B] inline-block" />
                                  <span className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] inline-block opacity-90" />
                                </div>
                              ) : /^3[47]/.test(cardNumber.replace(/\s/g, '')) ? (
                                <span className="text-[10px] font-black text-white bg-[#006FCF] px-1.5 py-0.5 rounded">AMEX</span>
                              ) : (
                                <Lock className="w-4 h-4 text-muted-foreground/50" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="op-month" className="text-xs font-semibold text-muted-foreground">Mes (MM)</Label>
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
                              className="h-11 bg-background/80 border-border/70 focus:border-primary font-mono text-center"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="op-year" className="text-xs font-semibold text-muted-foreground">Año (AA)</Label>
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
                              className="h-11 bg-background/80 border-border/70 focus:border-primary font-mono text-center"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="op-cvv" className="text-xs font-semibold text-muted-foreground">Código CVV</Label>
                            <div className="relative">
                              <Input
                                id="op-cvv"
                                data-openpay-card="cvv2"
                                type="password"
                                placeholder="•••"
                                inputMode="numeric"
                                maxLength={4}
                                value={cardCvv}
                                onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                autoComplete="cc-csc"
                                required
                                className="h-11 bg-background/80 border-border/70 focus:border-primary font-mono text-center pr-8"
                              />
                              <ShieldCheck className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500/80 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isProcessingOpenpayCard}
                        className="w-full py-6 font-bold text-lg shadow-xl rounded-xl transition-all duration-300"
                      >
                        {isProcessingOpenpayCard ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Verificando y autorizando con tu banco...
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5 mr-2" />
                            Pagar {formatCurrency(finalTotal!)}
                          </>
                        )}
                      </Button>

                      {/* Sellos Oficiales de Respaldo Bancario Openpay BBVA */}
                      <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] text-muted-foreground/80">Transacciones realizadas vía:</span>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-border/60">
                            <span className="font-black tracking-tight text-xs text-[#004481] dark:text-sky-400">openpay</span>
                            <span className="text-[10px] font-bold text-[#004481]/80 dark:text-sky-300 border-l border-slate-300 dark:border-slate-600 pl-1.5">Grupo BBVA</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/90">
                          <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
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
