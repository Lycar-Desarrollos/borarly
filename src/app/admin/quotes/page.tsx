
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Edit, Trash2, FileDown, DollarSign, AlertCircle, Users, Clock, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import type { Quote, QuoteStatus } from '@/lib/types';
import { getQuotes, deleteQuote, updateQuote, getQuoteById, getQuoteLogoUrl } from '@/services/quoteService';
import { createOrderFromQuote } from '@/services/orderService';
import { getBankDetails, type BankDetails } from '@/services/settingsService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// ─── Helpers ───────────────────────────────────────────────────────────────

function getImageBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }
      try {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('es-MX');

/** Días de retraso respecto a expiresAt (positivo = vencido) */
function getDaysOverdue(expiresAt: string): number {
  const due = new Date(expiresAt);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - due.getTime()) / 86400000);
}

/** Clasifica deuda en buckets de aging */
function agingBucket(days: number): string {
  if (days <= 0) return 'Al corriente';
  if (days <= 30) return '1 a 30 días';
  if (days <= 60) return '31 a 60 días';
  if (days <= 90) return '61 a 90 días';
  return 'Más de 90 días';
}

const AGING_ORDER = ['Al corriente', '1 a 30 días', '31 a 60 días', '61 a 90 días', 'Más de 90 días'];
const AGING_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#7f1d1d'];

const statusTranslations: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  expired: 'Vencida',
  cancelled: 'Cancelada',
};

// ─── Componente principal ───────────────────────────────────────────────────

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<string | null>(null);
  const [showResumen, setShowResumen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    companyName: 'BORARLY',
    email: 'ventas@borarly.com',
    phone: '+52 1 999 904 0931',
    beneficiary: 'BORARLY',
    clabe: '012 180 01576278534 6',
    bank: 'BBVA',
  });

  // Filtros de cobranza
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('all');
  const [filtroFolio, setFiltroFolio] = useState('');

  const { toast } = useToast();
  const router = useRouter();

  // ── Carga de datos ───────────────────────────────────────────────────────
  const fetchQuotesData = async () => {
    setIsLoading(true);
    try {
      const data = await getQuotes();
      setQuotes(data);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las cotizaciones.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotesData();
    getBankDetails().then(setBankDetails);
  }, []);

  // ── Cotizaciones de crédito (aceptadas = cuentas por cobrar) ─────────────
  const cuentasPorCobrar = useMemo(() =>
    quotes.filter(q => q.status === 'accepted'),
    [quotes]
  );

  // ── Filtrado ─────────────────────────────────────────────────────────────
  const cuentasFiltradas = useMemo(() => {
    return cuentasPorCobrar.filter(q => {
      if (filtroCliente && !q.customerName.toLowerCase().includes(filtroCliente.toLowerCase())) return false;
      if (filtroFolio && !q.quoteNumber.toLowerCase().includes(filtroFolio.toLowerCase())) return false;
      if (filtroFechaDesde && new Date(q.createdAt) < new Date(filtroFechaDesde)) return false;
      if (filtroFechaHasta && new Date(q.createdAt) > new Date(filtroFechaHasta)) return false;
      if (filtroEstado !== 'all') {
        const days = getDaysOverdue(q.expiresAt);
        const bucket = agingBucket(days);
        if (filtroEstado === 'vigente' && days > 0) return false;
        if (filtroEstado === 'vencido' && days <= 0) return false;
        if (filtroEstado === '1-30' && bucket !== '1 a 30 días') return false;
        if (filtroEstado === '31-60' && bucket !== '31 a 60 días') return false;
        if (filtroEstado === '61-90' && bucket !== '61 a 90 días') return false;
        if (filtroEstado === '+90' && bucket !== 'Más de 90 días') return false;
      }
      return true;
    });
  }, [cuentasPorCobrar, filtroCliente, filtroFolio, filtroFechaDesde, filtroFechaHasta, filtroEstado]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = cuentasFiltradas.reduce((s, q) => s + q.totalAmount, 0);
    const vencidas = cuentasFiltradas.filter(q => getDaysOverdue(q.expiresAt) > 0);
    const montoVencido = vencidas.reduce((s, q) => s + q.totalAmount, 0);
    const clientesUnicos = new Set(vencidas.map(q => q.customerEmail)).size;
    const diasPromedio = vencidas.length > 0
      ? Math.round(vencidas.reduce((s, q) => s + getDaysOverdue(q.expiresAt), 0) / vencidas.length)
      : 0;
    return { total, montoVencido, clientesUnicos, diasPromedio };
  }, [cuentasFiltradas]);

  // ── Aging ────────────────────────────────────────────────────────────────
  const agingData = useMemo(() => {
    const buckets: Record<string, number> = {};
    AGING_ORDER.forEach(b => (buckets[b] = 0));
    cuentasFiltradas.forEach(q => {
      const days = getDaysOverdue(q.expiresAt);
      buckets[agingBucket(days)] += q.totalAmount;
    });
    const maxVal = Math.max(...Object.values(buckets), 1);
    return AGING_ORDER.map((label, i) => ({
      label,
      value: buckets[label],
      pct: Math.round((buckets[label] / kpis.total) * 100) || 0,
      barWidth: Math.round((buckets[label] / maxVal) * 100),
      color: AGING_COLORS[i],
    }));
  }, [cuentasFiltradas, kpis.total]);

  // ── Acciones ─────────────────────────────────────────────────────────────
  const handleDelete = async (quoteId: string, quoteNumber: string) => {
    try {
      await deleteQuote(quoteId);
      setQuotes(prev => prev.filter(q => q.id !== quoteId));
      toast({ title: 'Cotización Eliminada', description: `La cotización ${quoteNumber} ha sido eliminada.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la cotización.' });
    }
  };

  const handleStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
    try {
      await updateQuote(quoteId, { status: newStatus });
      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
      toast({ title: 'Estado Actualizado', description: `Estado cambiado a "${statusTranslations[newStatus]}".` });
      if (newStatus === 'accepted') {
        const fullQuote = await getQuoteById(quoteId);
        if (fullQuote) {
          toast({ title: 'Convirtiendo a Pedido...', description: 'Por favor, espera.' });
          const newOrder = await createOrderFromQuote(fullQuote);
          toast({
            title: 'Pedido Creado',
            description: `Pedido #${newOrder.id.substring(0, 6)} creado.`,
            action: <Button variant="outline" size="sm" onClick={() => router.push('/admin/orders')}>Ver Pedidos</Button>
          });
        }
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo actualizar.' });
      fetchQuotesData();
    }
  };

  // ── PDF de cotización individual ─────────────────────────────────────────
  const handleDownloadPdf = async (quote: Quote) => {
    if (!quote) return;
    setIsDownloadingPdf(quote.id);
    toast({ title: "Generando PDF...", description: "Por favor, espera." });
    const doc = new jsPDF();
    let logoBase64: string | null = null;
    const logoUrlToUse = await getQuoteLogoUrl();
    if (logoUrlToUse) logoBase64 = await getImageBase64(logoUrlToUse);

    if (logoBase64) {
      try { doc.addImage(logoBase64, 'PNG', 14, 12, 30, 15); } catch { /* sin logo */ }
    } else {
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text(bankDetails.companyName, 14, 20);
    }

    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text("COTIZACIÓN", 200, 20, { align: 'right' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Número: ${quote.quoteNumber}`, 200, 26, { align: 'right' });
    doc.text(`Fecha: ${format(new Date(quote.createdAt), "dd/MM/yyyy")}`, 200, 31, { align: 'right' });
    doc.text(`Vence: ${format(new Date(quote.expiresAt), "dd/MM/yyyy")}`, 200, 36, { align: 'right' });
    doc.setLineWidth(0.5); doc.line(14, 45, 200, 45);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.text("De parte de:", 14, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(bankDetails.companyName, 14, 58);
    doc.text(bankDetails.email, 14, 64);
    doc.text(bankDetails.phone, 14, 70);
    doc.setFont('helvetica', 'bold'); doc.text("Dirigido a:", 130, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.customerName, 130, 58);
    doc.text(quote.customerEmail, 130, 64);

    const tableColumn = ["#", "Producto", "Cant.", "Precio Unit.", "Total"];
    const tableRows = quote.items.map((item, i) => [
      i + 1,
      item.name + `\nModelo: ${item.sku || item.productId}`,
      item.quantity,
      formatCurrency(item.price),
      formatCurrency(item.price * item.quantity)
    ]);
    (doc as any).autoTable({
      startY: 80, head: [tableColumn], body: tableRows, theme: 'striped',
      headStyles: { fillColor: [103, 58, 183] },
      styles: { halign: 'center' },
      columnStyles: { 1: { halign: 'left', cellWidth: 80 }, 3: { halign: 'right' }, 4: { halign: 'right' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 140;
    let notesY = finalY + 10;
    const totalsX = 140; let totalsY = finalY + 10;
    doc.setFontSize(12);
    doc.text("Subtotal:", totalsX, totalsY, { align: 'right' });
    doc.text(formatCurrency(quote.subtotal), 200, totalsY, { align: 'right' });
    if (quote.shippingCost > 0) {
      totalsY += 7;
      doc.text("Envío:", totalsX, totalsY, { align: 'right' });
      doc.text(formatCurrency(quote.shippingCost), 200, totalsY, { align: 'right' });
    }
    totalsY += 7;
    doc.text("IVA (16%):", totalsX, totalsY, { align: 'right' });
    doc.text(formatCurrency(quote.vatAmount), 200, totalsY, { align: 'right' });
    totalsY += 7; doc.setFont('helvetica', 'bold');
    doc.text("Total (MXN):", totalsX, totalsY, { align: 'right' });
    doc.text(formatCurrency(quote.totalAmount), 200, totalsY, { align: 'right' });
    if (quote.notes) {
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text("Notas y Términos:", 14, notesY);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(quote.notes, 80);
      doc.text(splitNotes, 14, notesY + 6);
      notesY += (splitNotes.length * 5) + 5;
    }
    if (quote.showBankDetails !== false) {
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text("Datos de Pago:", 14, notesY);
      doc.setFont('helvetica', 'normal');
      doc.text(`Beneficiario: ${bankDetails.beneficiary}`, 14, notesY + 6);
      doc.text(`Cuenta CLABE: ${bankDetails.clabe}`, 14, notesY + 12);
      doc.text(`Banco: ${bankDetails.bank}`, 14, notesY + 18);
    }
    doc.setFontSize(9); doc.setTextColor(150);
    doc.text("Gracias por su preferencia.", 105, 285, { align: 'center' });
    doc.save(`Cotizacion_${quote.quoteNumber}_${quote.customerName.replace(/ /g, '_')}.pdf`);
    toast({ title: "PDF Descargado", description: `Cotización ${quote.quoteNumber} descargada.` });
    setIsDownloadingPdf(null);
  };

  // ── Exportar Reporte PDF (cuentas filtradas) ─────────────────────────────
  const handleExportReportePdf = async () => {
    if (cuentasFiltradas.length === 0) {
      toast({ variant: 'destructive', title: 'Sin datos', description: 'No hay cuentas por cobrar con los filtros actuales.' });
      return;
    }
    setIsExportingPdf(true);
    toast({ title: 'Generando reporte PDF...', description: 'Por favor espera.' });
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('Reporte de Cobranza & Cuentas por Cobrar', 14, 16);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 23);
      doc.text(`Total por cobrar: ${formatCurrency(kpis.total)}   Vencido: ${formatCurrency(kpis.montoVencido)}`, 14, 29);

      const head = [['Folio', 'Cliente', 'Email', 'Fecha', 'Vence', 'Días retraso', 'Total']];
      const body = cuentasFiltradas.map(q => {
        const days = getDaysOverdue(q.expiresAt);
        return [
          q.quoteNumber,
          q.customerName,
          q.customerEmail,
          formatDate(q.createdAt),
          formatDate(q.expiresAt),
          days > 0 ? `+${days}` : 'Al corriente',
          formatCurrency(q.totalAmount),
        ];
      });
      (doc as any).autoTable({
        startY: 35, head, body, theme: 'striped',
        headStyles: { fillColor: [103, 58, 183] },
        styles: { fontSize: 9 },
      });
      doc.save(`Cobranza_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast({ title: 'Reporte PDF descargado.' });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // ── Exportar Excel (CSV) ─────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (cuentasFiltradas.length === 0) {
      toast({ variant: 'destructive', title: 'Sin datos', description: 'No hay cuentas por cobrar con los filtros actuales.' });
      return;
    }
    setIsExportingExcel(true);
    try {
      const headers = ['Folio', 'Cliente', 'Email', 'Fecha Emisión', 'Fecha Vence', 'Días Retraso', 'Subtotal', 'IVA', 'Envío', 'Total'];
      const rows = cuentasFiltradas.map(q => {
        const days = getDaysOverdue(q.expiresAt);
        return [
          q.quoteNumber,
          q.customerName,
          q.customerEmail,
          formatDate(q.createdAt),
          formatDate(q.expiresAt),
          days > 0 ? days : 0,
          q.subtotal.toFixed(2),
          q.vatAmount.toFixed(2),
          q.shippingCost.toFixed(2),
          q.totalAmount.toFixed(2),
        ].join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Cobranza_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast({ title: 'Excel descargado.' });
    } finally {
      setIsExportingExcel(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cobranza & Cotizaciones</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona cotizaciones y monitorea cuentas por cobrar.</p>
        </div>
        <Link href="/admin/quotes/new" passHref legacyBehavior>
          <Button><PlusCircle className="mr-2 h-5 w-5" /> Nueva Cotización</Button>
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PANEL DE COBRANZA (solo cotizaciones aceptadas = cuentas por cobrar)
      ════════════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cobranza & Cuentas por Cobrar</CardTitle>
              <CardDescription>Monitoreo de plazos de pago y estados de cartera.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowResumen(v => !v)}>
                {showResumen ? <><ChevronUp className="h-4 w-4 mr-1" />Ocultar Resumen</> : <><ChevronDown className="h-4 w-4 mr-1" />Mostrar Resumen</>}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportReportePdf} disabled={isExportingPdf}>
                {isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                Exportar PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExportingExcel}>
                {isExportingExcel ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* KPIs + Gráficas — solo si showResumen */}
        {showResumen && (
          <CardContent className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total por Cobrar</span>
                    <DollarSign className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(kpis.total)}</p>
                  <p className="text-xs text-muted-foreground">{cuentasFiltradas.length} cotizaciones aceptadas</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Monto Vencido</span>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(kpis.montoVencido)}</p>
                  <p className="text-xs text-muted-foreground">{cuentasFiltradas.filter(q => getDaysOverdue(q.expiresAt) > 0).length} deudas vencidas</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Clientes en Mora</span>
                    <Users className="h-4 w-4 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{kpis.clientesUnicos}</p>
                  <p className="text-xs text-muted-foreground">Clientes con cartera vencida</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Retraso Promedio</span>
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{kpis.diasPromedio} días</p>
                  <p className="text-xs text-muted-foreground">Días de retraso promedio</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfica Aging */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Antigüedad de Saldos (Aging)</p>
              <div className="space-y-3">
                {agingData.map(({ label, value, pct, barWidth, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-sm w-28 shrink-0">{label}</span>
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-sm font-medium w-32 text-right shrink-0">
                      {formatCurrency(value)} <span className="text-muted-foreground">({pct}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}

        {/* ── Filtros ── */}
        <CardContent className={showResumen ? 'border-t pt-4' : 'pt-0'}>
          <p className="text-sm font-semibold mb-3">Detalle de Cuentas por Cobrar</p>
          <p className="text-xs text-muted-foreground mb-4">Busca, filtra y concilia cotizaciones aceptadas con crédito pendiente.</p>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Desde</label>
              <Input type="date" className="h-8 text-xs w-36" value={filtroFechaDesde} onChange={e => setFiltroFechaDesde(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Hasta</label>
              <Input type="date" className="h-8 text-xs w-36" value={filtroFechaHasta} onChange={e => setFiltroFechaHasta(e.target.value)} />
            </div>
            <Input
              placeholder="Cliente..."
              className="h-8 text-xs w-36"
              value={filtroCliente}
              onChange={e => setFiltroCliente(e.target.value)}
            />
            <Input
              placeholder="Folio..."
              className="h-8 text-xs w-28"
              value={filtroFolio}
              onChange={e => setFiltroFolio(e.target.value)}
            />
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue placeholder="Estado de cobro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas (Historial)</SelectItem>
                <SelectItem value="vigente">Al corriente</SelectItem>
                <SelectItem value="vencido">Vencidas</SelectItem>
                <SelectItem value="1-30">1 a 30 días</SelectItem>
                <SelectItem value="31-60">31 a 60 días</SelectItem>
                <SelectItem value="61-90">61 a 90 días</SelectItem>
                <SelectItem value="+90">Más de 90 días</SelectItem>
              </SelectContent>
            </Select>
            {(filtroCliente || filtroFolio || filtroFechaDesde || filtroFechaHasta || filtroEstado !== 'all') && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => {
                setFiltroCliente(''); setFiltroFolio(''); setFiltroFechaDesde(''); setFiltroFechaHasta(''); setFiltroEstado('all');
              }}>Limpiar filtros</Button>
            )}
          </div>

          {/* Tabla de cuentas por cobrar */}
          {cuentasPorCobrar.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No hay cotizaciones aceptadas aún. Las cotizaciones marcadas como "Aceptada" aparecerán aquí.</p>
          ) : cuentasFiltradas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Ninguna cuenta coincide con los filtros aplicados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead>Días</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuentasFiltradas.map(q => {
                  const daysOverdue = getDaysOverdue(q.expiresAt);
                  const isOverdue = daysOverdue > 0;
                  return (
                    <TableRow key={q.id} className={isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                      <TableCell className="font-medium text-primary">{q.quoteNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium">{q.customerName}</div>
                        <div className="text-xs text-muted-foreground">{q.customerEmail}</div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(q.createdAt)}</TableCell>
                      <TableCell className="text-sm">{formatDate(q.expiresAt)}</TableCell>
                      <TableCell>
                        {isOverdue
                          ? <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">+{daysOverdue}d</span>
                          : <span className="text-xs font-medium text-green-700 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">Al corriente</span>
                        }
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(q.totalAmount)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline" size="icon" title="Descargar PDF"
                          onClick={() => handleDownloadPdf(q)}
                          disabled={isDownloadingPdf === q.id}
                        >
                          {isDownloadingPdf === q.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════
          TABLA GENERAL DE TODAS LAS COTIZACIONES
      ════════════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Todas las Cotizaciones</CardTitle>
              <CardDescription>Ver, editar y gestionar todas las cotizaciones de clientes.</CardDescription>
            </div>
            <Link href="/admin/quotes/new" passHref legacyBehavior>
              <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Nueva</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cotización #</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead>Vence el</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.length > 0 ? quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium text-primary">{quote.quoteNumber}</TableCell>
                    <TableCell>
                      <div>{quote.customerName}</div>
                      <div className="text-xs text-muted-foreground">{quote.customerEmail}</div>
                    </TableCell>
                    <TableCell>{formatDate(quote.createdAt)}</TableCell>
                    <TableCell>{formatDate(quote.expiresAt)}</TableCell>
                    <TableCell>{formatCurrency(quote.totalAmount)}</TableCell>
                    <TableCell>
                      <Select
                        value={quote.status}
                        onValueChange={(s: QuoteStatus) => handleStatusChange(quote.id, s)}
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusTranslations).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="icon" title="PDF" onClick={() => handleDownloadPdf(quote)} disabled={isDownloadingPdf === quote.id}>
                          {isDownloadingPdf === quote.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                        </Button>
                        <Link href={`/admin/quotes/edit/${quote.id}`} legacyBehavior passHref>
                          <Button variant="outline" size="icon" title="Editar"><Edit className="h-4 w-4" /></Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" title="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esto eliminará permanentemente la cotización <strong>{quote.quoteNumber}</strong>. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(quote.id, quote.quoteNumber)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">No se encontraron cotizaciones. ¡Crea una para empezar!</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
