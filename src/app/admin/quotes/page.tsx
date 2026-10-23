"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Edit, Trash2, FileDown, Search, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
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
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

function getImageBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      try {
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = url;
  });
}

const statusTranslations: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  expired: 'Vencida',
  cancelled: 'Cancelada',
};

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QuoteStatus>('all');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    companyName: 'BORARLY',
    email: 'ventas@borarly.com',
    phone: '+52 1 999 904 0931',
    beneficiary: 'BORARLY',
    clabe: '012 180 01576278534 6',
    bank: 'BBVA',
  });
  const { toast } = useToast();
  const router = useRouter();

  const fetchQuotesData = async () => {
    setIsLoading(true);
    try {
      const quotesData = await getQuotes();
      setQuotes(quotesData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las cotizaciones.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotesData();
    getBankDetails().then(setBankDetails);
  }, []);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase();
        const matchNum = q.quoteNumber?.toLowerCase().includes(term);
        const matchName = q.customerName?.toLowerCase().includes(term);
        const matchEmail = q.customerEmail?.toLowerCase().includes(term);
        return matchNum || matchName || matchEmail;
      }
      return true;
    });
  }, [quotes, statusFilter, searchQuery]);

  const handleDelete = async (quoteId: string, quoteNumber: string) => {
    try {
      await deleteQuote(quoteId);
      setQuotes(prev => prev.filter(q => q.id !== quoteId));
      toast({ title: 'Cotización Eliminada', description: `La cotización ${quoteNumber} ha sido eliminada.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la cotización.' });
    }
  };

  const handleStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
    try {
      await updateQuote(quoteId, { status: newStatus });

      setQuotes(prevQuotes => prevQuotes.map(q =>
        q.id === quoteId ? { ...q, status: newStatus } : q
      ));

      toast({ title: 'Estado Actualizado', description: `El estado de la cotización ha cambiado a "${statusTranslations[newStatus]}".` });

      if (newStatus === 'accepted') {
        const fullQuote = await getQuoteById(quoteId);
        if (fullQuote) {
          toast({ title: 'Convirtiendo a Pedido...', description: 'Por favor, espera.' });
          const newOrder = await createOrderFromQuote(fullQuote);
          toast({
            title: 'Pedido Creado Exitosamente',
            description: `Se ha creado el pedido #${newOrder.id.substring(0, 6).toUpperCase()}`,
            action: <Button variant="outline" size="sm" onClick={() => router.push('/admin/orders')}>Ver Ventas</Button>
          });
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'No se encontró la cotización para crear el pedido.' });
        }
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al actualizar', description: error.message || 'No se pudo actualizar el estado o crear el pedido.' });
      fetchQuotesData();
    }
  };

  const handleDownloadPdf = async (quote: Quote) => {
    if (!quote) return;
    setIsDownloadingPdf(quote.id);
    toast({ title: "Generando PDF...", description: "Por favor, espera un momento." });

    const doc = new jsPDF();

    let logoBase64: string | null = null;
    const logoUrlToUse = await getQuoteLogoUrl();

    if (logoUrlToUse) {
      logoBase64 = await getImageBase64(logoUrlToUse);
    }
    if (!logoBase64) {
      logoBase64 = await getImageBase64('/logo.png');
    }

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 14, 12, 48, 12);
      } catch {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(bankDetails.companyName, 14, 20);
      }
    } else {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(bankDetails.companyName, 14, 20);
    }

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("COTIZACIÓN", 200, 20, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Número: ${quote.quoteNumber}`, 200, 26, { align: 'right' });
    doc.text(`Fecha: ${format(new Date(quote.createdAt), "dd/MM/yyyy")}`, 200, 31, { align: 'right' });
    doc.text(`Vence: ${format(new Date(quote.expiresAt), "dd/MM/yyyy")}`, 200, 36, { align: 'right' });

    doc.setLineWidth(0.5);
    doc.line(14, 45, 200, 45);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("De parte de:", 14, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(bankDetails.companyName, 14, 58);
    doc.text(bankDetails.email, 14, 64);
    doc.text(quote.companyPhone || bankDetails.phone, 14, 70);

    doc.setFont('helvetica', 'bold');
    doc.text("Dirigido a:", 130, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.customerName, 130, 58);
    doc.text(quote.customerEmail, 130, 64);

    const tableColumn = ["#", "Producto", "Cant.", "Precio Unit.", "Total"];
    const tableRows = quote.items.map((item, index) => [
      index + 1,
      item.name + `\nModelo: ${item.sku || item.productId}`,
      item.quantity,
      formatCurrency(item.price),
      formatCurrency(item.price * item.quantity)
    ]);

    (doc as any).autoTable({
      startY: 80,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [2, 86, 185] },
      styles: { halign: 'center' },
      columnStyles: {
        1: { halign: 'left', cellWidth: 80 },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 140;
    let notesStartY = finalY + 10;

    const totalsX = 140;
    let totalsY = finalY + 10;
    doc.setFontSize(12);
    doc.text("Subtotal:", totalsX, totalsY, { align: 'right' });
    doc.text(formatCurrency(quote.subtotal), 200, totalsY, { align: 'right' });

    const discVal = quote.discountValue || 0;
    if (discVal > 0) {
      const discAmt = quote.discountType === 'percentage'
        ? Math.min(quote.subtotal, quote.subtotal * (discVal / 100))
        : Math.min(quote.subtotal, discVal);
      totalsY += 7;
      doc.setTextColor(220, 53, 69);
      doc.text(`Descuento (${quote.discountType === 'percentage' ? `${discVal}%` : 'Fijo'}):`, totalsX, totalsY, { align: 'right' });
      doc.text(`-${formatCurrency(discAmt)}`, 200, totalsY, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    }

    if (quote.shippingCost > 0) {
      totalsY += 7;
      doc.text("Envío:", totalsX, totalsY, { align: 'right' });
      doc.text(formatCurrency(quote.shippingCost), 200, totalsY, { align: 'right' });
    }

    if (quote.vatAmount > 0) {
      totalsY += 7;
      doc.text("IVA:", totalsX, totalsY, { align: 'right' });
      doc.text(formatCurrency(quote.vatAmount), 200, totalsY, { align: 'right' });
    }

    totalsY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text("Total (MXN):", totalsX, totalsY, { align: 'right' });
    doc.text(formatCurrency(quote.totalAmount), 200, totalsY, { align: 'right' });

    if (quote.notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("Notas y Términos:", 14, notesStartY);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(quote.notes, 80);
      doc.text(splitNotes, 14, notesStartY + 6);
      notesStartY += (splitNotes.length * 5) + 5;
    }

    if (quote.showBankDetails !== false) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("Datos de Pago:", 14, notesStartY);
      doc.setFont('helvetica', 'normal');
      doc.text(`Beneficiario: ${bankDetails.beneficiary}`, 14, notesStartY + 6);
      doc.text(`Cuenta CLABE: ${bankDetails.clabe}`, 14, notesStartY + 12);
      doc.text(`Banco: ${bankDetails.bank}`, 14, notesStartY + 18);
    }

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Gracias por su preferencia.", 105, 285, { align: 'center' });

    doc.save(`Cotizacion_${quote.quoteNumber}_${quote.customerName.replace(/ /g, '_')}.pdf`);
    toast({ title: "PDF Descargado", description: `La cotización ${quote.quoteNumber} ha sido descargada.` });
    setIsDownloadingPdf(null);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-MX');
    } catch {
      return '—';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestionar Cotizaciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Crea cotizaciones formales en PDF y conviértelas en pedidos con un clic.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchQuotesData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button asChild>
            <Link href="/admin/quotes/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Cotización
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Cotizaciones ({filteredQuotes.length})</CardTitle>
              <CardDescription>Filtra por cliente, folio o estado de cotización.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar folio, cliente o email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.entries(statusTranslations).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio #</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Creación</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.length > 0 ? filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono font-bold text-primary">
                      <Link href={`/admin/quotes/edit/${quote.id}`} className="hover:underline">
                        {quote.quoteNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{quote.customerName}</div>
                      <div className="text-xs text-muted-foreground">{quote.customerEmail}</div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(quote.createdAt)}</TableCell>
                    <TableCell className="text-sm">{formatDate(quote.expiresAt)}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(quote.totalAmount)}</TableCell>
                    <TableCell>
                      <Select
                        value={quote.status}
                        onValueChange={(newStatus: QuoteStatus) => handleStatusChange(quote.id, newStatus)}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs capitalize">
                          <SelectValue placeholder="Cambiar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusTranslations).map(([statusKey, statusValue]) => (
                            <SelectItem key={statusKey} value={statusKey} className="capitalize">{statusValue}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1.5 justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          title="Descargar PDF"
                          onClick={() => handleDownloadPdf(quote)}
                          disabled={isDownloadingPdf === quote.id}
                        >
                          {isDownloadingPdf === quote.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <FileDown className="h-4 w-4" />}
                        </Button>
                        <Button asChild variant="outline" size="icon" className="h-8 w-8" title="Editar / Ver Cotización">
                          <Link href={`/admin/quotes/edit/${quote.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="h-8 w-8" title="Eliminar Cotización">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esto eliminará permanentemente la cotización <strong>{quote.quoteNumber}</strong> para {quote.customerName}. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(quote.id, quote.quoteNumber)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No se encontraron cotizaciones con los filtros seleccionados.
                    </TableCell>
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
