"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2, RefreshCw, Trash2, ShoppingCart, Clock, CheckCircle2,
  XCircle, Truck, Package, Search, FileText, Copy, MessageCircle,
  MoreVertical, ChevronRight, ArrowLeft, Upload, ExternalLink,
  Calendar, Download, Mail, Receipt,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/lib/types';
import { Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, storage, auth } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { fetchAllOrders, getOrderFinancials } from '@/services/orderService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { getQuoteLogoUrl, getBankDetails } from '@/services/settingsService';
import { cn } from '@/lib/utils';

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

const STATUS_CONFIG: Record<Order['status'], {
  label: string;
  tabLabel: string;
  headline: string;
  subtitle: string;
  textColor: string;
  badgeBg: string;
  leftBorder: string;
  icon: any;
}> = {
  pending: {
    label: 'Pendiente de pago',
    tabLabel: 'Por confirmar',
    headline: 'Pago pendiente de confirmación',
    subtitle: 'En espera de transferencia SPEI, depósito en OXXO o confirmación de pago.',
    textColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
    leftBorder: 'border-l-amber-500',
    icon: Clock,
  },
  paid: {
    label: 'Pagado',
    tabLabel: 'Por enviar',
    headline: 'Pagado · Listo para preparar envío',
    subtitle: 'El pago está confirmado. Prepara el paquete y asigna la guía de rastreo.',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
    leftBorder: 'border-l-emerald-500',
    icon: CheckCircle2,
  },
  shipped: {
    label: 'Enviado',
    tabLabel: 'En tránsito',
    headline: 'En camino al cliente',
    subtitle: 'El pedido ya fue despachado con paquetería.',
    textColor: 'text-primary',
    badgeBg: 'bg-primary/10 text-primary border-primary/25',
    leftBorder: 'border-l-primary',
    icon: Truck,
  },
  delivered: {
    label: 'Entregado',
    tabLabel: 'Finalizadas',
    headline: 'Entregado',
    subtitle: 'Venta completada y entregada en el domicilio del cliente.',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
    leftBorder: 'border-l-emerald-500',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelado',
    tabLabel: 'Canceladas',
    headline: 'Pedido cancelado',
    subtitle: 'Esta venta fue cancelada.',
    textColor: 'text-red-600 dark:text-red-400',
    badgeBg: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/25',
    leftBorder: 'border-l-red-500',
    icon: XCircle,
  },
};

const STATUS_TRANSLATIONS: Record<Order['status'], string> = {
  pending: "Pendiente",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

type DateRangeFilter = 'all' | 'today' | '7d' | '30d' | '60d';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('all');
  const [billingOnly, setBillingOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Vista de detalle estilo Mercado Libre ("Ventas > Detalle de la venta")
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  // Diálogo de guía de rastreo
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState({ provider: '', number: '', url: '' });
  const [trackingFile, setTrackingFile] = useState<File | null>(null);
  const [isUploadingTracking, setIsUploadingTracking] = useState(false);

  // Diálogo de confirmación de borrado
  const [deleteTargetOrder, setDeleteTargetOrder] = useState<Order | null>(null);

  const { toast } = useToast();

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      setOrders(await fetchAllOrders());
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las ventas." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const copyText = (value: string, label: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast({ description: `${label} copiado al portapapeles` });
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatusInDb(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast({ title: "Estado actualizado", description: `El pedido pasó a ${STATUS_TRANSLATIONS[newStatus]}.` });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado." });
    }
  };

  const handleDelete = async (orderId: string) => {
    try {
      await deleteOrderFromDb(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (detailOrderId === orderId) setDetailOrderId(null);
      setDeleteTargetOrder(null);
      toast({ title: "Venta eliminada" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el pedido." });
    }
  };

  const openTrackingModal = (order: Order) => {
    setTrackingOrder(order);
    setTrackingData({
      provider: order.shippingProvider || '',
      number: order.trackingNumber || '',
      url: order.trackingUrl || '',
    });
    setTrackingFile(null);
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
        updatedAt: Timestamp.now(),
      });

      setOrders(prev => prev.map(o => o.id === trackingOrder.id ? {
        ...o,
        shippingProvider: trackingData.provider,
        trackingNumber: trackingData.number,
        trackingUrl: trackingData.url || undefined,
        trackingDocumentUrl,
      } : o));

      toast({ title: "Logística actualizada", description: "La guía de rastreo quedó guardada en el pedido." });
      setTrackingOrder(null);
      setTrackingFile(null);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Error", description: "Ocurrió un error al guardar la guía." });
    } finally {
      setIsUploadingTracking(false);
    }
  };

  const fmt = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

  const fmtDate = (iso: string | undefined) => {
    if (!iso) return 'N/A';
    try {
      return new Date(iso).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const handleDownloadPdf = async (order: Order) => {
    toast({ title: 'Generando PDF...', description: 'Por favor espera.' });
    const pdfDoc = new jsPDF();
    const pdfLogoUrl = await getQuoteLogoUrl();
    const bankDetails = await getBankDetails();

    let logoBase64: string | null = null;
    if (pdfLogoUrl) logoBase64 = await getImageBase64(pdfLogoUrl);
    if (!logoBase64) logoBase64 = await getImageBase64('/logo.png');

    if (logoBase64) {
      try { pdfDoc.addImage(logoBase64, 'PNG', 14, 12, 48, 12); } catch { /* skip */ }
    } else {
      pdfDoc.setFontSize(16); pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text(bankDetails.companyName, 14, 20);
    }

    pdfDoc.setFontSize(20); pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('PEDIDO', 200, 20, { align: 'right' });
    pdfDoc.setFontSize(10); pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text(`Folio: #${order.id.substring(0, 8).toUpperCase()}`, 200, 26, { align: 'right' });
    pdfDoc.text(`Fecha: ${format(new Date(order.createdAt), 'dd/MM/yyyy')}`, 200, 31, { align: 'right' });
    pdfDoc.text(`Estado: ${STATUS_TRANSLATIONS[order.status]}`, 200, 36, { align: 'right' });

    pdfDoc.setLineWidth(0.5); pdfDoc.line(14, 45, 200, 45);

    pdfDoc.setFontSize(11); pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('De parte de:', 14, 52); pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text(bankDetails.companyName, 14, 58);
    pdfDoc.text(bankDetails.email, 14, 64);
    pdfDoc.text(bankDetails.phone, 14, 70);

    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Cliente / Envío:', 120, 52); pdfDoc.setFont('helvetica', 'normal');

    let currentY = 58;
    if (order.shippingAddress) {
      const addr = order.shippingAddress;
      if (addr.contactEmail) {
        pdfDoc.text(`Email: ${addr.contactEmail}`, 120, currentY);
        currentY += 6;
      }
      if (addr.phone) {
        pdfDoc.text(`Tel: ${addr.phone}`, 120, currentY);
        currentY += 6;
      }
      const splitAddr = pdfDoc.splitTextToSize(`${addr.street}, ${addr.city}, CP ${addr.zip}`, 75);
      pdfDoc.text(splitAddr, 120, currentY);
    } else {
      pdfDoc.text(order.userId || 'Cliente BORARLY', 120, currentY);
    }

    const fin = getOrderFinancials(order);

    (pdfDoc as any).autoTable({
      startY: 85,
      head: [['#', 'Producto / Modelo', 'Cant.', 'P. Unit. (s/IVA)', 'P. Unit. (c/IVA)', 'Importe (s/IVA)']],
      body: order.items.map((item, i) => {
        const unitConIva = fin.itemsAreVatInclusive ? item.price : item.price * 1.16;
        const unitSinIva = fin.itemsAreVatInclusive ? item.price / 1.16 : item.price;
        return [
          i + 1,
          item.name + `\n(Modelo: ${item.sku || item.productId})`,
          item.quantity,
          fmt(unitSinIva),
          fmt(unitConIva),
          fmt(unitSinIva * item.quantity),
        ];
      }),
      theme: 'striped',
      headStyles: { fillColor: [2, 86, 185] },
      styles: { halign: 'center', fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { halign: 'left', cellWidth: 72 },
        2: { cellWidth: 16 },
        3: { halign: 'right', cellWidth: 29 },
        4: { halign: 'right', cellWidth: 29 },
        5: { halign: 'right', cellWidth: 30 },
      },
    });

    const finalY = (pdfDoc as any).lastAutoTable.finalY || 140;
    const totalsX = 148;
    let totalsY = finalY + 10;

    pdfDoc.setFontSize(11);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text('Subtotal (sin IVA):', totalsX, totalsY, { align: 'right' });
    pdfDoc.text(fmt(fin.subtotalSinIva), 200, totalsY, { align: 'right' });

    totalsY += 7;
    pdfDoc.text('IVA (16%):', totalsX, totalsY, { align: 'right' });
    pdfDoc.text(fmt(fin.vatAmount), 200, totalsY, { align: 'right' });

    totalsY += 7;
    pdfDoc.text('Costo de envío:', totalsX, totalsY, { align: 'right' });
    pdfDoc.text(fin.shippingCost > 0 ? fmt(fin.shippingCost) : 'Gratis', 200, totalsY, { align: 'right' });

    totalsY += 8;
    pdfDoc.setFontSize(12);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Total (MXN, IVA incl.):', totalsX, totalsY, { align: 'right' });
    pdfDoc.text(fmt(fin.totalAmount), 200, totalsY, { align: 'right' });

    let paymentY = totalsY + 15;
    if (paymentY > 250) { pdfDoc.addPage(); paymentY = 20; }

    pdfDoc.setFontSize(10); pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Datos de Pago para Transferencia:', 14, paymentY);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text(`Referencia: ${order.paymentReference || 'SPEI'}`, 14, paymentY + 6);
    pdfDoc.text(`Beneficiario: ${bankDetails.beneficiary}`, 14, paymentY + 12);
    pdfDoc.text(`Cuenta CLABE: ${bankDetails.clabe}`, 14, paymentY + 18);
    pdfDoc.text(`Banco: ${bankDetails.bank}`, 14, paymentY + 24);

    pdfDoc.setFontSize(9); pdfDoc.setTextColor(150);
    pdfDoc.text('Este documento sirve como comprobante de pedido y reserva de stock.', 105, 285, { align: 'center' });

    pdfDoc.save(`Pedido_${order.id.substring(0, 8).toUpperCase()}.pdf`);
    toast({ title: 'PDF descargado' });
  };

  // Exportar a CSV compatible con Excel
  const handleExportCsv = (list: Order[]) => {
    const target = selectedIds.size > 0 ? list.filter(o => selectedIds.has(o.id)) : list;
    if (!target.length) {
      toast({ description: 'No hay ventas para exportar.' });
      return;
    }
    const headers = [
      'Folio', 'ID Completo', 'Fecha', 'Estado', 'Referencia Pago', 'Metodo Pago',
      'Email Cliente', 'Telefono', 'Ciudad', 'CP', 'Requiere Factura', 'RFC',
      'Razon Social', 'Paqueteria', 'Guia', 'Articulos', 'Subtotal (sin IVA)', 'IVA (16%)', 'Envio', 'Total (IVA incl.)',
    ];
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = target.map(o => {
      const fin = getOrderFinancials(o);
      return [
        o.id.substring(0, 8).toUpperCase(),
        o.id,
        o.createdAt,
        STATUS_TRANSLATIONS[o.status],
        o.paymentReference || '',
        o.paymentDetails?.method || '',
        o.shippingAddress?.contactEmail || '',
        o.shippingAddress?.phone || '',
        o.shippingAddress?.city || '',
        o.shippingAddress?.zip || '',
        o.requiresBilling ? 'SI' : 'NO',
        o.billingDetails?.rfc || '',
        o.billingDetails?.razonSocial || '',
        o.shippingProvider || '',
        o.trackingNumber || '',
        o.items.map(i => `${i.quantity}x ${i.sku || i.productId} (${i.name})`).join(' | '),
        fin.subtotalSinIva,
        fin.vatAmount,
        fin.shippingCost,
        fin.totalAmount,
      ].map(escape).join(',');
    });

    const csv = '\uFEFF' + [headers.map(escape).join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ventas_Borarly_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Archivo descargado', description: `${target.length} venta(s) exportadas a Excel (CSV).` });
  };

  const filtered = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    return orders.filter(o => {
      const q = filter.trim().toLowerCase();
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        (o.paymentReference || '').toLowerCase().includes(q) ||
        (o.userId || '').toLowerCase().includes(q) ||
        (o.shippingAddress?.contactEmail || '').toLowerCase().includes(q) ||
        (o.shippingAddress?.phone || '').toLowerCase().includes(q) ||
        (o.shippingAddress?.city || '').toLowerCase().includes(q) ||
        (o.billingDetails?.rfc || '').toLowerCase().includes(q) ||
        (o.billingDetails?.razonSocial || '').toLowerCase().includes(q) ||
        o.items.some(i =>
          (i.name || '').toLowerCase().includes(q) ||
          (i.sku || '').toLowerCase().includes(q) ||
          (i.productId || '').toLowerCase().includes(q)
        );

      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchBilling = !billingOnly || !!o.requiresBilling;

      let matchDate = true;
      if (dateFilter !== 'all') {
        const created = new Date(o.createdAt).getTime();
        if (!isNaN(created)) {
          if (dateFilter === 'today') {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            matchDate = created >= startOfToday.getTime();
          } else if (dateFilter === '7d') matchDate = now - created <= 7 * dayMs;
          else if (dateFilter === '30d') matchDate = now - created <= 30 * dayMs;
          else if (dateFilter === '60d') matchDate = now - created <= 60 * dayMs;
        }
      }

      return matchSearch && matchStatus && matchBilling && matchDate;
    });
  }, [orders, filter, statusFilter, dateFilter, billingOnly]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length, billing: 0 };
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
      if (o.requiresBilling) counts.billing += 1;
    });
    return counts;
  }, [orders]);

  const detailOrder = useMemo(
    () => (detailOrderId ? orders.find(o => o.id === detailOrderId) || null : null),
    [orders, detailOrderId]
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(o => o.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buildCustomerWhatsApp = (order: Order) => {
    const rawPhone = (order.shippingAddress?.phone || '').replace(/\D/g, '');
    if (!rawPhone) return null;
    const phone = rawPhone.length === 10 ? `521${rawPhone}` : rawPhone;
    const folio = order.id.substring(0, 8).toUpperCase();
    const msg = `Hola, te escribimos de Borarly respecto a tu pedido #${folio}.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSendOrderEmail = async (order: Order) => {
    setIsSendingEmail(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast({ title: 'Sesión requerida', description: 'Inicia sesión nuevamente para enviar el correo.', variant: 'destructive' });
        return;
      }
      const fin = getOrderFinancials(order);
      const res = await fetch('/api/orders/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderId: order.id,
          reference: order.paymentReference || order.id.substring(0, 8).toUpperCase(),
          createdAt: order.createdAt,
          status: order.status,
          paymentMethod: order.paymentDetails?.method || 'spei',
          customer: {
            name: order.billingDetails?.razonSocial || order.shippingAddress?.contactEmail || 'Cliente Borarly',
            email: order.shippingAddress?.contactEmail || '',
            phone: order.shippingAddress?.phone || '',
          },
          shipping: {
            street: order.shippingAddress?.street || 'Envío estándar',
            city: order.shippingAddress?.city || '',
            zip: order.shippingAddress?.zip || '',
            country: order.shippingAddress?.country || 'México',
          },
          items: (order.items || []).map(it => ({
            name: it.name,
            sku: it.sku || it.productId,
            quantity: it.quantity,
            price: fin.itemsAreVatInclusive ? it.price : parseFloat((it.price * 1.16).toFixed(2)),
            imageUrl: it.imageUrl || '',
          })),
          subtotal: fin.subtotalSinIva,
          vatAmount: fin.vatAmount,
          shippingCost: fin.shippingCost,
          total: fin.totalAmount,
          billing: order.requiresBilling && order.billingDetails ? order.billingDetails : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Error al enviar correo');
      }
      toast({
        title: 'Aviso enviado a ventas@borarly.com',
        description: `Se envió el detalle del pedido #${order.id.substring(0, 8).toUpperCase()} a ventas@borarly.com.`,
      });
    } catch (err: any) {
      toast({
        title: 'No se pudo enviar el correo',
        description: err?.message || 'Verifica la configuración SMTP.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/25 text-foreground pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 space-y-5">

        {/* ═══════════════════════════════════════════════════════════════════
            VISTA DE DETALLE DE VENTA (inspirada en Mercado Libre - Imagen 3)
           ═══════════════════════════════════════════════════════════════════ */}
        {detailOrder ? (
          <div className="space-y-6">
            {/* Barra superior: Breadcrumb + Imprimir datos */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav className="flex items-center gap-2 text-xs sm:text-sm">
                <button
                  type="button"
                  onClick={() => setDetailOrderId(null)}
                  className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Ventas
                </button>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Detalle de la venta</span>
              </nav>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(detailOrder)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  Imprimir datos (PDF)
                </button>
              </div>
            </div>

            {/* Título principal de la venta + folios copiables */}
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                {detailOrder.items[0]?.name || `Pedido #${detailOrder.id.substring(0, 8).toUpperCase()}`}
                {detailOrder.items.length > 1 && (
                  <span className="text-base font-medium text-muted-foreground ml-2">
                    +{detailOrder.items.length - 1} producto(s) más
                  </span>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => copyText(detailOrder.id.substring(0, 8).toUpperCase(), 'Folio')}
                  className="inline-flex items-center gap-1 font-mono hover:text-foreground"
                >
                  #{detailOrder.id.substring(0, 8).toUpperCase()}
                  <Copy className="h-3 w-3" />
                </button>
                {detailOrder.paymentReference && (
                  <>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => copyText(detailOrder.paymentReference!, 'Referencia')}
                      className="inline-flex items-center gap-1 font-mono hover:text-foreground"
                    >
                      Ref #{detailOrder.paymentReference}
                      <Copy className="h-3 w-3" />
                    </button>
                  </>
                )}
                <span>|</span>
                <span>{fmtDate(detailOrder.createdAt)}</span>
              </div>
            </div>

            {/* Layout de 2 columnas: Izquierda (Cliente, Productos/Envío, Factura) | Derecha (Información del cobro) */}
            <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
              <div className="space-y-4">
                {/* 1. Tarjeta del comprador */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary uppercase">
                      {(detailOrder.billingDetails?.razonSocial || detailOrder.shippingAddress?.contactEmail || 'C').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {detailOrder.billingDetails?.razonSocial || detailOrder.shippingAddress?.contactEmail || 'Cliente Borarly'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {detailOrder.shippingAddress?.contactEmail || detailOrder.userId}
                        {detailOrder.shippingAddress?.phone ? ` | Tel: ${detailOrder.shippingAddress.phone}` : ''}
                        {detailOrder.billingDetails?.rfc ? ` | RFC ${detailOrder.billingDetails.rfc}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {buildCustomerWhatsApp(detailOrder) && (
                      <a
                        href={buildCustomerWhatsApp(detailOrder)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Iniciar conversación
                      </a>
                    )}
                    {detailOrder.shippingAddress?.contactEmail && (
                      <a
                        href={`mailto:${detailOrder.shippingAddress.contactEmail}?subject=${encodeURIComponent(`Tu pedido #${detailOrder.id.substring(0, 8).toUpperCase()} en Borarly`)}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        title="Enviar correo"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* 2. Tarjeta de Estado, Productos y Datos del envío */}
                <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className={cn('text-base font-bold', STATUS_CONFIG[detailOrder.status].textColor)}>
                        {STATUS_CONFIG[detailOrder.status].headline}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {detailOrder.trackingNumber
                          ? `Paquetería: ${detailOrder.shippingProvider || 'Asignada'} · Guía: ${detailOrder.trackingNumber}`
                          : STATUS_CONFIG[detailOrder.status].subtitle}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Select
                        value={detailOrder.status}
                        onValueChange={(s: Order['status']) => handleStatusChange(detailOrder.id, s)}
                      >
                        <SelectTrigger className="h-9 w-[145px] text-xs font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_TRANSLATIONS).map(([k, v]) => (
                            <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        onClick={() => openTrackingModal(detailOrder)}
                        disabled={detailOrder.status === 'pending' || detailOrder.status === 'cancelled'}
                        className="h-9 bg-primary hover:bg-primary/90 text-xs font-semibold"
                      >
                        <Truck className="h-3.5 w-3.5 mr-1.5" />
                        {detailOrder.trackingNumber ? 'Editar guía' : 'Asignar guía'}
                      </Button>
                    </div>
                  </div>

                  {/* Lista de productos en recuadro gris suave estilo ML */}
                  <div className="space-y-2">
                    {detailOrder.items.map((item, idx) => {
                      const sku = item.sku || item.productId;
                      return (
                        <div
                          key={`${item.productId}_${idx}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border bg-white">
                              {item.imageUrl ? (
                                <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1" unoptimized />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground m-auto mt-2.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground line-clamp-1">{item.name}</p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span>SKU: {sku}</span>
                                <button
                                  type="button"
                                  onClick={() => copyText(sku, 'SKU')}
                                  className="hover:text-foreground"
                                  title="Copiar SKU"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6 text-xs sm:text-sm text-muted-foreground shrink-0 pl-14 sm:pl-0">
                            <span className="font-medium text-foreground">{fmt(item.price)}</span>
                            <span>{item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Datos del envío */}
                  <div className="border-t border-border pt-4 space-y-2 text-xs sm:text-sm">
                    <p className="font-bold text-foreground">Datos del envío</p>
                    {detailOrder.shippingAddress ? (
                      <div className="space-y-1 text-muted-foreground">
                        <p>Envío a domicilio</p>
                        <p>CP {detailOrder.shippingAddress.zip}</p>
                        <p>{detailOrder.shippingAddress.street}, {detailOrder.shippingAddress.city}, {detailOrder.shippingAddress.country}</p>
                        {detailOrder.shippingAddress.phone && <p>Tel. de contacto: {detailOrder.shippingAddress.phone}</p>}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Sin dirección registrada.</p>
                    )}

                    {(detailOrder.trackingNumber || detailOrder.trackingDocumentUrl || detailOrder.trackingUrl) && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 pt-2">
                        {detailOrder.trackingNumber && (
                          <button
                            type="button"
                            onClick={() => copyText(detailOrder.trackingNumber!, 'Número de guía')}
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            Guía: {detailOrder.trackingNumber}
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                        {detailOrder.trackingUrl && (
                          <a
                            href={detailOrder.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            Rastrear envío <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {detailOrder.trackingDocumentUrl && (
                          <a
                            href={detailOrder.trackingDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            Ver comprobante / guía adjunta <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Tarjeta de Datos para su factura (idéntica a Imagen 3) */}
                <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-foreground">Datos para su factura</h2>
                    <span className={cn(
                      'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                      detailOrder.requiresBilling
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {detailOrder.requiresBilling ? 'Solicitó factura CFDI 4.0' : 'No solicitó factura'}
                    </span>
                  </div>

                  {detailOrder.requiresBilling && detailOrder.billingDetails ? (
                    <div className="space-y-3 text-xs sm:text-sm">
                      <p className="font-semibold text-foreground">Datos del comprador</p>
                      <dl className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-y-2.5 gap-x-4">
                        <dt className="text-muted-foreground">Razón social</dt>
                        <dd className="font-medium text-foreground flex items-center gap-2">
                          <span>{detailOrder.billingDetails.razonSocial}</span>
                          <button type="button" onClick={() => copyText(detailOrder.billingDetails!.razonSocial, 'Razón social')} className="text-muted-foreground hover:text-foreground">
                            <Copy className="h-3 w-3" />
                          </button>
                        </dd>

                        <dt className="text-muted-foreground">RFC</dt>
                        <dd className="font-mono font-semibold text-foreground flex items-center gap-2">
                          <span>{detailOrder.billingDetails.rfc}</span>
                          <button type="button" onClick={() => copyText(detailOrder.billingDetails!.rfc, 'RFC')} className="text-muted-foreground hover:text-foreground">
                            <Copy className="h-3 w-3" />
                          </button>
                        </dd>

                        <dt className="text-muted-foreground">Código Postal fiscal</dt>
                        <dd className="font-medium text-foreground">CP: {detailOrder.billingDetails.zip || '—'}</dd>

                        <dt className="text-muted-foreground">Régimen fiscal</dt>
                        <dd className="font-medium text-foreground">{detailOrder.billingDetails.regimenFiscal || '—'}</dd>

                        <dt className="text-muted-foreground">Uso de CFDI</dt>
                        <dd className="font-medium text-foreground">{detailOrder.billingDetails.usoCFDI || '—'}</dd>

                        <dt className="text-muted-foreground">Correo de facturación</dt>
                        <dd className="font-medium text-foreground">{detailOrder.billingDetails.email || detailOrder.shippingAddress?.contactEmail || '—'}</dd>
                      </dl>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      El cliente no solicitó factura fiscal en este pedido (venta a público en general).
                    </p>
                  )}
                </div>
              </div>

              {/* Columna derecha: Información del cobro (idéntica a Imagen 3) */}
              <aside className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-foreground">Información del cobro</h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Ref #{detailOrder.paymentReference || detailOrder.id.substring(0, 8).toUpperCase()}</span>
                      <span>·</span>
                      <span>{fmtDate(detailOrder.createdAt)}</span>
                      <span className={cn('rounded px-2 py-0.5 text-[10px] font-bold uppercase border', STATUS_CONFIG[detailOrder.status].badgeBg)}>
                        {STATUS_TRANSLATIONS[detailOrder.status]}
                      </span>
                    </div>
                  </div>

                  {/* Caja destacada con barra lateral izquierda */}
                  <div className={cn(
                    'rounded-xl border border-border border-l-4 bg-muted/20 p-4 space-y-1',
                    STATUS_CONFIG[detailOrder.status].leftBorder
                  )}>
                    <p className="text-xs font-semibold text-foreground">Total del pedido</p>
                    <p className="text-2xl font-bold text-foreground tracking-tight">
                      {fmt(detailOrder.totalAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Método: <span className="font-medium text-foreground uppercase">{detailOrder.paymentDetails?.method || 'Transferencia / SPEI'}</span>
                    </p>
                  </div>

                  {/* Desglose financiero */}
                  {(() => {
                    const fin = getOrderFinancials(detailOrder);
                    return (
                      <div className="divide-y divide-border text-xs sm:text-sm">
                        <div className="py-3 space-y-2">
                          <div className="flex items-center justify-between font-semibold text-foreground">
                            <span>Subtotal (sin IVA)</span>
                            <span>{fmt(fin.subtotalSinIva)}</span>
                          </div>
                          {detailOrder.items.map((item, idx) => {
                            const unitSinIva = fin.itemsAreVatInclusive ? item.price / 1.16 : item.price;
                            return (
                              <div key={idx} className="flex items-start justify-between gap-3 text-xs text-muted-foreground">
                                <span className="line-clamp-1">{item.quantity}× {item.name}</span>
                                <span className="shrink-0">{fmt(unitSinIva * item.quantity)}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="py-3 flex items-center justify-between">
                          <span className="font-semibold text-foreground">IVA (16%)</span>
                          <span className="font-medium text-foreground">{fmt(fin.vatAmount)}</span>
                        </div>

                        <div className="py-3 flex items-center justify-between">
                          <span className="font-semibold text-foreground">Costo de envío</span>
                          <span className="font-medium text-foreground">
                            {fin.shippingCost > 0 ? fmt(fin.shippingCost) : 'Gratis'}
                          </span>
                        </div>

                        <div className="pt-3 flex items-center justify-between text-sm font-bold text-foreground">
                          <span>Total (MXN, IVA incl.)</span>
                          <span>{fmt(fin.totalAmount)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="border-t border-border pt-4 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(detailOrder)}
                      className="flex w-full items-center gap-2 text-xs font-semibold text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      Descargar comprobante de pedido (PDF)
                    </button>
                    <button
                      type="button"
                      disabled={isSendingEmail}
                      onClick={() => handleSendOrderEmail(detailOrder)}
                      className="flex w-full items-center gap-2 text-xs font-semibold text-primary hover:underline pt-1 disabled:opacity-50"
                    >
                      {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      Enviar aviso a ventas@borarly.com
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetOrder(detailOrder)}
                      className="flex w-full items-center gap-2 text-xs font-semibold text-red-600 hover:underline pt-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar este pedido
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════
             VISTA PRINCIPAL DE LISTADO DE VENTAS (inspirada en Imagen 1 y 2)
             ═══════════════════════════════════════════════════════════════════ */
          <>
            {/* Encabezado: Ventas + Actualizar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Ventas</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadOrders}
                  disabled={isLoading}
                  className="rounded-full bg-card text-xs font-semibold gap-1.5"
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Actualizar
                </Button>
              </div>
            </div>

            {/* Panel gris superior con pestañas + 4 tarjetas de resumen operativo */}
            <div className="rounded-2xl bg-muted/60 border border-border/70 p-4 space-y-4">
              {/* Pestañas estilo píldora segmentada */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex flex-wrap items-center gap-1 rounded-full bg-muted p-1 border border-border/60">
                  {([
                    { key: 'all', label: 'Todas', count: statusCounts.all || 0 },
                    { key: 'paid', label: 'Por enviar', count: statusCounts.paid || 0 },
                    { key: 'pending', label: 'Por confirmar pago', count: statusCounts.pending || 0 },
                    { key: 'shipped', label: 'En tránsito', count: statusCounts.shipped || 0 },
                    { key: 'delivered', label: 'Finalizadas', count: statusCounts.delivered || 0 },
                    { key: 'cancelled', label: 'Canceladas', count: statusCounts.cancelled || 0 },
                  ] as const).map(tab => {
                    const active = statusFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setStatusFilter(tab.key)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                          active
                            ? 'bg-card text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <span>{tab.label}</span>
                        {tab.count > 0 && (
                          <span className={cn(
                            'rounded-full px-1.5 py-0.2 text-[11px] font-bold',
                            active ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/15 text-muted-foreground'
                          )}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4 bloques de resumen rápido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => { setStatusFilter('paid'); setBillingOnly(false); }}
                  className={cn(
                    'rounded-xl bg-card p-4 text-left border transition-all hover:border-primary/50',
                    statusFilter === 'paid' && !billingOnly ? 'border-primary ring-1 ring-primary' : 'border-border/70'
                  )}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase text-muted-foreground">
                    <span>POR ENVIAR</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">{statusCounts.paid || 0}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-foreground">Pagadas listas para guía</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Listas para enviar</span>
                    <span className="font-bold text-foreground">{statusCounts.paid || 0}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setStatusFilter('pending'); setBillingOnly(false); }}
                  className={cn(
                    'rounded-xl bg-card p-4 text-left border transition-all hover:border-primary/50',
                    statusFilter === 'pending' && !billingOnly ? 'border-primary ring-1 ring-primary' : 'border-border/70'
                  )}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase text-muted-foreground">
                    <span>POR CONFIRMAR</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">{statusCounts.pending || 0}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-foreground">SPEI y depósito OXXO</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>En espera de pago</span>
                    <span className="font-bold text-foreground">{statusCounts.pending || 0}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setStatusFilter('shipped'); setBillingOnly(false); }}
                  className={cn(
                    'rounded-xl bg-card p-4 text-left border transition-all hover:border-primary/50',
                    statusFilter === 'shipped' && !billingOnly ? 'border-primary ring-1 ring-primary' : 'border-border/70'
                  )}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase text-muted-foreground">
                    <span>EN TRÁNSITO</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">{statusCounts.shipped || 0}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-foreground">Enviadas con paquetería</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>En camino al cliente</span>
                    <span className="font-bold text-foreground">{statusCounts.shipped || 0}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBillingOnly(v => !v)}
                  className={cn(
                    'rounded-xl bg-card p-4 text-left border transition-all hover:border-primary/50',
                    billingOnly ? 'border-primary ring-1 ring-primary' : 'border-border/70'
                  )}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase text-muted-foreground">
                    <span>FACTURACIÓN</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">{statusCounts.billing || 0}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-foreground">Solicitudes CFDI 4.0</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Requieren factura</span>
                    <span className="font-bold text-foreground">{statusCounts.billing || 0}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Barra de búsqueda, filtro de fecha y contador */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por folio, cliente, SKU, RFC..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="h-9 rounded-full bg-card pl-9 text-xs border-border"
                  />
                </div>

                <Select value={dateFilter} onValueChange={(v: DateRangeFilter) => setDateFilter(v)}>
                  <SelectTrigger className="h-9 w-[165px] rounded-full bg-card text-xs font-medium border-border">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Todas las fechas</SelectItem>
                    <SelectItem value="today" className="text-xs">Ventas de hoy</SelectItem>
                    <SelectItem value="7d" className="text-xs">Últimos 7 días</SelectItem>
                    <SelectItem value="30d" className="text-xs">Últimos 30 días</SelectItem>
                    <SelectItem value="60d" className="text-xs">Últimos 2 meses</SelectItem>
                  </SelectContent>
                </Select>

                {statusFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <span>{STATUS_CONFIG[statusFilter].tabLabel}</span>
                    <span className="text-muted-foreground">×</span>
                  </button>
                )}

                {billingOnly && (
                  <button
                    type="button"
                    onClick={() => setBillingOnly(false)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <span>Con factura CFDI</span>
                    <span className="text-muted-foreground">×</span>
                  </button>
                )}
              </div>

              <span className="text-xs font-medium text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? 'venta' : 'ventas'}
              </span>
            </div>

            {/* Barra de selección masiva y descarga de Excel */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-2xs">
              <label className="inline-flex cursor-pointer items-center gap-2.5 text-xs sm:text-sm text-muted-foreground select-none">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span>
                  {selectedIds.size > 0 ? `${selectedIds.size} seleccionada(s)` : 'Seleccionar ventas'}
                </span>
              </label>

              <button
                type="button"
                onClick={() => handleExportCsv(filtered)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline"
              >
                <Download className="h-4 w-4" />
                Descargar Excel de ventas
              </button>
            </div>

            {/* LISTADO DE TARJETAS DE VENTA */}
            {isLoading && !orders.length ? (
              <div className="flex justify-center items-center py-20 rounded-xl border border-border bg-card">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center rounded-xl border border-border bg-card">
                <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No se encontraron ventas con estos filtros.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filtered.map(order => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const folio = order.id.substring(0, 8).toUpperCase();
                  const waHref = buildCustomerWhatsApp(order);
                  const customerLabel =
                    order.billingDetails?.razonSocial ||
                    order.shippingAddress?.contactEmail ||
                    order.userId ||
                    'Cliente Borarly';

                  return (
                    <div
                      key={order.id}
                      className="rounded-xl border border-border bg-card shadow-2xs transition-colors hover:border-border/90"
                    >
                      {/* Cabecera de la tarjeta: Checkbox + Folio + Ref + Fecha + Cliente + Iniciar conversación */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-2.5 text-xs text-muted-foreground">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(order.id)}
                            onChange={() => toggleSelectOne(order.id)}
                            className="h-4 w-4 rounded border-border accent-primary"
                          />
                          <button
                            type="button"
                            onClick={() => copyText(folio, 'Folio')}
                            className="inline-flex items-center gap-1 font-mono font-semibold text-foreground hover:text-primary"
                            title="Copiar folio"
                          >
                            #{folio}
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          </button>

                          {order.paymentReference && (
                            <>
                              <span>|</span>
                              <button
                                type="button"
                                onClick={() => copyText(order.paymentReference!, 'Referencia')}
                                className="inline-flex items-center gap-1 font-mono hover:text-foreground"
                                title="Copiar referencia de pago"
                              >
                                #{order.paymentReference}
                                <Copy className="h-3 w-3" />
                              </button>
                            </>
                          )}

                          <span>|</span>
                          <span>{fmtDate(order.createdAt)}</span>

                          {order.requiresBilling && (
                            <>
                              <span>|</span>
                              <span className="inline-flex items-center gap-1 font-semibold text-primary">
                                <Receipt className="h-3 w-3" /> Requiere factura
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-medium text-foreground truncate max-w-[200px]">
                            {customerLabel}
                          </span>
                          {waHref && (
                            <a
                              href={waHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Iniciar conversación
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Cuerpo de la tarjeta */}
                      <div className="p-4 sm:p-5 space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Estado y resumen logístico */}
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <p className={cn('text-sm sm:text-base font-bold', cfg.textColor)}>
                                {cfg.headline}
                              </p>
                              <span className="text-xs font-bold text-foreground bg-muted px-2.5 py-0.5 rounded-full">
                                Total: {fmt(order.totalAmount)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {order.trackingNumber
                                ? `Guía ${order.shippingProvider ? `(${order.shippingProvider})` : ''}: ${order.trackingNumber} · Destino: ${order.shippingAddress?.city || '—'}, CP ${order.shippingAddress?.zip || '—'}`
                                : order.shippingAddress?.street
                                  ? `Destino: ${order.shippingAddress.street}, ${order.shippingAddress.city}, CP ${order.shippingAddress.zip}`
                                  : cfg.subtitle}
                            </p>
                          </div>

                          {/* Controles a la derecha: selector de estado + botón azul + PDF + menú 3 puntos (Ver detalle) */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <Select
                              value={order.status}
                              onValueChange={(s: Order['status']) => handleStatusChange(order.id, s)}
                            >
                              <SelectTrigger className="h-9 w-[138px] text-xs font-semibold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_TRANSLATIONS).map(([k, v]) => (
                                  <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {(order.status === 'paid' || order.status === 'shipped') ? (
                              <Button
                                size="sm"
                                onClick={() => openTrackingModal(order)}
                                className="h-9 rounded-lg bg-primary hover:bg-primary/90 px-4 text-xs font-semibold"
                              >
                                {order.trackingNumber ? 'Editar guía' : 'Asignar guía'}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => setDetailOrderId(order.id)}
                                className="h-9 rounded-lg bg-primary hover:bg-primary/90 px-4 text-xs font-semibold"
                              >
                                Ver detalle
                              </Button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(order)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                              title="Imprimir / Descargar PDF"
                            >
                              <FileText className="h-4 w-4" />
                            </button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                  title="Más opciones"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setDetailOrderId(order.id)} className="cursor-pointer font-medium">
                                  Ver detalle
                                </DropdownMenuItem>
                                {(order.status === 'paid' || order.status === 'shipped') && (
                                  <DropdownMenuItem onClick={() => openTrackingModal(order)} className="cursor-pointer">
                                    {order.trackingNumber ? 'Editar guía de rastreo' : 'Asignar guía de rastreo'}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleDownloadPdf(order)} className="cursor-pointer">
                                  Descargar PDF del pedido
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteTargetOrder(order)}
                                  className="cursor-pointer text-red-600 focus:text-red-600"
                                >
                                  Eliminar venta
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Filas de productos en recuadro gris claro (idéntico al diseño de referencia) */}
                        <div className="space-y-2">
                          {order.items.map((item, idx) => {
                            const sku = item.sku || item.productId;
                            return (
                              <div
                                key={`${item.productId}_${idx}`}
                                onClick={() => setDetailOrderId(order.id)}
                                className="cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors px-4 py-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-white">
                                    {item.imageUrl ? (
                                      <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1" unoptimized />
                                    ) : (
                                      <Package className="h-4 w-4 text-muted-foreground m-auto mt-2.5" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-1">{item.name}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                      Subtotal línea: {fmt(item.price * item.quantity)}
                                    </p>
                                  </div>
                                </div>

                                <div
                                  className="flex flex-wrap items-center gap-4 sm:gap-8 text-xs text-muted-foreground shrink-0 pl-13 sm:pl-0"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <span className="font-medium text-foreground">{fmt(item.price)}</span>
                                  <span>{item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}</span>
                                  <button
                                    type="button"
                                    onClick={() => copyText(sku, 'SKU')}
                                    className="inline-flex items-center gap-1 hover:text-foreground"
                                    title="Copiar SKU"
                                  >
                                    <span>SKU: {sku}</span>
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* DIÁLOGO GLOBAL PARA ASIGNAR / EDITAR GUÍA DE RASTREO */}
      <Dialog open={!!trackingOrder} onOpenChange={open => !open && setTrackingOrder(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="font-bold">Asignar Guía de Rastreo</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Pedido #{trackingOrder?.id.substring(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label>Paquetería / Transportista</Label>
              <Input
                placeholder="Ej: Estafeta, DHL, Paquetexpress, FedEx..."
                value={trackingData.provider}
                onChange={e => setTrackingData({ ...trackingData, provider: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Número de Guía (Texto)</Label>
              <Input
                placeholder="Escribe el código de rastreo"
                value={trackingData.number}
                onChange={e => setTrackingData({ ...trackingData, number: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Comprobante Físico / Guía en PDF o Imagen (Opcional)</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors">
                <input
                  type="file"
                  id="tracking-file-upload"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) setTrackingFile(e.target.files[0]);
                  }}
                />
                <label htmlFor="tracking-file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {trackingFile ? trackingFile.name : 'Subir archivo o imagen PDF'}
                  </span>
                  {trackingOrder?.trackingDocumentUrl && !trackingFile && (
                    <span className="text-xs text-emerald-600 block">Ya existe un archivo guardado</span>
                  )}
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Link de Rastreo (Opcional)</Label>
              <Input
                type="url"
                placeholder="https://..."
                value={trackingData.url}
                onChange={e => setTrackingData({ ...trackingData, url: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">
                El cliente podrá hacer clic en este enlace para rastrear su paquete en el sitio de la paquetería.
              </p>
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
      </Dialog>

      {/* DIÁLOGO GLOBAL DE CONFIRMACIÓN PARA ELIMINAR VENTA */}
      <AlertDialog open={!!deleteTargetOrder} onOpenChange={open => !open && setDeleteTargetOrder(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. Se eliminará el pedido #{deleteTargetOrder?.id.substring(0, 8).toUpperCase()} permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetOrder && handleDelete(deleteTargetOrder.id)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
