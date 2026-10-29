"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, FormEvent, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Product, Quote, QuoteItem, QuoteStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  addQuote,
  updateQuote,
  deleteQuote,
  getUserQuotes,
  getQuoteLogoUrl,
} from '@/services/quoteService';
import {
  getVatRate,
  getShippingSettings,
  getBankDetails,
  type BankDetails,
} from '@/services/settingsService';
import { createOrderFromQuote } from '@/services/orderService';
import { searchSyscomProducts } from '@/app/actions/searchSyscomProducts';
import {
  Loader2,
  Trash2,
  PlusCircle,
  Search,
  FileDown,
  ShoppingCart,
  Package,
  FileText,
  ArrowLeft,
  Edit,
  Sparkles,
  Building2,
  CheckCircle2,
  RefreshCw,
  Minus,
  Plus,
  Copy,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper: fetch image as Base64 for PDF
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
  draft: 'Vigente',
  sent: 'Enviada',
  accepted: 'Aceptada',
  expired: 'Vencida',
  cancelled: 'Cancelada',
};

const statusBadgeStyles: Record<QuoteStatus, string> = {
  draft: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  sent: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  expired: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

function CustomerQuotesContent() {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const { cartItems } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // ── Mode State ────────────────────────────────
  const [viewMode, setViewMode] = useState<'list' | 'builder'>('list');
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  // ── Quotes List State ─────────────────────────
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);
  const [listSearch, setListSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // ── Branding & Settings ───────────────────────
  const [logoUrl, setLogoUrl] = useState<string>('/logo.png');
  const [vatRate, setVatRate] = useState<number>(0.16);
  const [shippingSettings, setShippingSettings] = useState<{ cost: number; freeShippingThreshold: number | null }>({
    cost: 0,
    freeShippingThreshold: null,
  });
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    companyName: 'BORARLY',
    email: 'ventas@borarly.com',
    phone: '+52 1 999 904 0931',
    beneficiary: 'BORARLY',
    clabe: '012 180 01576278534 6',
    bank: 'BBVA',
  });

  // ── Builder Form State ────────────────────────
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerRfc, setCustomerRfc] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [validityDays, setValidityDays] = useState<'15' | '30'>('15');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // ── Live Catalog Search State ─────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitializedFromParams = useRef(false);

  const formatCurrency = useCallback(
    (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount),
    []
  );

  // ── Auth Redirect ─────────────────────────────
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login?redirect=/profile/quotes');
    }
  }, [authLoading, currentUser, router]);

  // ── Load Settings & Branding ──────────────────
  useEffect(() => {
    Promise.all([
      getVatRate(),
      getShippingSettings(),
      getQuoteLogoUrl(),
      getBankDetails(),
    ]).then(([vat, ship, logo, bank]) => {
      setVatRate(vat);
      setShippingSettings(ship);
      if (logo) setLogoUrl(logo);
      setBankDetails(bank);
    });
  }, []);

  // ── Load User Quotes ──────────────────────────
  const loadQuotes = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingQuotes(true);
    try {
      const data = await getUserQuotes(currentUser.uid, userProfile?.email || currentUser.email);
      setQuotes(data);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar tus cotizaciones.' });
    } finally {
      setIsLoadingQuotes(false);
    }
  }, [currentUser, userProfile?.email, toast]);

  useEffect(() => {
    if (currentUser) {
      loadQuotes();
    }
  }, [currentUser, loadQuotes]);

  // ── Populate Default Client Info from Profile ─
  const resetFormWithProfile = useCallback(() => {
    const defaultBilling = userProfile?.savedBilling?.find(b => b.isDefault) || userProfile?.savedBilling?.[0];
    const defaultAddress = userProfile?.savedAddresses?.find(a => a.isDefault) || userProfile?.savedAddresses?.[0];

    setCustomerName(userProfile?.displayName || currentUser?.displayName || '');
    setCustomerEmail(userProfile?.email || currentUser?.email || '');
    setCustomerCompany(defaultBilling?.razonSocial || userProfile?.companyName || '');
    setCustomerRfc(defaultBilling?.rfc || '');
    setCustomerPhone(defaultAddress?.phone || userProfile?.phone || '');
    setNotes('Precios sujetos a disponibilidad. Cotización formal emitida por BORARLY.');
    setValidityDays('15');
    setItems([]);
    setEditingQuote(null);
  }, [userProfile, currentUser]);

  // ── Handle ?fromCart=1 or ?new=1 Query Params ─
  useEffect(() => {
    if (hasInitializedFromParams.current || authLoading || !currentUser) return;
    const fromCart = searchParams.get('fromCart');
    const isNew = searchParams.get('new');

    if (fromCart === '1') {
      hasInitializedFromParams.current = true;
      resetFormWithProfile();
      if (cartItems.length > 0) {
        const imported: QuoteItem[] = cartItems.map(ci => {
          const priceBeforeVat = ci.price / (1 + vatRate);
          return {
            productId: ci.id,
            sku: ci.line || ci.id,
            name: ci.name,
            quantity: ci.quantity,
            price: parseFloat(priceBeforeVat.toFixed(2)),
            stockAtTimeOfQuote: ci.stock,
            imageUrl: ci.imageUrls?.[0] || '',
          };
        });
        setItems(imported);
      }
      setViewMode('builder');
    } else if (isNew === '1') {
      hasInitializedFromParams.current = true;
      resetFormWithProfile();
      setViewMode('builder');
    }
  }, [searchParams, authLoading, currentUser, cartItems, vatRate, resetFormWithProfile]);

  // ── Start Creating New Quote ──────────────────
  const handleStartNewQuote = (importCart = false) => {
    resetFormWithProfile();
    if (importCart && cartItems.length > 0) {
      const imported: QuoteItem[] = cartItems.map(ci => {
        const priceBeforeVat = ci.price / (1 + vatRate);
        return {
          productId: ci.id,
          sku: ci.line || ci.id,
          name: ci.name,
          quantity: ci.quantity,
          price: parseFloat(priceBeforeVat.toFixed(2)),
          stockAtTimeOfQuote: ci.stock,
          imageUrl: ci.imageUrls?.[0] || '',
        };
      });
      setItems(imported);
      toast({
        title: 'Carrito Importado',
        description: `Se añadieron ${imported.length} producto(s) de tu carrito a la cotización.`,
      });
    }
    setViewMode('builder');
  };

  // ── Start Editing Existing Quote ──────────────
  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setCustomerName(quote.customerName);
    setCustomerEmail(quote.customerEmail);
    setCustomerCompany(quote.customerCompany || '');
    setCustomerRfc(quote.customerRfc || '');
    setCustomerPhone(quote.customerPhone || '');
    setNotes(quote.notes || '');
    setItems(quote.items);
    setViewMode('builder');
  };

  // ── Import Cart Into Active Builder ───────────
  const handleImportFromCart = () => {
    if (cartItems.length === 0) {
      toast({ variant: 'destructive', title: 'Carrito vacío', description: 'No tienes productos en tu carrito actualmente.' });
      return;
    }
    setItems(prev => {
      const map = new Map<string, QuoteItem>(prev.map(i => [i.productId, i]));
      cartItems.forEach(ci => {
        const priceBeforeVat = parseFloat((ci.price / (1 + vatRate)).toFixed(2));
        if (map.has(ci.id)) {
          const existing = map.get(ci.id)!;
          map.set(ci.id, { ...existing, quantity: existing.quantity + ci.quantity });
        } else {
          map.set(ci.id, {
            productId: ci.id,
            sku: ci.line || ci.id,
            name: ci.name,
            quantity: ci.quantity,
            price: priceBeforeVat,
            stockAtTimeOfQuote: ci.stock,
            imageUrl: ci.imageUrls?.[0] || '',
          });
        }
      });
      return Array.from(map.values());
    });
    toast({ title: 'Productos del carrito añadidos', description: 'Se integraron los artículos de tu carrito.' });
  };

  // ── Debounced Product Search ──────────────────
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

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Add Product from Catalog Search ───────────
  const addProductToQuote = (product: Product) => {
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      setItems(prev =>
        prev.map(i => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i))
      );
      toast({ title: 'Cantidad actualizada', description: `+1 ${product.name}` });
    } else {
      const priceBeforeVat = product.price / (1 + vatRate);
      const newItem: QuoteItem = {
        productId: product.id,
        sku: product.line || product.id,
        name: product.name,
        quantity: 1,
        price: parseFloat(priceBeforeVat.toFixed(2)),
        stockAtTimeOfQuote: product.stock,
        imageUrl: product.imageUrls?.[0] || '',
      };
      setItems(prev => [...prev, newItem]);
      toast({ title: 'Producto añadido a la cotización', description: product.name });
    }
    setSearchTerm('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    const validQty = Math.max(1, quantity);
    setItems(prev => prev.map(i => (i.productId === productId ? { ...i, quantity: validQty } : i)));
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  // ── Totals Calculation ────────────────────────
  const { subtotal, vatAmount, shippingCost, totalAmount } = useMemo(() => {
    const sub = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const vat = sub * vatRate;
    const totalWithVat = sub + vat;

    let shipping = 0;
    if (items.length > 0) {
      const { cost, freeShippingThreshold } = shippingSettings;
      if (freeShippingThreshold !== null && freeShippingThreshold > 0 && totalWithVat >= freeShippingThreshold) {
        shipping = 0;
      } else {
        shipping = cost;
      }
    }

    const total = totalWithVat + shipping;
    return {
      subtotal: sub,
      vatAmount: vat,
      shippingCost: shipping,
      totalAmount: total,
    };
  }, [items, vatRate, shippingSettings]);

  // ── Generate Official PDF with Borarly Logo ───
  const generateOfficialPdf = async (quote: Quote) => {
    setDownloadingId(quote.id);
    toast({ title: 'Generando Cotización PDF...', description: 'Incluyendo sello y membrete oficial de BORARLY.' });

    try {
      const doc = new jsPDF();

      // 1. Load Official Borarly Logo (with guaranteed fallback to /logo.png)
      const configuredLogoUrl = await getQuoteLogoUrl();
      let logoBase64: string | null = null;
      if (configuredLogoUrl) {
        logoBase64 = await getImageBase64(configuredLogoUrl);
      }
      if (!logoBase64) {
        logoBase64 = await getImageBase64('/logo.png');
      }

      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', 14, 12, 48, 12);
        } catch {
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(2, 86, 185);
          doc.text(bankDetails.companyName || 'BORARLY', 14, 20);
          doc.setTextColor(0, 0, 0);
        }
      } else {
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(2, 86, 185);
        doc.text(bankDetails.companyName || 'BORARLY', 14, 20);
        doc.setTextColor(0, 0, 0);
      }

      // 2. Document Header (Right)
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('COTIZACIÓN', 200, 19, { align: 'right' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 86, 185);
      doc.text(`Folio: ${quote.quoteNumber}`, 200, 25, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Fecha: ${format(new Date(quote.createdAt), 'dd/MM/yyyy')}`, 200, 30, { align: 'right' });
      doc.text(`Vigencia: ${format(new Date(quote.expiresAt), 'dd/MM/yyyy')}`, 200, 35, { align: 'right' });
      doc.setTextColor(0, 0, 0);

      // Divider
      doc.setDrawColor(2, 86, 185);
      doc.setLineWidth(0.6);
      doc.line(14, 42, 200, 42);

      // 3. Emitter & Recipient Blocks
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('EMITIDO POR:', 14, 50);
      doc.setFont('helvetica', 'normal');
      doc.text(bankDetails.companyName || 'BORARLY', 14, 55.5);
      doc.text(`Correo: ${bankDetails.email}`, 14, 60.5);
      doc.text(`Tel / WhatsApp: ${bankDetails.phone}`, 14, 65.5);
      doc.text('Sitio web: www.borarly.com', 14, 70.5);

      doc.setFont('helvetica', 'bold');
      doc.text('COTIZADO A:', 120, 50);
      doc.setFont('helvetica', 'normal');
      let clientY = 55.5;
      doc.text(`Atención: ${quote.customerName}`, 120, clientY);
      if (quote.customerCompany) {
        clientY += 5;
        doc.text(`Empresa: ${quote.customerCompany}`, 120, clientY);
      }
      if (quote.customerRfc) {
        clientY += 5;
        doc.text(`RFC: ${quote.customerRfc}`, 120, clientY);
      }
      clientY += 5;
      doc.text(`Email: ${quote.customerEmail}`, 120, clientY);
      if (quote.customerPhone) {
        clientY += 5;
        doc.text(`Tel: ${quote.customerPhone}`, 120, clientY);
      }

      // 4. Items Table
      const tableStartY = Math.max(78, clientY + 8);
      (doc as any).autoTable({
        startY: tableStartY,
        head: [['#', 'Descripción / Producto', 'Cant.', 'P. Unit. (s/IVA)', 'P. Unit. (c/IVA)', 'Importe (s/IVA)']],
        body: quote.items.map((item, idx) => [
          idx + 1,
          `${item.name}\nModelo / SKU: ${item.sku || item.productId}`,
          item.quantity,
          formatCurrency(item.price),
          formatCurrency(item.price * (1 + vatRate)),
          formatCurrency(item.price * item.quantity),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [2, 86, 185], textColor: 255, fontStyle: 'bold' },
        styles: { halign: 'center', fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { halign: 'left', cellWidth: 72 },
          2: { cellWidth: 16 },
          3: { halign: 'right', cellWidth: 29 },
          4: { halign: 'right', cellWidth: 29 },
          5: { halign: 'right', cellWidth: 30 },
        },
      });

      const finalY = (doc as any).lastAutoTable.finalY || 140;
      let notesY = finalY + 10;
      const totalsX = 148;
      let totalsY = finalY + 10;

      // 5. Financial Totals
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal (s/IVA):', totalsX, totalsY, { align: 'right' });
      doc.text(formatCurrency(quote.subtotal), 200, totalsY, { align: 'right' });

      if (quote.discountValue && quote.discountValue > 0) {
        const discAmt =
          quote.discountType === 'percentage'
            ? Math.min(quote.subtotal, quote.subtotal * (quote.discountValue / 100))
            : Math.min(quote.subtotal, quote.discountValue);
        totalsY += 6;
        doc.setTextColor(220, 53, 69);
        doc.text(
          `Descuento (${quote.discountType === 'percentage' ? `${quote.discountValue}%` : 'Fijo'}):`,
          totalsX,
          totalsY,
          { align: 'right' }
        );
        doc.text(`-${formatCurrency(discAmt)}`, 200, totalsY, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      }

      totalsY += 6;
      doc.text('Envío Asegurado:', totalsX, totalsY, { align: 'right' });
      doc.text(quote.shippingCost > 0 ? formatCurrency(quote.shippingCost) : '¡GRATIS!', 200, totalsY, {
        align: 'right',
      });

      if (quote.vatAmount > 0) {
        totalsY += 6;
        doc.text('IVA (16%):', totalsX, totalsY, { align: 'right' });
        doc.text(formatCurrency(quote.vatAmount), 200, totalsY, { align: 'right' });
      }

      totalsY += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 86, 185);
      doc.text('Total Neto (MXN):', totalsX, totalsY, { align: 'right' });
      doc.text(formatCurrency(quote.totalAmount), 200, totalsY, { align: 'right' });
      doc.setTextColor(0, 0, 0);

      // 6. Notes & Bank Details
      if (quote.notes) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.text('Notas y Condiciones Comerciales:', 14, notesY);
        doc.setFont('helvetica', 'normal');
        const splitNotes = doc.splitTextToSize(quote.notes, 90);
        doc.text(splitNotes, 14, notesY + 5);
        notesY += splitNotes.length * 4.5 + 8;
      }

      if (quote.showBankDetails !== false) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.text('Datos Bancarios para Pago (SPEI / Transferencia):', 14, notesY);
        doc.setFont('helvetica', 'normal');
        doc.text(`Beneficiario: ${bankDetails.beneficiary}`, 14, notesY + 5);
        doc.text(`Banco: ${bankDetails.bank}`, 14, notesY + 10);
        doc.text(`CLABE Interbancaria: ${bankDetails.clabe}`, 14, notesY + 15);
      }

      // Footer
      doc.setFontSize(8.5);
      doc.setTextColor(130);
      doc.text(
        'Documento oficial generado en www.borarly.com · Equipos 100% nuevos con garantía de fábrica y facturación CFDI 4.0.',
        105,
        285,
        { align: 'center' }
      );

      const safeName = (quote.customerCompany || quote.customerName || 'Cliente').replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`Cotizacion_${quote.quoteNumber}_${safeName}.pdf`);
      toast({ title: 'PDF Descargado', description: `Cotización ${quote.quoteNumber} lista con el logo de BORARLY.` });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el PDF.' });
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Save Quote (and optionally download PDF) ──
  const handleSaveQuote = async (e: FormEvent, shouldDownloadPdf = true) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!customerName.trim() || !customerEmail.trim() || items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Datos incompletos',
        description: 'Verifica tu nombre, correo electrónico y añade al menos un producto a la cotización.',
      });
      return;
    }

    setIsSaving(true);
    const days = parseInt(validityDays, 10) || 15;
    const expiresAtDate = editingQuote
      ? new Date(editingQuote.expiresAt)
      : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const quotePayload = {
      userId: currentUser.uid,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerCompany: customerCompany.trim() || undefined,
      customerRfc: customerRfc.trim().toUpperCase() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      items,
      subtotal,
      discountType: editingQuote?.discountType || ('percentage' as const),
      discountValue: editingQuote?.discountValue || 0,
      shippingCost,
      vatAmount,
      totalAmount,
      status: editingQuote?.status || ('draft' as QuoteStatus),
      notes: notes.trim(),
      expiresAt: expiresAtDate.toISOString(),
      showBankDetails: true,
    };

    try {
      let savedQuote: Quote | null = null;
      if (editingQuote) {
        savedQuote = await updateQuote(editingQuote.id, quotePayload);
        toast({ title: 'Cotización Actualizada', description: `Folio ${editingQuote.quoteNumber} actualizado.` });
      } else {
        savedQuote = await addQuote(quotePayload);
        toast({ title: 'Cotización Creada', description: `Folio oficial asignado: ${savedQuote.quoteNumber}` });
      }

      await loadQuotes();

      if (savedQuote && shouldDownloadPdf) {
        await generateOfficialPdf(savedQuote);
      }

      setViewMode('list');
      setEditingQuote(null);
    } catch (error) {
      console.error('Error saving customer quote:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar tu cotización.' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete Quote ──────────────────────────────
  const handleDeleteQuote = async (quote: Quote) => {
    try {
      await deleteQuote(quote.id);
      setQuotes(prev => prev.filter(q => q.id !== quote.id));
      toast({ title: 'Cotización eliminada', description: `Se eliminó la cotización ${quote.quoteNumber}.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la cotización.' });
    }
  };

  // ── Convert Quote to Order ────────────────────
  const handleConvertQuoteToOrder = async (quote: Quote) => {
    setConvertingId(quote.id);
    try {
      await updateQuote(quote.id, { status: 'accepted' });
      const newOrder = await createOrderFromQuote({ ...quote, userId: currentUser?.uid || quote.userId });
      toast({
        title: '¡Pedido Generado!',
        description: `Tu cotización ${quote.quoteNumber} se convirtió en el pedido #${newOrder.id.substring(0, 8).toUpperCase()}.`,
      });
      router.push('/profile/orders');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo generar el pedido desde la cotización.',
      });
    } finally {
      setConvertingId(null);
    }
  };

  const filteredQuotes = useMemo(() => {
    if (!listSearch.trim()) return quotes;
    const q = listSearch.toLowerCase();
    return quotes.filter(
      item =>
        item.quoteNumber.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        (item.customerCompany && item.customerCompany.toLowerCase().includes(q)) ||
        item.items.some(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)))
    );
  }, [quotes, listSearch]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 1: QUOTE BUILDER (CREAR / EDITAR COTIZACIÓN CON LOGO BORARLY)
  // ═══════════════════════════════════════════════════════════════════════════
  if (viewMode === 'builder') {
    const days = parseInt(validityDays, 10) || 15;
    const previewExpires = editingQuote
      ? new Date(editingQuote.expiresAt)
      : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return (
      <div className="space-y-6">
        {/* Top Back Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewMode('list');
              setEditingQuote(null);
            }}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Mis Cotizaciones
          </Button>

          {cartItems.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImportFromCart}
              className="gap-2 border-primary/40 text-primary hover:bg-primary/10 rounded-xl"
            >
              <ShoppingCart className="h-4 w-4" />
              Traer productos de mi Carrito ({cartItems.reduce((a, b) => a + b.quantity, 0)})
            </Button>
          )}
        </div>

        <form onSubmit={e => handleSaveQuote(e, true)} className="space-y-6">
          {/* Official Borarly Logo Header */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-md dark:bg-gradient-to-r dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 dark:border-blue-900/40 dark:shadow-xl">
            <div
              className="absolute inset-0 opacity-0 dark:opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4 px-5 sm:px-8 py-5">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="bg-white rounded-xl px-4 py-2.5 shadow border border-border dark:border-white/10 dark:shadow-lg">
                  <img
                    src={logoUrl || '/logo.png'}
                    alt="Logo Oficial BORARLY"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = '/logo.png';
                    }}
                    className="h-10 w-auto object-contain max-w-[180px]"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary dark:text-blue-400" />
                    <p className="text-muted-foreground dark:text-white/60 text-[11px] uppercase tracking-widest font-bold">
                      Cotizador Oficial BORARLY
                    </p>
                  </div>
                  <p className="text-foreground dark:text-white text-lg sm:text-xl font-black tracking-tight">
                    {editingQuote ? `Cotización #${editingQuote.quoteNumber}` : 'Nueva Cotización Formal'}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right text-muted-foreground dark:text-white/70 text-xs space-y-1">
                <p className="font-semibold text-foreground dark:text-white">{bankDetails.companyName}</p>
                <p>Emisión: {format(new Date(), 'dd/MM/yyyy', { locale: es })}</p>
                <p>Vigencia: {format(previewExpires, 'dd/MM/yyyy', { locale: es })}</p>
              </div>
            </div>
          </div>

          {/* Grid: Recipient Details + Live Catalog Search */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recipient / Company Details */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Datos para tu Cotización
                  </CardTitle>
                  {userProfile?.savedBilling && userProfile.savedBilling.length > 0 && (
                    <Select
                      onValueChange={billId => {
                        const found = userProfile.savedBilling?.find(b => b.id === billId);
                        if (found) {
                          setCustomerCompany(found.razonSocial);
                          setCustomerRfc(found.rfc);
                          if (found.email) setCustomerEmail(found.email);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[170px] h-8 text-xs">
                        <SelectValue placeholder="Usar RFC guardado" />
                      </SelectTrigger>
                      <SelectContent>
                        {userProfile.savedBilling.map(b => (
                          <SelectItem key={b.id} value={b.id} className="text-xs">
                            {b.alias || b.rfc} — {b.razonSocial}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <CardDescription className="text-xs">
                  Estos datos aparecerán en el bloque &quot;Cotizado a:&quot; de tu PDF con el membrete de BORARLY.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="customerName" className="text-xs">
                      Atención / Nombre *
                    </Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      required
                      placeholder="Tu nombre o contacto"
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail" className="text-xs">
                      Correo Electrónico *
                    </Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      required
                      placeholder="correo@empresa.com"
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="customerCompany" className="text-xs">
                      Empresa / Razón Social (Opcional)
                    </Label>
                    <Input
                      id="customerCompany"
                      value={customerCompany}
                      onChange={e => setCustomerCompany(e.target.value)}
                      placeholder="Ej: Constructora del Sureste S.A."
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerRfc" className="text-xs">
                      RFC (Opcional)
                    </Label>
                    <Input
                      id="customerRfc"
                      value={customerRfc}
                      onChange={e => setCustomerRfc(e.target.value.toUpperCase())}
                      placeholder="XAXX010101000"
                      className="h-9 text-sm font-mono uppercase mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="customerPhone" className="text-xs">
                      Teléfono (Opcional)
                    </Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="+52 999 000 0000"
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="validityDays" className="text-xs">
                      Vigencia de Cotización
                    </Label>
                    <Select value={validityDays} onValueChange={(v: '15' | '30') => setValidityDays(v)}>
                      <SelectTrigger id="validityDays" className="h-9 text-sm mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 días naturales</SelectItem>
                        <SelectItem value="30">30 días naturales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-xs">
                    Notas / Referencia de Proyecto
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Ej: Proyecto CCTV Sucursal Centro · Atención Licitación..."
                    rows={2}
                    className="text-sm mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product Search Card */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  Buscar y Añadir Equipos del Catálogo
                </CardTitle>
                <CardDescription className="text-xs">
                  Busca por modelo, marca o tipo de producto en tiempo real para integrarlos a tu cotización.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div ref={searchRef} className="relative">
                  <Label htmlFor="quote-product-search" className="text-xs">
                    Buscador de Catálogo Nacional
                  </Label>
                  <div className="relative mt-1">
                    {isSearching ? (
                      <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    )}
                    <Input
                      id="quote-product-search"
                      placeholder="Ej: Hikvision, U6-Pro, cámara bala, switch PoE..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                      className="pl-9 h-10 text-sm"
                      autoComplete="off"
                    />
                  </div>

                  {/* Dropdown Results */}
                  {showDropdown && (
                    <Card className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto border shadow-2xl">
                      <CardContent className="p-1.5">
                        {isSearching ? (
                          <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-sm">Consultando catálogo BORARLY...</span>
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-6 gap-1 text-muted-foreground">
                            <Package className="h-7 w-7 opacity-40" />
                            <span className="text-sm">No se encontraron productos</span>
                          </div>
                        ) : (
                          searchResults.map(p => {
                            const rawImg = p.imageUrls?.[0];
                            const imgSrc =
                              rawImg && rawImg.includes('syscom.mx')
                                ? `/api/image-proxy?url=${encodeURIComponent(rawImg)}`
                                : rawImg;
                            return (
                              <div
                                key={p.id}
                                onClick={() => addProductToQuote(p)}
                                className="flex items-center gap-3 p-2 hover:bg-primary/5 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-primary/20"
                              >
                                {imgSrc && (
                                  <img
                                    src={imgSrc}
                                    alt={p.name}
                                    className="h-11 w-11 object-contain rounded-md bg-white border p-0.5 flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2">{p.name}</p>
                                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                    Modelo: <strong className="text-foreground">{p.line || p.id}</strong>{' '}
                                    <span className="opacity-70 ml-1">· Stock: {p.stock ?? 'N/A'}</span>
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-bold text-sm text-primary">{formatCurrency(p.price)}</p>
                                  <p className="text-[10px] text-muted-foreground">IVA incl.</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Quick Tips / Info Box */}
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-primary">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Tu cotización incluye:</span>
                  </div>
                  <ul className="space-y-1 text-muted-foreground pl-6 list-disc">
                    <li>Logotipo y membrete oficial de <strong>BORARLY</strong></li>
                    <li>Precios unitarios desglosados antes de IVA + IVA 16%</li>
                    <li>Folio consecutivo verificable y datos bancarios SPEI</li>
                    <li>Descarga inmediata en formato PDF listo para imprimir o presentar</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quoted Items Table */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">
                Artículos en la Cotización{' '}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  ({items.reduce((a, b) => a + b.quantity, 0)} unidad{items.reduce((a, b) => a + b.quantity, 0) !== 1 ? 'es' : ''})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0 sm:px-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0256b9] hover:bg-[#02499e] border-none">
                    <TableHead className="text-white font-bold min-w-[220px]">Producto / Descripción</TableHead>
                    <TableHead className="w-[125px] text-white font-bold">Modelo / SKU</TableHead>
                    <TableHead className="w-[75px] text-white font-bold text-center">Stock</TableHead>
                    <TableHead className="w-[120px] text-white font-bold text-center">Cantidad</TableHead>
                    <TableHead className="w-[120px] text-white font-bold text-right">Precio s/IVA</TableHead>
                    <TableHead className="w-[120px] text-white font-bold text-right">Precio c/IVA</TableHead>
                    <TableHead className="w-[125px] text-white font-bold text-right">Total s/IVA</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length > 0 ? (
                    items.map(item => (
                      <TableRow key={item.productId}>
                        <TableCell>
                          <p className="font-medium text-xs sm:text-sm line-clamp-2">{item.name}</p>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.sku || item.productId}
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {item.stockAtTimeOfQuote ?? '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center border rounded-lg overflow-hidden h-8 w-24 mx-auto">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-7 rounded-none"
                              onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => updateItemQuantity(item.productId, parseInt(e.target.value, 10) || 1)}
                              className="h-8 w-10 text-center text-xs font-bold border-none px-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-7 rounded-none"
                              onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm font-medium">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm text-muted-foreground">
                          {formatCurrency(item.price * (1 + vatRate))}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm font-bold">
                          {formatCurrency(item.price * item.quantity)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(item.productId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-28 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2 py-4">
                          <Package className="h-8 w-8 opacity-30" />
                          <p className="text-sm">Usa el buscador de arriba o importa tu carrito para añadir productos</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {/* Totals Footer */}
            <CardFooter className="flex flex-col items-end gap-2 pt-4 px-6 pb-6">
              <div className="w-full max-w-sm space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal (Sin IVA)</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">IVA ({(vatRate * 100).toFixed(0)}%)</span>
                  <span className="font-medium">{formatCurrency(vatAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Envío Asegurado</span>
                  {shippingCost === 0 && items.length > 0 ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">¡Gratis!</span>
                  ) : (
                    <span className="font-medium">{formatCurrency(shippingCost)}</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-lg sm:text-xl font-black border-t pt-2.5 mt-2">
                  <span>Total Neto (MXN)</span>
                  <span className="text-primary">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* Submit / Download Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setViewMode('list');
                setEditingQuote(null);
              }}
              disabled={isSaving}
            >
              Cancelar
            </Button>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={e => handleSaveQuote(e as unknown as FormEvent, false)}
                disabled={isSaving || items.length === 0}
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Solo Guardar en Mi Perfil
              </Button>

              <Button
                type="submit"
                disabled={isSaving || items.length === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 shadow-md"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                {editingQuote ? 'Actualizar y Descargar PDF con Logo' : 'Crear y Descargar PDF con Logo'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2: MY QUOTES LIST (APARTADO EN EL PERFIL DEL CLIENTE)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Top Banner with Official Borarly Logo & Actions */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:bg-gradient-to-r dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 dark:border-blue-900/40">
        <div
          className="absolute inset-0 opacity-0 dark:opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-xl px-3.5 py-2 shadow border border-border dark:border-white/10 shrink-0">
              <img
                src={logoUrl || '/logo.png'}
                alt="BORARLY"
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.png';
                }}
                className="h-9 w-auto object-contain max-w-[150px]"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground dark:text-white">
                Mis Cotizaciones Oficiales
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground dark:text-white/70 mt-0.5">
                Crea, administra y descarga cotizaciones formales en PDF con el sello oficial de BORARLY.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {cartItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStartNewQuote(true)}
                className="gap-1.5 rounded-xl border-primary/40 bg-background/80 hover:bg-primary/10 text-primary font-semibold"
              >
                <ShoppingCart className="h-4 w-4" />
                Cotizar mi Carrito ({cartItems.reduce((a, b) => a + b.quantity, 0)})
              </Button>
            )}
            <Button
              onClick={() => handleStartNewQuote(false)}
              className="gap-2 rounded-xl font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <PlusCircle className="h-4 w-4" />
              Nueva Cotización
            </Button>
          </div>
        </div>
      </div>

      {/* Filter & Refresh Bar */}
      {quotes.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por folio, empresa o producto..."
              value={listSearch}
              onChange={e => setListSearch(e.target.value)}
              className="pl-9 h-9 text-sm rounded-xl"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={loadQuotes} disabled={isLoadingQuotes} className="gap-1.5 self-end sm:self-auto">
            <RefreshCw className={`h-4 w-4 ${isLoadingQuotes ? 'animate-spin' : ''}`} />
            Actualizar lista
          </Button>
        </div>
      )}

      {/* Quotes List Content */}
      {isLoadingQuotes ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredQuotes.length > 0 ? (
        <div className="space-y-4">
          {filteredQuotes.map(quote => {
            const isExpired = new Date(quote.expiresAt).getTime() < Date.now() && quote.status !== 'accepted';
            const displayStatus: QuoteStatus = isExpired ? 'expired' : quote.status;

            return (
              <Card
                key={quote.id}
                className="border-border/60 hover:border-primary/40 transition-all shadow-xs overflow-hidden"
              >
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-black text-base text-primary">{quote.quoteNumber}</span>
                      <Badge variant="outline" className={`text-[11px] font-semibold ${statusBadgeStyles[displayStatus]}`}>
                        {statusTranslations[displayStatus]}
                      </Badge>
                      {quote.customerCompany && (
                        <span className="text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md">
                          {quote.customerCompany}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Atención: <strong className="text-foreground">{quote.customerName}</strong>
                      {quote.customerRfc ? ` · RFC: ${quote.customerRfc}` : ''} · Emitida el{' '}
                      {format(new Date(quote.createdAt), 'dd/MM/yyyy')} · Vence el{' '}
                      {format(new Date(quote.expiresAt), 'dd/MM/yyyy')}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {quote.items.slice(0, 3).map(item => (
                        <span
                          key={item.productId}
                          className="text-[11px] bg-muted/60 border border-border/60 px-2 py-0.5 rounded-md truncate max-w-[240px]"
                        >
                          {item.quantity}x {item.sku || item.name}
                        </span>
                      ))}
                      {quote.items.length > 3 && (
                        <span className="text-[11px] text-muted-foreground font-medium">
                          +{quote.items.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/50 shrink-0">
                    <div className="text-left lg:text-right mr-2">
                      <p className="text-[11px] text-muted-foreground">Total Neto (IVA incl.)</p>
                      <p className="text-lg font-black text-primary">{formatCurrency(quote.totalAmount)}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => generateOfficialPdf(quote)}
                        disabled={downloadingId === quote.id}
                        className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
                      >
                        {downloadingId === quote.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileDown className="h-4 w-4" />
                        )}
                        Descargar PDF
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditQuote(quote)}
                        className="gap-1.5 rounded-xl"
                        title="Editar o ver detalle de la cotización"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Editar
                      </Button>

                      {quote.status !== 'accepted' && !isExpired && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleConvertQuoteToOrder(quote)}
                          disabled={convertingId === quote.id}
                          className="gap-1.5 rounded-xl font-semibold"
                          title="Generar pedido directo desde esta cotización"
                        >
                          {convertingId === quote.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ShoppingCart className="h-3.5 w-3.5" />
                          )}
                          Hacer Pedido
                        </Button>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl"
                            title="Eliminar cotización"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar cotización {quote.quoteNumber}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará la cotización de tu perfil de forma permanente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteQuote(quote)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-border/70 bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center text-center py-14 px-4 space-y-4">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <FileText className="h-10 w-10" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-lg font-bold text-foreground">
                Crea tu primera cotización formal con el logo de BORARLY
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Busca cualquier producto del catálogo nacional o importa tu carrito actual para obtener un documento PDF membretado con folio oficial, desglose de IVA y datos bancarios.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button onClick={() => handleStartNewQuote(false)} className="gap-2 rounded-xl font-bold">
                <PlusCircle className="h-4 w-4" />
                Crear Nueva Cotización
              </Button>
              {cartItems.length > 0 && (
                <Button variant="outline" onClick={() => handleStartNewQuote(true)} className="gap-2 rounded-xl">
                  <ShoppingCart className="h-4 w-4" />
                  Cotizar Productos de mi Carrito ({cartItems.reduce((a, b) => a + b.quantity, 0)})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CustomerQuotesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <CustomerQuotesContent />
    </Suspense>
  );
}
