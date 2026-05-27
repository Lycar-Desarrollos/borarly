

"use client";

import { useState, FormEvent, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Product, Quote, QuoteItem, QuoteStatus, DiscountType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { addQuote, updateQuote, getQuoteLogoUrl } from '@/services/quoteService';
import { createOrderFromQuote } from '@/services/orderService';
import { Loader2, Trash2, PlusCircle, CalendarIcon, Search, FileDown, DollarSign, ShoppingCart, Percent, Package } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getVatRate } from '@/services/settingsService';
import { getBankDetails, type BankDetails } from '@/services/settingsService';
import { Switch } from '@/components/ui/switch';
import { searchSyscomProducts } from '@/app/actions/searchSyscomProducts';
import Image from 'next/image';

// Helper: fetch image as Base64 for PDF
function getImageBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      try {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
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

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export function QuoteForm({ quote: initialQuote }: { quote?: Quote }) {
  const router = useRouter();
  const { toast } = useToast();

  // ── Logo ──────────────────────────────────────
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    companyName: 'Borarly',
    email: 'contacto@borarly.com',
    phone: '+52 999 310 1452',
    beneficiary: 'Borarly',
    clabe: '012 180 01576278534 6',
    bank: 'BBVA',
  });

  // ── Client Info ──────────────────────────────
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [status, setStatus] = useState<QuoteStatus>('draft');
  const [notes, setNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  // ── Items ─────────────────────────────────────
  const [items, setItems] = useState<QuoteItem[]>([]);

  // ── Pricing Options ───────────────────────────
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [vatRate, setVatRate] = useState(0.16);
  const [includeVat, setIncludeVat] = useState(true);
  const [showBankDetails, setShowBankDetails] = useState(true);

  // ── UI State ──────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const isEditing = !!initialQuote;

  // ── Product Search State ──────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load VAT rate + Logo + Bank details from settings ───────
  useEffect(() => {
    getVatRate().then(setVatRate);
    getQuoteLogoUrl().then(setLogoUrl);
    getBankDetails().then(setBankDetails);
  }, []);

  // ── Populate form when editing ─────────────────
  useEffect(() => {
    if (initialQuote) {
      setCustomerName(initialQuote.customerName);
      setCustomerEmail(initialQuote.customerEmail);
      setStatus(initialQuote.status);
      setNotes(initialQuote.notes || '');
      setExpiresAt(new Date(initialQuote.expiresAt));
      setItems(initialQuote.items);
      setShippingCost(initialQuote.shippingCost || 0);
      setDiscountType(initialQuote.discountType || 'percentage');
      setDiscountValue(initialQuote.discountValue || 0);
      setIncludeVat(initialQuote.vatAmount > 0 || initialQuote.subtotal === 0);
      setShowBankDetails(typeof initialQuote.showBankDetails === 'boolean' ? initialQuote.showBankDetails : true);
    }
  }, [initialQuote]);

  // ── Debounced product search ───────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const results = await searchSyscomProducts(searchTerm.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Add product from search ────────────────────
  const addProductToQuote = (product: Product) => {
    if (items.some(item => item.productId === product.id)) {
      toast({ variant: 'destructive', title: 'Producto ya añadido', description: `${product.name} ya está en la cotización.` });
      return;
    }
    // Store price WITHOUT VAT so quote subtotal shows the base, then VAT is added at the end
    const priceBeforeVat = product.price / (1 + vatRate);
    const newItem: QuoteItem = {
      productId: product.id,
      sku: product.line || product.id, // Favor Model
      name: product.name,
      quantity: 1,
      price: parseFloat(priceBeforeVat.toFixed(2)),
      stockAtTimeOfQuote: product.stock,
    };
    setItems(prev => [...prev, newItem]);
    setSearchTerm('');
    setSearchResults([]);
    setShowDropdown(false);
    toast({ title: 'Producto añadido', description: product.name });
  };

  // ── Add custom (manual) line item ─────────────
  const addCustomItem = () => {
    setItems(prev => [...prev, {
      productId: `CUSTOM-${Date.now()}`,
      sku: 'Personalizado',
      name: '',
      quantity: 1,
      price: 0,
      stockAtTimeOfQuote: undefined,
    }]);
  };

  // ── Update item field ─────────────────────────
  const updateItem = (productId: string, field: 'quantity' | 'price' | 'name', value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.productId !== productId) return item;
      if (field === 'name' && typeof value === 'string') return { ...item, name: value };
      if ((field === 'quantity' || field === 'price') && typeof value === 'number') return { ...item, [field]: value };
      return item;
    }));
  };

  const removeItem = (productId: string) => setItems(prev => prev.filter(i => i.productId !== productId));

  // ── Totals ────────────────────────────────────
  const { subtotal, discountAmount, vatAmount, totalAmount } = useMemo(() => {
    const sub = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    let discount = discountType === 'percentage' ? sub * (discountValue / 100) : discountValue;
    discount = Math.min(sub, discount);
    const subAfterDiscount = sub - discount;
    const vat = includeVat ? subAfterDiscount * vatRate : 0;
    const total = subAfterDiscount + vat + (shippingCost || 0);
    return { subtotal: sub, discountAmount: discount, vatAmount: vat, totalAmount: total };
  }, [items, shippingCost, vatRate, discountType, discountValue, includeVat]);

  const formatCurrency = useCallback(
    (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount),
    []
  );

  // ── Save Quote ────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !expiresAt || items.length === 0) {
      toast({ variant: 'destructive', title: 'Información Faltante', description: 'Completa los datos del cliente, añade al menos un artículo y elige fecha de vencimiento.' });
      return;
    }
    setIsSubmitting(true);
    const quoteData = {
      customerName, customerEmail, items, subtotal,
      discountType, discountValue, shippingCost, vatAmount, totalAmount,
      status, notes, expiresAt: expiresAt.toISOString(), showBankDetails,
    };
    try {
      if (isEditing && initialQuote) {
        await updateQuote(initialQuote.id, quoteData);
        toast({ title: 'Cotización Actualizada' });
      } else {
        await addQuote(quoteData as Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'quoteNumber'>);
        toast({ title: 'Cotización Creada' });
      }
      router.push('/admin/quotes');
      router.refresh();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la cotización.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Convert to Order ──────────────────────────
  const handleCreateOrder = async () => {
    if (!initialQuote) return;
    setIsConverting(true);
    try {
      const newOrder = await createOrderFromQuote(initialQuote);
      toast({ title: 'Pedido Creado', description: `Pedido #${newOrder.id.substring(0, 8)} creado a partir de la cotización.`, duration: 7000 });
      router.push('/admin/orders');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo crear el pedido.' });
    } finally {
      setIsConverting(false);
    }
  };

  // ── Generate PDF ──────────────────────────────
  const handleDownloadPdf = async () => {
    if (!initialQuote) return;
    toast({ title: 'Generando PDF...', description: 'Por favor espera.' });
    const doc = new jsPDF();
    const pdfLogoUrl = await getQuoteLogoUrl();
    let logoBase64: string | null = null;
    if (pdfLogoUrl) logoBase64 = await getImageBase64(pdfLogoUrl);

    if (logoBase64) {
      try { doc.addImage(logoBase64, 'PNG', 14, 10, 45, 22); } catch { /* skip */ }
    } else {
      // Fallback: mostrar nombre empresa proporcional al tamaño del header
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text(bankDetails.companyName, 14, 20);
    }

    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('COTIZACIÓN', 200, 20, { align: 'right' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Número: ${initialQuote.quoteNumber}`, 200, 26, { align: 'right' });
    doc.text(`Fecha: ${format(new Date(initialQuote.createdAt), 'dd/MM/yyyy')}`, 200, 31, { align: 'right' });
    doc.text(`Vence: ${format(new Date(initialQuote.expiresAt), 'dd/MM/yyyy')}`, 200, 36, { align: 'right' });

    doc.setLineWidth(0.5); doc.line(14, 45, 200, 45);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('De parte de:', 14, 52); doc.setFont('helvetica', 'normal');
    doc.text(bankDetails.companyName, 14, 58);
    doc.text(bankDetails.email, 14, 64);
    doc.text(bankDetails.phone, 14, 70);
    doc.setFont('helvetica', 'bold');
    doc.text('Dirigido a:', 130, 52); doc.setFont('helvetica', 'normal');
    doc.text(customerName, 130, 58);
    doc.text(customerEmail, 130, 64);

    (doc as any).autoTable({
      startY: 80,
      head: [['#', 'Producto', 'Cant.', 'Precio Unit.', 'Total']],
      body: items.map((item, i) => [
        i + 1,
        item.name + `\nModelo: ${item.sku || item.productId}`,
        item.quantity,
        formatCurrency(item.price),
        formatCurrency(item.price * item.quantity),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [103, 58, 183] }, // Regreso al Morado Original
      styles: { halign: 'center' },
      columnStyles: { 1: { halign: 'left', cellWidth: 80 }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 140;
    let notesY = finalY + 10;
    const totalsX = 140;
    let totalsY = finalY + 10;

    doc.setFontSize(12);
    doc.text('Subtotal:', totalsX, totalsY, { align: 'right' });
    doc.text(formatCurrency(subtotal), 200, totalsY, { align: 'right' });
    if (discountAmount > 0) {
      totalsY += 7;
      doc.setTextColor(220, 53, 69);
      doc.text(`Descuento (${discountType === 'percentage' ? `${discountValue}%` : 'Fijo'}):`, totalsX, totalsY, { align: 'right' });
      doc.text(`-${formatCurrency(discountAmount)}`, 200, totalsY, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    }
    if (shippingCost > 0) {
      totalsY += 7;
      doc.text('Envío:', totalsX, totalsY, { align: 'right' });
      doc.text(formatCurrency(shippingCost), 200, totalsY, { align: 'right' });
    }
    if (includeVat) {
      totalsY += 7;
      doc.text(`IVA (${(vatRate * 100).toFixed(0)}%):`, totalsX, totalsY, { align: 'right' });
      doc.text(formatCurrency(vatAmount), 200, totalsY, { align: 'right' });
    }
    totalsY += 7; doc.setFont('helvetica', 'bold');
    doc.text('Total (MXN):', totalsX, totalsY, { align: 'right' });
    doc.text(formatCurrency(totalAmount), 200, totalsY, { align: 'right' });

    if (notes) {
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text('Notas y Términos:', 14, notesY); doc.setFont('helvetica', 'normal');
      const split = doc.splitTextToSize(notes, 80);
      doc.text(split, 14, notesY + 6);
      notesY += split.length * 5 + 10;
    }
    if (showBankDetails) {
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text('Datos de Pago:', 14, notesY); doc.setFont('helvetica', 'normal');
      doc.text(`Beneficiario: ${bankDetails.beneficiary}`, 14, notesY + 6);
      doc.text(`Cuenta CLABE: ${bankDetails.clabe}`, 14, notesY + 12);
      doc.text(`Banco: ${bankDetails.bank}`, 14, notesY + 18);
    }
    doc.setFontSize(9); doc.setTextColor(150);
    doc.text('Gracias por su preferencia.', 105, 285, { align: 'center' });
    doc.save(`Cotizacion_${initialQuote.quoteNumber}_${customerName.replace(/ /g, '_')}.pdf`);
    toast({ title: 'PDF Descargado' });
  };

  // ── Render ────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Company Logo Header — theme-aware */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-md dark:bg-gradient-to-r dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 dark:border-blue-900/40 dark:shadow-xl">
        {/* Grid pattern - only visible in dark mode */}
        <div className="absolute inset-0 opacity-0 dark:opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-5">
            {logoUrl ? (
              <div className="bg-white rounded-xl px-4 py-2.5 shadow border border-border dark:border-white/10 dark:shadow-lg">
                <img
                  src={logoUrl}
                  alt="Logo de la empresa"
                  className="h-10 w-auto object-contain max-w-[180px]"
                />
              </div>
            ) : (
              <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <FileDown className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <p className="text-muted-foreground dark:text-white/50 text-xs uppercase tracking-widest font-semibold">Documento Oficial</p>
              <p className="text-foreground dark:text-white text-xl font-bold tracking-tight">
                {isEditing ? `Cotización #${initialQuote?.quoteNumber}` : 'Nueva Cotización'}
              </p>
            </div>
          </div>
          <div className="text-right text-muted-foreground dark:text-white/60 text-xs space-y-1">
            <p>Fecha: {format(new Date(), 'dd/MM/yyyy', { locale: es })}</p>
            {expiresAt && <p>Vence: {format(expiresAt, 'dd/MM/yyyy', { locale: es })}</p>}
          </div>
        </div>
      </div>

      {/* Top Row: Client Info + Product Search */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? `Cotización #${initialQuote?.quoteNumber}` : 'Datos del Cliente'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Nombre del Cliente</Label>
                <Input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} required placeholder="Ej: Empresa ABC S.A." />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email del Cliente</Label>
                <Input id="customerEmail" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required placeholder="correo@empresa.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={status} onValueChange={(val: QuoteStatus) => setStatus(val)}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusTranslations).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vence el</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !expiresAt && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiresAt ? format(expiresAt, 'PPP', { locale: es }) : 'Elige una fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar locale={es} mode="single" selected={expiresAt} onSelect={setExpiresAt} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="showBankDetails" checked={showBankDetails} onCheckedChange={setShowBankDetails} />
              <Label htmlFor="showBankDetails" className="cursor-pointer">Mostrar Datos Bancarios en PDF</Label>
            </div>
            <div>
              <Label htmlFor="notes">Notas / Términos</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Pago al recibir. Cotización válida por 30 días." rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Product Search */}
        <Card>
          <CardHeader>
            <CardTitle>Buscar y Añadir Productos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Busca en el catálogo de Syscom en tiempo real. Los precios son los mismos del catálogo público.
            </p>
            <div ref={searchRef} className="relative">
              <Label htmlFor="product-search">Buscar por nombre o SKU</Label>
              <div className="relative mt-1">
                {isSearching
                  ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                }
                <Input
                  id="product-search"
                  placeholder="Escribe al menos 2 caracteres..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  className="pl-10"
                  autoComplete="off"
                />
              </div>

              {/* Dropdown Results */}
              {showDropdown && (
                <Card className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto border shadow-xl">
                  <CardContent className="p-1">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Buscando en Syscom...</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-1 text-muted-foreground">
                        <Package className="h-7 w-7 opacity-40" />
                        <span className="text-sm">No se encontraron productos</span>
                      </div>
                    ) : (
                      searchResults.map(p => (
                        <div
                          key={p.id}
                          onClick={() => addProductToQuote(p)}
                          className="flex items-center gap-3 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
                        >
                          {p.imageUrls?.[0] && (
                            <img src={p.imageUrls[0]} alt={p.name} className="h-10 w-10 object-contain rounded bg-white border flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm leading-tight line-clamp-2">{p.name}</p>
                            <p className="text-xs text-muted-foreground font-semibold">Modelo: {p.line || p.id} <span className="font-normal opacity-50 ml-1">· Stock: {p.stock ?? 'N/A'}</span></p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-sm text-primary">{formatCurrency(p.price)}</p>
                            <p className="text-[10px] text-muted-foreground">IVA incl.</p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <Button type="button" variant="outline" onClick={addCustomItem} className="w-full mt-2">
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Artículo Manual
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Artículos Cotizados <span className="text-sm font-normal text-muted-foreground ml-2">({items.length} artículo{items.length !== 1 ? 's' : ''})</span></CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#673ab7] hover:bg-[#5e35a6] border-none">
                <TableHead className="text-white font-bold">Producto / Modelo</TableHead>
                <TableHead className="w-[80px] text-white font-bold">Stock</TableHead>
                <TableHead className="w-[100px] text-white font-bold">Cant.</TableHead>
                <TableHead className="w-[160px] text-white font-bold text-right">Precio s/IVA</TableHead>
                <TableHead className="w-[160px] text-white font-bold text-right">Total Línea</TableHead>
                <TableHead className="w-[48px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? items.map(item => (
                <TableRow key={item.productId}>
                  <TableCell>
                    <Input
                      value={item.name}
                      onChange={e => updateItem(item.productId, 'name', e.target.value)}
                      className="font-medium mb-1 h-8"
                      placeholder="Nombre del artículo"
                    />
                    <p className="text-xs text-muted-foreground pl-1 font-medium bg-muted w-fit px-1.5 rounded mt-1">
                      Modelo: {item.sku || (item.productId.startsWith('CUSTOM-') ? 'Personalizado' : 'N/D')}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.productId.startsWith('CUSTOM-') ? '—' : (item.stockAtTimeOfQuote ?? 'N/A')}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number" min="1"
                      value={item.quantity}
                      onChange={e => updateItem(item.productId, 'quantity', parseInt(e.target.value) || 1)}
                      className="h-8 w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number" step="0.01" min="0"
                      value={item.price}
                      onChange={e => updateItem(item.productId, 'price', parseFloat(e.target.value) || 0)}
                      className="h-8 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(item.price * item.quantity)}
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.productId)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 opacity-30" />
                      Busca productos arriba para añadirlos a la cotización
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Totals */}
        <CardFooter className="flex flex-col items-end gap-3 pt-0">
          <div className="w-full max-w-sm space-y-2 border-t pt-4">
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Subtotal (s/IVA)</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>

            {/* Discount */}
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground text-sm">Descuento</Label>
              <div className="flex items-center gap-1">
                <Select value={discountType} onValueChange={(v: DiscountType) => setDiscountType(v)}>
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                    <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-24">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {discountType === 'fixed' ? <DollarSign className="h-3.5 w-3.5" /> : <Percent className="h-3.5 w-3.5" />}
                  </span>
                  <Input
                    type="number" step="0.01" min="0"
                    value={discountValue}
                    onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="pl-7 text-right h-8 text-sm"
                  />
                </div>
              </div>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-destructive text-sm">
                <span>Total descuento</span>
                <span>−{formatCurrency(discountAmount)}</span>
              </div>
            )}

            {/* Shipping */}
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground text-sm">Envío</Label>
              <div className="relative w-32">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number" step="0.01" min="0"
                  value={shippingCost}
                  onChange={e => setShippingCost(parseFloat(e.target.value) || 0)}
                  className="pl-7 text-right h-8 text-sm"
                />
              </div>
            </div>

            {/* VAT toggle */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Switch id="include-vat" checked={includeVat} onCheckedChange={setIncludeVat} />
                <Label htmlFor="include-vat" className="text-muted-foreground text-sm cursor-pointer">
                  IVA ({(vatRate * 100).toFixed(0)}%)
                </Label>
              </div>
              <span className="text-sm font-medium">{formatCurrency(vatAmount)}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div>
          {isEditing && (
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleDownloadPdf} disabled={isSubmitting || isConverting}>
                <FileDown className="mr-2 h-4 w-4" /> Descargar PDF
              </Button>
              <Button
                type="button"
                onClick={handleCreateOrder}
                disabled={isSubmitting || isConverting || status !== 'accepted'}
                title={status !== 'accepted' ? 'Cambia el estado a "Aceptada" primero' : ''}
              >
                {isConverting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                {isConverting ? 'Convirtiendo...' : 'Crear Pedido'}
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting || isConverting}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting || isConverting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Actualizar Cotización' : 'Crear Cotización'}
          </Button>
        </div>
      </div>
    </form>
  );
}
