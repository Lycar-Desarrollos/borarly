import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import type { QuoteItem } from '@/lib/types';
import type { BankDetails } from '@/services/settingsService';

/**
 * Generador único de PDF de cotizaciones BORARLY.
 * Lo comparten el perfil del cliente y el panel de administración,
 * para que el documento se vea idéntico y profesional en todos lados.
 */

export interface QuotePdfData {
  quoteNumber: string;
  createdAt: string;
  expiresAt: string;
  customerName: string;
  customerEmail: string;
  customerCompany?: string;
  customerRfc?: string;
  customerPhone?: string;
  items: QuoteItem[];
  subtotal: number;
  /** Monto del descuento ya calculado (0 si no hay) */
  discountAmount?: number;
  discountLabel?: string;
  shippingCost: number;
  /** Monto de IVA (0 si la cotización no incluye IVA) */
  vatAmount: number;
  vatRate: number;
  totalAmount: number;
  notes?: string;
  showBankDetails?: boolean;
}

export interface QuotePdfOptions {
  data: QuotePdfData;
  bankDetails: BankDetails;
  /** Teléfono alterno de la empresa (opcional) */
  companyPhone?: string;
  /** Logo ya convertido a data URL (PNG) */
  logoBase64?: string | null;
}

const BRAND: [number, number, number] = [2, 86, 185];
const DARK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const LIGHT_BG: [number, number, number] = [241, 245, 249];
const LINE: [number, number, number] = [203, 213, 225];

const PAGE_W = 210;
const MARGIN = 14;
const RIGHT = PAGE_W - MARGIN; // 196
const CONTENT_W = RIGHT - MARGIN; // 182
const BOTTOM = 270; // límite inferior antes de salto de página

const money = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

/**
 * Convierte el texto de notas en párrafos limpios.
 * Los saltos de línea "duros" a mitad de oración (típicos de texto pegado)
 * se unen; cada punto numerado (1-, 2., 3)) inicia un párrafo nuevo.
 */
export function normalizeNotes(raw: string): string[] {
  const lines = raw.replace(/\r/g, '').split('\n');
  const paragraphs: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const startsNew = /^(\d+\s*[-.)–]|[•\-*]\s)/.test(line);
    if (startsNew || paragraphs.length === 0) {
      paragraphs.push(line);
    } else {
      paragraphs[paragraphs.length - 1] += ' ' + line;
    }
  }
  return paragraphs.map(p => p.replace(/\s{2,}/g, ' '));
}

export function generateQuotePdf({ data, bankDetails, companyPhone, logoBase64 }: QuotePdfOptions): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const d = data;

  const ensureSpace = (y: number, needed: number): number => {
    if (y + needed > BOTTOM) {
      doc.addPage();
      return 20;
    }
    return y;
  };

  // ── 1. Encabezado ─────────────────────────────
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PAGE_W, 4, 'F');

  let logoDrawn = false;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', MARGIN, 12, 48, 12);
      logoDrawn = true;
    } catch {
      logoDrawn = false;
    }
  }
  if (!logoDrawn) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...BRAND);
    doc.text(bankDetails.companyName || 'BORARLY', MARGIN, 22);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...DARK);
  doc.text('COTIZACIÓN', RIGHT, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(...BRAND);
  doc.text(`Folio: ${d.quoteNumber}`, RIGHT, 27, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(`Fecha: ${format(new Date(d.createdAt), 'dd/MM/yyyy')}`, RIGHT, 32, { align: 'right' });
  doc.text(`Vigencia: ${format(new Date(d.expiresAt), 'dd/MM/yyyy')}`, RIGHT, 37, { align: 'right' });

  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, 43, RIGHT, 43);

  // ── 2. Emisor y cliente (dos tarjetas) ────────
  const emitterLines = [
    bankDetails.companyName || 'BORARLY',
    `Correo: ${bankDetails.email}`,
    `Tel / WhatsApp: ${companyPhone?.trim() || bankDetails.phone}`,
    'Sitio web: www.borarly.com',
  ];
  const clientLines: string[] = [`Atención: ${d.customerName}`];
  if (d.customerCompany) clientLines.push(`Empresa: ${d.customerCompany}`);
  if (d.customerRfc) clientLines.push(`RFC: ${d.customerRfc}`);
  clientLines.push(`Email: ${d.customerEmail}`);
  if (d.customerPhone) clientLines.push(`Tel: ${d.customerPhone}`);

  const boxTop = 48;
  const boxW = (CONTENT_W - 6) / 2;
  const boxH = 8 + Math.max(emitterLines.length, clientLines.length) * 5 + 3;

  const drawCard = (x: number, title: string, lines: string[]) => {
    doc.setFillColor(...LIGHT_BG);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, boxTop, boxW, boxH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND);
    doc.text(title, x + 4, boxTop + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK);
    lines.forEach((l, i) => {
      const fit = doc.splitTextToSize(l, boxW - 8)[0] as string;
      doc.text(fit, x + 4, boxTop + 12 + i * 5);
    });
  };
  drawCard(MARGIN, 'EMITIDO POR', emitterLines);
  drawCard(MARGIN + boxW + 6, 'COTIZADO A', clientLines);

  // ── 3. Tabla de partidas ──────────────────────
  (doc as any).autoTable({
    startY: boxTop + boxH + 8,
    margin: { left: MARGIN, right: MARGIN, bottom: 22 },
    head: [['#', 'Descripción / Producto', 'Cant.', 'P. Unit. (s/IVA)', 'P. Unit. (c/IVA)', 'Importe (s/IVA)']],
    body: d.items.map((item, idx) => [
      idx + 1,
      `${item.name}\nModelo / SKU: ${item.sku || item.productId}`,
      item.quantity,
      money(item.price),
      money(item.price * (1 + (d.vatAmount > 0 ? d.vatRate : 0))),
      money(item.price * item.quantity),
    ]),
    theme: 'grid',
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold', fontSize: 8.5, lineColor: BRAND },
    styles: { halign: 'center', valign: 'middle', fontSize: 8.5, cellPadding: 2.5, lineColor: LINE, lineWidth: 0.15, textColor: DARK },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 9 },
      1: { halign: 'left', cellWidth: 70 },
      2: { cellWidth: 14 },
      3: { halign: 'right', cellWidth: 29.5 },
      4: { halign: 'right', cellWidth: 29.5 },
      5: { halign: 'right', cellWidth: 30 },
    },
  });

  let y = ((doc as any).lastAutoTable?.finalY || 120) + 8;

  // ── 4. Totales (bloque alineado a la derecha) ─
  const rows: Array<{ label: string; value: string; color?: [number, number, number] }> = [
    { label: 'Subtotal (s/IVA)', value: money(d.subtotal) },
  ];
  if (d.discountAmount && d.discountAmount > 0) {
    rows.push({
      label: d.discountLabel || 'Descuento',
      value: `-${money(d.discountAmount)}`,
      color: [220, 53, 69],
    });
  }
  rows.push({ label: 'Envío', value: d.shippingCost > 0 ? money(d.shippingCost) : 'GRATIS' });
  if (d.vatAmount > 0) {
    rows.push({ label: `IVA (${Math.round(d.vatRate * 100)}%)`, value: money(d.vatAmount) });
  }

  const totalsW = 84;
  const totalsX = RIGHT - totalsW;
  const totalsH = rows.length * 6.5 + 12;
  y = ensureSpace(y, totalsH + 4);

  doc.setFontSize(9.5);
  rows.forEach((r, i) => {
    const ry = y + 4 + i * 6.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...(r.color || MUTED));
    doc.text(r.label, totalsX + 3, ry);
    doc.setTextColor(...(r.color || DARK));
    doc.text(r.value, RIGHT - 3, ry, { align: 'right' });
  });
  const barY = y + 4 + rows.length * 6.5 - 1;
  doc.setFillColor(...BRAND);
  doc.roundedRect(totalsX, barY, totalsW, 9, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL (MXN)', totalsX + 3, barY + 6.2);
  doc.text(money(d.totalAmount), RIGHT - 3, barY + 6.2, { align: 'right' });

  y = barY + 9 + 10;

  // ── 5. Notas y condiciones (ancho completo, con paginación) ──
  const paragraphs = d.notes ? normalizeNotes(d.notes) : [];
  if (paragraphs.length > 0) {
    y = ensureSpace(y, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND);
    doc.text('NOTAS Y CONDICIONES COMERCIALES', MARGIN, y);
    doc.setDrawColor(...BRAND);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, y + 1.8, MARGIN + 62, y + 1.8);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    const lineH = 4.1;
    for (const p of paragraphs) {
      const lines = doc.splitTextToSize(p, CONTENT_W) as string[];
      // Un párrafo corto no se parte entre páginas; uno largo se reparte línea por línea.
      if (lines.length <= 6) y = ensureSpace(y, lines.length * lineH);
      for (const line of lines) {
        y = ensureSpace(y, lineH);
        doc.text(line, MARGIN, y, { maxWidth: CONTENT_W });
        y += lineH;
      }
      y += 2.5;
    }
    y += 3;
  }

  // ── 6. Datos bancarios ────────────────────────
  if (d.showBankDetails !== false) {
    const bankH = 26;
    y = ensureSpace(y, bankH + 2);
    doc.setFillColor(...LIGHT_BG);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.roundedRect(MARGIN, y, CONTENT_W, bankH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND);
    doc.text('DATOS BANCARIOS PARA PAGO (SPEI / TRANSFERENCIA)', MARGIN + 4, y + 6);

    doc.setFontSize(9);
    const info: Array<[string, string]> = [
      ['Beneficiario:', bankDetails.beneficiary],
      ['Banco:', bankDetails.bank],
      ['CLABE Interbancaria:', bankDetails.clabe],
    ];
    info.forEach(([label, value], i) => {
      const ly = y + 12 + i * 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...MUTED);
      doc.text(label, MARGIN + 4, ly);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);
      doc.text(String(value || ''), MARGIN + 42, ly);
    });
    y += bankH + 4;
  }

  // ── 7. Pie de página con numeración en todas las hojas ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, 283, RIGHT, 283);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      'Documento generado en www.borarly.com · Equipos 100% nuevos con garantía de fábrica · Facturación CFDI 4.0',
      MARGIN,
      288
    );
    doc.text(`Página ${i} de ${pages}`, RIGHT, 288, { align: 'right' });
  }

  return doc;
}
