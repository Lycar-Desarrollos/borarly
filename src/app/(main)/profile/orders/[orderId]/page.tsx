"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { fetchUserOrders } from '@/services/orderService';
import type { Order, BillingData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Building, CreditCard, Clock, AlertTriangle, Copy, ExternalLink, FileText, Package, Truck, Pencil, Lock, CheckCircle2, Save, X, Building2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagado', shipped: 'Enviado',
  delivered: 'Entregado', cancelled: 'Cancelado'
};

type BillingForm = {
  razonSocial: string; rfc: string; regimenFiscal: string; usoCFDI: string; zip: string;
};

const EMPTY_BILLING: BillingForm = { razonSocial: '', rfc: '', regimenFiscal: '', usoCFDI: '', zip: '' };

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingBilling, setEditingBilling] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [billingForm, setBillingForm] = useState<BillingForm>(EMPTY_BILLING);

  useEffect(() => {
    if (!authLoading && !currentUser) { router.push('/login?redirect=/profile/orders'); return; }
    if (currentUser && userProfile?.uid) {
      const load = async () => {
        setLoading(true);
        try {
          const all = await fetchUserOrders(userProfile.uid);
          const found = all.find(o => o.id === orderId);
          if (!found) { toast({ variant: 'destructive', title: 'Pedido no encontrado' }); router.push('/profile/orders'); return; }
          setOrder(found);
          if (found.billingDetails) {
            setBillingForm({
              razonSocial: found.billingDetails.razonSocial || '',
              rfc: found.billingDetails.rfc || '',
              regimenFiscal: found.billingDetails.regimenFiscal || '',
              usoCFDI: found.billingDetails.usoCFDI || '',
              zip: found.billingDetails.zip || '',
            });
          }
        } catch {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el pedido.' });
          router.push('/profile/orders');
        } finally { setLoading(false); }
      };
      load();
    }
  }, [currentUser, userProfile, authLoading, orderId, router, toast]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const formatDate = (iso?: string) => {
    if (!iso) return 'N/A';
    try { return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return 'N/A'; }
  };

  const getBadgeVariant = (status?: Order['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending': return 'outline'; case 'paid': return 'default';
      case 'shipped': return 'secondary'; case 'delivered': return 'default';
      case 'cancelled': return 'destructive'; default: return 'outline';
    }
  };

  const handleSaveBilling = async () => {
    if (!order) return;
    if (!billingForm.razonSocial || !billingForm.rfc) {
      toast({ variant: 'destructive', description: 'Razón Social y RFC son requeridos.' }); return;
    }
    setSavingBilling(true);
    try {
      const ref = doc(db, 'orders', order.id);
      await updateDoc(ref, {
        requiresBilling: true,
        billingDetails: { ...billingForm },
        updatedAt: new Date().toISOString(),
      });
      setOrder(prev => prev ? { ...prev, requiresBilling: true, billingDetails: { ...billingForm } } : prev);
      setEditingBilling(false);
      toast({ description: '✅ Datos de facturación actualizados correctamente.' });
    } catch {
      toast({ variant: 'destructive', description: 'Error al guardar. Intenta de nuevo.' });
    } finally { setSavingBilling(false); }
  };

  const handleDeleteBilling = async () => {
    if (!order) return;
    setSavingBilling(true);
    try {
      const ref = doc(db, 'orders', order.id);
      await updateDoc(ref, { requiresBilling: false, billingDetails: null, updatedAt: new Date().toISOString() });
      setOrder(prev => prev ? { ...prev, requiresBilling: false, billingDetails: undefined } : prev);
      setBillingForm(EMPTY_BILLING);
      setEditingBilling(false);
      toast({ description: 'Datos de facturación eliminados.' });
    } catch {
      toast({ variant: 'destructive', description: 'Error al eliminar. Intenta de nuevo.' });
    } finally { setSavingBilling(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) return null;

  const isExpired = order.status === 'pending' && new Date().getTime() - new Date(order.createdAt).getTime() > 24 * 60 * 60 * 1000;
  const defaultPaymentTab = order.paymentDetails?.method === 'oxxo' ? 'oxxo' : 'spei';
  const hasTracking = !!(order.trackingNumber || order.trackingDocumentUrl || order.shippingProvider);
  const canEditBilling = order.status === 'paid';

  return (
    <div className="space-y-6">

      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b">
        <div>
          <Link href="/profile/orders">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" /> Regresar a Pedidos
            </Button>
          </Link>
          <h1 className="text-2xl font-black tracking-tight">
            Pedido <span className="text-primary font-mono">#{order.id.substring(0, 8).toUpperCase()}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={getBadgeVariant(order.status)} className="capitalize text-sm px-4 py-2 self-start sm:self-center">
          {STATUS_LABELS[order.status] || order.status}
        </Badge>
      </div>

      {/* ═══════════════════════════════════════════
          BANNER DE RASTREO — solo si tiene guía
         ═══════════════════════════════════════════ */}
      {hasTracking && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-5 text-white shadow-lg shadow-primary/20">
          {/* Decoración de fondo */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-2 bottom-2 h-20 w-20 rounded-full bg-white/5" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-5 w-5" />
              <p className="font-black text-base uppercase tracking-wider">Tu Pedido Está en Camino</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {order.shippingProvider && (
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                  <p className="text-[10px] uppercase font-bold text-white/70 mb-0.5">Paquetería</p>
                  <p className="font-bold text-lg">{order.shippingProvider}</p>
                </div>
              )}
              {order.trackingNumber && (
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                  <p className="text-[10px] uppercase font-bold text-white/70 mb-0.5">Número de Guía</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg tracking-widest">{order.trackingNumber}</span>
                    <button
                      className="h-7 w-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                      onClick={() => { navigator.clipboard.writeText(order.trackingNumber || ''); toast({ description: 'Guía copiada al portapapeles' }); }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {order.trackingDocumentUrl && (
              <a href={order.trackingDocumentUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex mr-3">
                <Button variant="secondary" className="bg-white text-primary hover:bg-white/90 font-bold shadow-md">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver Guía / Etiqueta Oficial
                </Button>
              </a>
            )}
            {order.trackingUrl && (
              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex">
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white font-bold border border-white/30">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Rastrear en Sitio de Paquetería
                </Button>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ARTÍCULOS */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Artículos del Pedido</h2>
        <div className="space-y-3">
          {order.items.map((item, index) => {
            const imgSrc = item.imageUrl || "https://placehold.co/64x64.png";
            return (
              <div key={item.productId + '_' + index} className="flex items-center justify-between gap-4 pb-3 border-b last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="relative w-[58px] h-[58px] bg-white rounded-lg border overflow-hidden shrink-0">
                    <Image src={imgSrc} alt={item.name || 'Artículo'} layout="fill" objectFit="contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm leading-snug line-clamp-2">{item.name || 'Artículo Desconocido'}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase bg-muted px-1.5 py-0.5 rounded w-fit mt-0.5">
                      Modelo: {item.sku || item.productId}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.quantity} x {formatCurrency(item.price)}</p>
                  </div>
                </div>
                <p className="font-bold text-sm shrink-0">{formatCurrency(item.quantity * item.price)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* TOTALES */}
      <div className="space-y-1.5 text-sm max-w-xs ml-auto">
        <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>Envío</span><span>{formatCurrency(order.shippingCost)}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>IVA (16%)</span><span>{formatCurrency(order.vatAmount)}</span></div>
        <div className="flex justify-between font-black text-base pt-2 border-t"><span>Total</span><span>{formatCurrency(order.totalAmount)}</span></div>
      </div>

      {/* INSTRUCCIONES DE PAGO — solo si está pendiente */}
      {order.status === 'pending' && (
        <>
          <Separator />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Instrucciones de Pago</h2>
          {isExpired ? (
            <div className="p-4 border border-dashed border-destructive/50 rounded-xl bg-destructive/5 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive text-sm">Referencia de Pago Expirada</p>
                <p className="text-xs text-destructive/80 mt-0.5">Contacta a soporte o realiza un nuevo pedido.</p>
              </div>
            </div>
          ) : (
            <Tabs defaultValue={defaultPaymentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="spei"><Building className="mr-2 h-4 w-4" />Transferencia SPEI</TabsTrigger>
                <TabsTrigger value="oxxo"><CreditCard className="mr-2 h-4 w-4" />Depósito OXXO</TabsTrigger>
              </TabsList>
              <TabsContent value="spei">
                <div className="p-5 mt-2 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-primary">Transferencia SPEI</h3>
                    <Badge variant="outline" className="text-[10px]">BBVA / BANCOMER</Badge>
                  </div>
                  <div className="grid gap-3">
                    {[
                      { label: 'Concepto / Referencia', value: order.paymentReference || 'N/A', copy: order.paymentReference || '', desc: 'Referencia copiada', color: 'text-primary' },
                      { label: 'CLABE Interbancaria', value: '012 180 01576278534 6', copy: '012180015762785346', desc: 'CLABE copiada', color: '' },
                      { label: 'Número de Cuenta', value: '157 627 8534', copy: '1576278534', desc: 'Cuenta copiada', color: '' },
                    ].map(f => (
                      <div key={f.label} className="bg-background/60 p-3 rounded-lg border">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{f.label}</p>
                        <div className="flex items-center justify-between">
                          <span className={`font-mono font-bold text-base ${f.color}`}>{f.value}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(f.copy); toast({ description: f.desc }); }}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
                      <Building className="h-3 w-3 shrink-0" /> Titular: <strong>Edgar Ydalimir Arevalo Escobedo</strong>
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                    <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                      Tu pago será validado automáticamente. Tan pronto como nuestro sistema detecte el depósito, este pedido cambiará a <strong>Pagado</strong> de forma autónoma.
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="oxxo">
                <div className="p-5 mt-2 border-2 border-dashed border-orange-500/30 rounded-xl bg-orange-500/5 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-orange-600">Depósito en OXXO</h3>
                    <Badge variant="outline" className="text-[10px] border-orange-500/30 text-orange-600">SANTANDER</Badge>
                  </div>
                  <div className="bg-background/60 p-3 rounded-lg border">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Número de Tarjeta (Santander)</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-base text-orange-700">4152 3141 6673 6093</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-600" onClick={() => { navigator.clipboard.writeText('4152314166736093'); toast({ description: 'Tarjeta copiada' }); }}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-orange-800/80 dark:text-orange-300 italic">
                    Indica en cajero que deseas realizar un depósito a esta tarjeta.
                  </p>
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-3">
                    <Clock className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed">
                      Tu pago en OXXO será enlazado a nuestra cuenta. Tan pronto como detectemos la transacción, el pedido cambiará a <strong>Pagado</strong> automáticamente.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </>
      )}

      {/* DIRECCIÓN + FACTURACIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">

        {/* Dirección de Envío */}
        <div className="bg-muted/30 p-4 rounded-xl border">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Dirección de Envío
          </h3>
          {order.shippingAddress ? (
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">{order.shippingAddress.contactEmail}</p>
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''} C.P. {order.shippingAddress.zip}</p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && <p className="pt-1">{order.shippingAddress.phone}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No se especificó dirección.</p>
          )}
        </div>

        {/* ═══════════════════════════════════════════
            FACTURACIÓN — editable solo si está Pagado
           ═══════════════════════════════════════════ */}
        <div className="bg-muted/30 p-4 rounded-xl border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" /> Datos de Facturación
            </h3>
            {canEditBilling && !editingBilling && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary" onClick={() => { setEditingBilling(true); if (!billingForm.razonSocial && order.billingDetails) setBillingForm({ razonSocial: order.billingDetails.razonSocial || '', rfc: order.billingDetails.rfc || '', regimenFiscal: order.billingDetails.regimenFiscal || '', usoCFDI: order.billingDetails.usoCFDI || '', zip: order.billingDetails.zip || '' }); }}>
                <Pencil className="h-3 w-3" /> {order.requiresBilling && order.billingDetails ? 'Editar' : 'Agregar Factura'}
              </Button>
            )}
            {!canEditBilling && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Lock className="h-3 w-3" /> Solo editable en estado Pagado
              </span>
            )}
          </div>

          {/* MODO EDICIÓN */}
          {editingBilling ? (
            <div className="space-y-3">
              {/* RFCs guardados en perfil — selección rápida */}
              {userProfile?.savedBilling && (userProfile.savedBilling as BillingData[]).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Selecciona un RFC de tu perfil</p>
                  <div className="grid gap-2">
                    {(userProfile.savedBilling as BillingData[]).map(bill => (
                      <button
                        key={bill.id}
                        type="button"
                        onClick={() => setBillingForm({ razonSocial: bill.razonSocial || '', rfc: bill.rfc || '', regimenFiscal: bill.regimenFiscal || '', usoCFDI: bill.usoCFDI || '', zip: bill.zip || '' })}
                        className={`text-left w-full px-3 py-2 rounded-lg border text-xs transition-colors hover:border-primary hover:bg-primary/5 ${billingForm.rfc === bill.rfc ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'}`}
                      >
                        <span className="font-mono font-bold block">{bill.rfc}</span>
                        <span className="text-muted-foreground">{bill.razonSocial}</span>
                      </button>
                    ))}
                  </div>
                  <Separator />
                  <p className="text-[10px] text-muted-foreground">O edita manualmente:</p>
                </div>
              )}
              <div className="grid gap-2">
                <div>
                  <Label className="text-xs">Razón Social *</Label>
                  <Input className="h-8 text-sm mt-1" placeholder="Mi Empresa S.A. de C.V." value={billingForm.razonSocial} onChange={e => setBillingForm(p => ({ ...p, razonSocial: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">RFC *</Label>
                  <Input className="h-8 text-sm mt-1 uppercase" placeholder="XAXX010101000" value={billingForm.rfc} onChange={e => setBillingForm(p => ({ ...p, rfc: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <Label className="text-xs">Régimen Fiscal</Label>
                  <Input className="h-8 text-sm mt-1" placeholder="601 - General de Ley Personas Morales" value={billingForm.regimenFiscal} onChange={e => setBillingForm(p => ({ ...p, regimenFiscal: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Uso CFDI</Label>
                  <Input className="h-8 text-sm mt-1" placeholder="G03 - Gastos en general" value={billingForm.usoCFDI} onChange={e => setBillingForm(p => ({ ...p, usoCFDI: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Código Postal Fiscal</Label>
                  <Input className="h-8 text-sm mt-1" placeholder="97000" value={billingForm.zip} onChange={e => setBillingForm(p => ({ ...p, zip: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 h-8 text-xs gap-1" onClick={handleSaveBilling} disabled={savingBilling}>
                  {savingBilling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Guardar
                </Button>
                {order.requiresBilling && order.billingDetails && (
                  <Button size="sm" variant="destructive" className="h-8 text-xs gap-1 px-3" onClick={handleDeleteBilling} disabled={savingBilling}>
                    <X className="h-3 w-3" /> Eliminar
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingBilling(false)} disabled={savingBilling}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : order.requiresBilling && order.billingDetails ? (
            /* MODO LECTURA — con datos */
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Factura solicitada</span>
              </div>
              <p className="font-bold text-foreground">{order.billingDetails.razonSocial}</p>
              <p>RFC: <span className="font-medium font-mono">{order.billingDetails.rfc}</span></p>
              {order.billingDetails.regimenFiscal && <p>Régimen: {order.billingDetails.regimenFiscal}</p>}
              {order.billingDetails.usoCFDI && <p>Uso CFDI: {order.billingDetails.usoCFDI}</p>}
              {order.billingDetails.zip && <p>C.P.: {order.billingDetails.zip}</p>}
            </div>
          ) : (
            /* MODO LECTURA — sin datos */
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground italic">No se solicitó factura para este pedido.</p>
              {!canEditBilling && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Para solicitar factura el pedido debe estar en estado <strong>Pagado</strong>.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
