"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Loader2, RefreshCw, Trash2, ShoppingCart, Clock, CheckCircle2, XCircle, Truck, Package, Search, Filter, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/lib/types';
import { Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { fetchAllOrders } from '@/services/orderService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { getQuoteLogoUrl, getBankDetails } from '@/services/settingsService';

// Utility for PDF images
const getImageBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error cargando imagen para PDF:", error);
    return null;
  }
};

async function updateOrderStatusInDb(orderId: string, status: Order['status']): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: Timestamp.now() });
}
async function deleteOrderFromDb(orderId: string): Promise<void> {
  await deleteDoc(doc(db, 'orders', orderId));
}

const STATUS_CONFIG: Record<Order['status'], { label: string; color: string; bg: string; icon: any }> = {
  pending:   { label: 'Pendiente',  color: 'text-[#FF9F0A]', bg: 'bg-[#FF9F0A]/10 border border-[#FF9F0A]/20', icon: Clock },
  paid:      { label: 'Pagado',     color: 'text-[#00E676]', bg: 'bg-[#00E676]/10 border border-[#00E676]/20', icon: CheckCircle2 },
  shipped:   { label: 'Enviado',    color: 'text-[#0070FF]', bg: 'bg-[#0070FF]/10 border border-[#0070FF]/20', icon: Truck },
  delivered: { label: 'Entregado',  color: 'text-[#00E676]', bg: 'bg-[#00E676]/10 border border-[#00E676]/20', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado',  color: 'text-[#FF3B30]', bg: 'bg-[#FF3B30]/10 border border-[#FF3B30]/20', icon: XCircle },
};

const STATUS_TRANSLATIONS: Record<Order['status'], string> = {
  pending: "Pendiente", paid: "Pagado", shipped: "Enviado", delivered: "Entregado", cancelled: "Cancelado",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState({ provider: '', number: '', url: '' });
  const [trackingFile, setTrackingFile] = useState<File | null>(null);
  const [isUploadingTracking, setIsUploadingTracking] = useState(false);
  const { toast } = useToast();

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      setOrders(await fetchAllOrders());
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los pedidos." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatusInDb(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast({ title: "Estado Actualizado" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado." });
    }
  };

  const handleDelete = async (orderId: string) => {
    try {
      await deleteOrderFromDb(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast({ title: "Pedido Eliminado" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el pedido." });
    }
  };

  const handleSaveTracking = async () => {
    if (!trackingOrder) return;
    setIsUploadingTracking(true);
    let trackingDocumentUrl = trackingOrder.trackingDocumentUrl || '';

    try {
      if (trackingFile) {
        const fileRef = storageRef(storage, `orders/tracking/${trackingOrder.id}_${trackingFile.name}`);
        const uploadTask = await uploadBytesResumable(fileRef, trackingFile);
        trackingDocumentUrl = await getDownloadURL(uploadTask.ref);
      }

      await updateDoc(doc(db, 'orders', trackingOrder.id), {
        shippingProvider: trackingData.provider,
        trackingNumber: trackingData.number,
        trackingUrl: trackingData.url || null,
        trackingDocumentUrl,
        updatedAt: Timestamp.now()
      });

      setOrders(prev => prev.map(o => o.id === trackingOrder.id ? {
        ...o,
        shippingProvider: trackingData.provider,
        trackingNumber: trackingData.number,
        trackingUrl: trackingData.url || undefined,
        trackingDocumentUrl
      } : o));

      toast({ title: "Logística Actualizada", description: "La información de rastreo se ha asociado al pedido." });
      setTrackingOrder(null);
      setTrackingFile(null);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Error", description: "Ocurrió un error al guardar la guía." });
    } finally {
      setIsUploadingTracking(false);
    }
  };

  const handleDownloadPdf = async (order: Order) => {
    toast({ title: 'Generando PDF...', description: 'Por favor espera.' });
    const doc = new jsPDF();
    const pdfLogoUrl = await getQuoteLogoUrl();
    const bankDetails = await getBankDetails();
    
    let logoBase64: string | null = null;
    if (pdfLogoUrl) logoBase64 = await getImageBase64(pdfLogoUrl);

    if (logoBase64) {
      try { doc.addImage(logoBase64, 'PNG', 14, 10, 45, 22); } catch { /* skip */ }
    } else {
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text(bankDetails.companyName, 14, 20);
    }

    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('PEDIDO', 200, 20, { align: 'right' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Folio: #${order.id.substring(0, 8).toUpperCase()}`, 200, 26, { align: 'right' });
    doc.text(`Fecha: ${format(new Date(order.createdAt), 'dd/MM/yyyy')}`, 200, 31, { align: 'right' });
    doc.text(`Estado: ${STATUS_TRANSLATIONS[order.status]}`, 200, 36, { align: 'right' });

    doc.setLineWidth(0.5); doc.line(14, 45, 200, 45);
    
    // De parte de
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('De parte de:', 14, 52); doc.setFont('helvetica', 'normal');
    doc.text(bankDetails.companyName, 14, 58);
    doc.text(bankDetails.email, 14, 64);
    doc.text(bankDetails.phone, 14, 70);

    // Cliente y Envío
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente / Envío:', 120, 52); doc.setFont('helvetica', 'normal');
    
    let currentY = 58;
    if (order.shippingAddress) {
      const addr = order.shippingAddress;
      // Email y Teléfono arriba
      if (addr.contactEmail) {
        doc.text(`Email: ${addr.contactEmail}`, 120, currentY);
        currentY += 6;
      }
      if (addr.phone) {
        doc.text(`Tel: ${addr.phone}`, 120, currentY);
        currentY += 6;
      }

      // Dirección
      const splitAddr = doc.splitTextToSize(`${addr.street}, ${addr.city}, CP ${addr.zip}`, 75);
      doc.text(splitAddr, 120, currentY);
    } else {
      doc.text(order.userId || 'Cliente BORARLY', 120, currentY);
    }

    (doc as any).autoTable({
      startY: 85,
      head: [['#', 'Producto / Modelo', 'Cant.', 'Precio Unit.', 'Total']],
      body: order.items.map((item, i) => [
        i + 1,
        item.name + `\n(Modelo: ${item.sku || item.productId})`,
        item.quantity,
        fmt(item.price),
        fmt(item.price * item.quantity),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [103, 58, 183] }, // BORARLY Purple
      styles: { halign: 'center' },
      columnStyles: { 1: { halign: 'left', cellWidth: 80 }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 140;
    const totalsX = 140;
    let totalsY = finalY + 10;

    doc.setFontSize(12);
    doc.text('Subtotal:', totalsX, totalsY, { align: 'right' });
    doc.text(fmt(order.subtotal), 200, totalsY, { align: 'right' });
    
    if (order.shippingCost > 0) {
      totalsY += 7;
      doc.text('Envío:', totalsX, totalsY, { align: 'right' });
      doc.text(fmt(order.shippingCost), 200, totalsY, { align: 'right' });
    }
    
    totalsY += 7;
    doc.text('IVA (16%):', totalsX, totalsY, { align: 'right' });
    doc.text(fmt(order.vatAmount), 200, totalsY, { align: 'right' });
    
    totalsY += 7; doc.setFont('helvetica', 'bold');
    doc.text('Total (MXN):', totalsX, totalsY, { align: 'right' });
    doc.text(fmt(order.totalAmount), 200, totalsY, { align: 'right' });

    // Instrucciones de Pago
    let paymentY = totalsY + 15;
    if (paymentY > 250) { doc.addPage(); paymentY = 20; }
    
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Datos de Pago para Transferencia:', 14, paymentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Referencia: ${order.paymentReference || 'SPEI'}`, 14, paymentY + 6);
    doc.text(`Beneficiario: ${bankDetails.beneficiary}`, 14, paymentY + 12);
    doc.text(`Cuenta CLABE: ${bankDetails.clabe}`, 14, paymentY + 18);
    doc.text(`Banco: ${bankDetails.bank}`, 14, paymentY + 24);

    doc.setFontSize(9); doc.setTextColor(150);
    doc.text('Este documento sirve como comprobante de pedido y reserva de stock.', 105, 285, { align: 'center' });
    
    doc.save(`Pedido_${order.id.substring(0, 8)}_${order.id.toUpperCase()}.pdf`);
    toast({ title: 'PDF Descargado' });
  };

  const fmt = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const fmtDate = (iso: string | undefined) => {
    if (!iso) return 'N/A';
    try { return new Date(iso).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return '—'; }
  };

  const filtered = useMemo(() =>
    orders.filter(o => {
      const q = filter.toLowerCase();
      const matchSearch = !q || o.id.toLowerCase().includes(q) || o.userId.toLowerCase().includes(q) || o.shippingAddress?.city?.toLowerCase().includes(q);
      return matchSearch && (statusFilter === 'all' || o.status === statusFilter);
    }), [orders, filter, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  return (
    <div className="bg-background text-foreground pb-16">
      {/* HEADER */}
      <div className="relative overflow-hidden border-b border-border bg-card px-6 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,112,255,0.05),transparent_60%)]" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-1">Gestión</p>
            <h1 className="text-3xl font-black tracking-tighter text-foreground">Pedidos</h1>
            <p className="text-muted-foreground text-sm mt-1">{orders.length} pedidos encontrados</p>
          </div>
          <Button onClick={loadOrders} disabled={isLoading}
            className="gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Actualizar
          </Button>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-5">
        {/* STATUS PILLS */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const).map(s => {
            const isAll = s === 'all';
            const cfg = !isAll ? STATUS_CONFIG[s] : null;
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  active
                    ? (cfg ? `${cfg.bg} ${cfg.color}` : 'bg-primary/10 border-primary/20 text-primary')
                    : 'bg-muted border-border text-muted-foreground hover:border-primary/50'
                }`}>
                {cfg && <cfg.icon className="w-3 h-3" />}
                {isAll ? 'Todos' : STATUS_TRANSLATIONS[s]}
                <span className="ml-0.5 opacity-60">({statusCounts[s] || 0})</span>
              </button>
            );
          })}
        </div>

        {/* SEARCH */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, cliente, ciudad..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary h-11"
          />
        </div>

        {/* ORDERS TABLE */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {isLoading && !orders.length ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <ShoppingCart className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">No se encontraron pedidos.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {/* TABLE HEADER */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Pedido</span>
                <span>Total</span>
                <span>Estado</span>
                <span>Fecha</span>
                <span>Acciones</span>
              </div>
              {filtered.map(order => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
                const Icon = cfg.icon;
                return (
                  <div key={order.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-4 items-center hover:bg-muted/50 transition-colors">
                    {/* ID */}
                    <div>
                      <p className="font-bold text-foreground text-sm">#{order.id.substring(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">{order.items.length} art. · {order.shippingAddress?.city || '—'}</p>
                    </div>
                    {/* TOTAL */}
                    <p className="font-black text-foreground text-sm">{fmt(order.totalAmount)}</p>
                    {/* STATUS SELECT */}
                    <Select value={order.status} onValueChange={(s: Order['status']) => handleStatusChange(order.id, s)}>
                      <SelectTrigger className={`w-[130px] h-8 text-xs font-bold rounded-full px-3 border ${cfg.bg} ${cfg.color} [&>svg]:hidden`}>
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3 h-3" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        {Object.entries(STATUS_TRANSLATIONS).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* DATE */}
                    <p className="text-xs text-muted-foreground hidden md:block">{fmtDate(order.createdAt)}</p>
                    {/* ACTIONS */}
                    <div className="flex gap-1.5 items-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button onClick={() => setSelectedOrder(order)}
                            className="w-8 h-8 rounded-lg bg-muted border border-border hover:border-primary/50 hover:bg-primary/10 flex items-center justify-center transition-all">
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </DialogTrigger>
                        {selectedOrder?.id === order.id && (
                          <DialogContent className="sm:max-w-2xl bg-card border-border text-foreground">
                            <DialogHeader>
                              <DialogTitle className="font-black">Pedido #{selectedOrder.id.substring(0, 8).toUpperCase()}</DialogTitle>
                              <DialogDescription className="text-muted-foreground">{fmtDate(selectedOrder.createdAt)}</DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[60vh] overflow-y-auto space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border border-border bg-muted/50 p-4">
                                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Dirección</p>
                                  <p className="text-sm font-medium">{selectedOrder.shippingAddress?.street}</p>
                                  <p className="text-sm font-medium">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.zip}</p>
                                  <p className="text-sm font-medium">{selectedOrder.shippingAddress?.country}</p>
                                </div>
                                <div className="rounded-xl border border-border bg-muted/50 p-4">
                                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Pago</p>
                                  <p className="text-sm font-medium">Ref: {selectedOrder.paymentReference || 'N/A'}</p>
                                  <p className={`text-sm font-bold mt-1 ${STATUS_CONFIG[selectedOrder.status]?.color}`}>{STATUS_TRANSLATIONS[selectedOrder.status]}</p>
                                </div>
                              </div>
                              <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Artículos ({selectedOrder.items.length})</p>
                                {selectedOrder.items.map(item => (
                                  <div key={item.productId} className="flex justify-between text-sm py-2 border-b border-border/60 last:border-0">
                                    <span className="font-medium text-foreground">{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                                    <span className="font-bold text-foreground">{fmt(item.price * item.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-1.5 text-sm">
                                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{fmt(selectedOrder.subtotal)}</span></div>
                                <div className="flex justify-between text-muted-foreground"><span>Envío</span><span>{fmt(selectedOrder.shippingCost)}</span></div>
                                <div className="flex justify-between text-muted-foreground"><span>IVA</span><span>{fmt(selectedOrder.vatAmount)}</span></div>
                                <Separator className="bg-border my-2" />
                                <div className="flex justify-between font-black text-foreground text-base"><span>Total</span><span>{fmt(selectedOrder.totalAmount)}</span></div>
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline" className="border-border text-foreground">Cerrar</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>

                      {/* TRACKING DIALOG */}
                      {order.status === 'pending' || order.status === 'cancelled' ? (
                        <button disabled className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-muted border border-border opacity-40 cursor-not-allowed" title="La guía se habilita cuando el estatus es PAGADO">
                          <Package className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button onClick={() => {
                              setTrackingOrder(order);
                              setTrackingData({ provider: order.shippingProvider || '', number: order.trackingNumber || '', url: order.trackingUrl || '' });
                              setTrackingFile(null);
                            }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${order.trackingNumber || order.trackingDocumentUrl ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20' : 'bg-muted border border-border hover:border-blue-500/50 hover:bg-blue-500/10 text-muted-foreground'}`}
                              title="Gestionar Logística (Rastreo)">
                              <Package className="w-3.5 h-3.5" />
                            </button>
                          </DialogTrigger>
                          {trackingOrder?.id === order.id && (
                          <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
                            <DialogHeader>
                              <DialogTitle className="font-black">Asignar Guía de Rastreo</DialogTitle>
                              <DialogDescription className="text-muted-foreground">Pedido #{order.id.substring(0, 8).toUpperCase()}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-3">
                              <div className="space-y-1.5">
                                <Label>Paquetería / Transportista</Label>
                                <Input 
                                  placeholder="Ej: FedEx, DHL, Transporte Propio..." 
                                  value={trackingData.provider}
                                  onChange={e => setTrackingData({...trackingData, provider: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Número de Guía (Texto)</Label>
                                <Input 
                                  placeholder="Escribe el código de rastreo" 
                                  value={trackingData.number}
                                  onChange={e => setTrackingData({...trackingData, number: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Comprobante Físico / Etiqueta (Opcional)</Label>
                                <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors">
                                  <input 
                                    type="file" 
                                    id={`tracking-file-${order.id}`}
                                    className="hidden" 
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) setTrackingFile(e.target.files[0]);
                                    }}
                                  />
                                  <label htmlFor={`tracking-file-${order.id}`} className="cursor-pointer flex flex-col items-center gap-2">
                                    <Upload className="h-6 w-6 text-muted-foreground" />
                                    <span className="text-sm font-medium">{trackingFile ? trackingFile.name : 'Subir archivo o imagen PDF'}</span>
                                    {order.trackingDocumentUrl && !trackingFile && (
                                      <span className="text-xs text-green-500 block">Ya existe un archivo guardado</span>
                                    )}
                                  </label>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label>Link de Rastreo (Opcional)</Label>
                                <Input
                                  type="url"
                                  placeholder="https://www.fedex.com/rastreo..."
                                  value={trackingData.url}
                                  onChange={e => setTrackingData({...trackingData, url: e.target.value})}
                                />
                                <p className="text-[10px] text-muted-foreground">El cliente podrá hacer clic en este enlace para rastrear su paquete en el sitio de la paquetería.</p>
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                              </DialogClose>
                              <Button onClick={handleSaveTracking} disabled={isUploadingTracking} className="min-w-[120px]">
                                {isUploadingTracking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Rastreo'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>
                    )}

                      <button onClick={() => handleDownloadPdf(order)}
                        className="w-8 h-8 rounded-lg bg-muted border border-border hover:border-green-500/50 hover:bg-green-500/10 flex items-center justify-center transition-all"
                        title="Descargar PDF">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="w-8 h-8 rounded-lg bg-muted border border-border hover:border-red-500/50 hover:bg-red-500/10 flex items-center justify-center transition-all">
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border text-foreground">
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar Pedido?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">Esta acción no se puede deshacer. Se eliminará el pedido #{order.id.substring(0, 8)} permanentemente.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border text-foreground">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(order.id)} className="bg-red-500 hover:bg-red-600 text-white">Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
