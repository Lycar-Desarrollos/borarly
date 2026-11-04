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

type RGB = [number, number, number];

const BRAND: RGB = [35, 82, 181];
const DARK: RGB = [30, 32, 38];
const MUTED: RGB = [110, 114, 124];
const CARD_BG: RGB = [241, 245, 253];
const ROW_LINE: RGB = [226, 229, 234];

const PAGE_W = 210;
const MARGIN = 14;
const RIGHT = PAGE_W - MARGIN; // 196
const CONTENT_W = RIGHT - MARGIN; // 182
const BOTTOM = 272; // límite inferior antes de salto de página

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

/** "EQUIPO NUEVO: La garantía..." → "Equipo nuevo" (negrita) + resto */
function splitLead(text: string): { lead: string; rest: string } {
  const idx = text.indexOf(':');
  if (idx > 0 && idx <= 70) {
    let lead = text.slice(0, idx).trim();
    // Si viene todo en MAYÚSCULAS, lo pasamos a formato oración
    if (lead === lead.toUpperCase()) {
      lead = lead.charAt(0) + lead.slice(1).toLowerCase();
    }
    return { lead: lead + ':', rest: text.slice(idx + 1).trim() };
  }
  return { lead: '', rest: text };
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
  let logoDrawn = false;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', MARGIN, 14, 48, 12);
      logoDrawn = true;
    } catch {
      logoDrawn = false;
    }
  }
  if (!logoDrawn) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...DARK);
    doc.text(bankDetails.companyName || 'BORARLY', MARGIN, 24);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  doc.setTextColor(...BRAND);
  doc.text('COTIZACIÓN', RIGHT, 22, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(`Folio: ${d.quoteNumber}`, RIGHT, 29, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(`Fecha: ${format(new Date(d.createdAt), 'dd/MM/yyyy')}`, RIGHT, 34.5, { align: 'right' });
  doc.text(`Vigencia: ${format(new Date(d.expiresAt), 'dd/MM/yyyy')}`, RIGHT, 40, { align: 'right' });

  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.9);
  doc.line(MARGIN, 45, RIGHT, 45);

  // ── 2. Tarjetas: cliente y contacto ───────────
  const clientTitle = d.customerCompany || d.customerName;
  const clientSub: string[] = [];
  if (d.customerCompany && d.customerName) clientSub.push(`Atención: ${d.customerName}`);
  if (d.customerRfc) clientSub.push(`RFC: ${d.customerRfc}`);
  clientSub.push(d.customerEmail);
  if (d.customerPhone) clientSub.push(`Tel. ${d.customerPhone}`);

  const contactSub: string[] = [`Cel. ${companyPhone?.trim() || bankDetails.phone}`];
  if (bankDetails.email) contactSub.push(bankDetails.email);

  const boxTop = 51;
  const boxW = (CONTENT_W - 6) / 2;
  const lines = Math.max(clientSub.length, contactSub.length);
  const boxH = 15 + lines * 4.8;

  const drawCard = (x: number, label: string, title: string, subs: string[]) => {
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(x, boxTop, boxW, boxH, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND);
    doc.text(label, x + 5, boxTop + 6.5, { charSpace: 0.5 } as any);
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    const t = doc.splitTextToSize(title, boxW - 10)[0] as string;
    doc.text(t, x + 5, boxTop + 12.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    subs.forEach((s, i) => {
      const fit = doc.splitTextToSize(s, boxW - 10)[0] as string;
      doc.text(fit, x + 5, boxTop + 18 + i * 4.8);
    });
  };
  drawCard(MARGIN, 'CLIENTE', clientTitle, clientSub);
  drawCard(MARGIN + boxW + 6, 'CONTACTO BORARLY', 'borarly.com', contactSub);

  // ── 3. Título de sección + tabla de partidas ──
  let y = boxTop + boxH + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...BRAND);
  doc.text('DETALLE DE LA COTIZACIÓN', MARGIN, y);

  (doc as any).autoTable({
    startY: y + 3,
    margin: { left: MARGIN, right: MARGIN, bottom: 22 },
    head: [['Producto / Concepto', 'Modelo / SKU', 'Cant.', 'Precio unit. s/IVA', 'Importe s/IVA']],
    body: d.items.map(item => [
      item.name,
      String(item.sku || item.productId || ''),
      item.quantity,
      money(item.price),
      money(item.price * item.quantity),
    ]),
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: { top: 3, bottom: 3, left: 3, right: 3 }, valign: 'top', textColor: DARK, overflow: 'linebreak' },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold', fontSize: 8.5, valign: 'middle', cellPadding: { top: 3.2, bottom: 3.2, left: 3, right: 3 } },
    columnStyles: {
      0: { cellWidth: 68 },
      1: { cellWidth: 34 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 33, halign: 'right' },
      4: { cellWidth: 33, halign: 'right' },
    },
    didParseCell: (hook: any) => {
      if (hook.section === 'head') {
        if (hook.column.index === 2) hook.cell.styles.halign = 'center';
        if (hook.column.index >= 3) hook.cell.styles.halign = 'right';
      }
      if (hook.section === 'body' && hook.column.index === 1) {
        hook.cell.styles.font = 'courier';
        hook.cell.styles.fontSize = 8.5;
      }
    },
    didDrawCell: (hook: any) => {
      if (hook.section === 'body') {
        doc.setDrawColor(...ROW_LINE);
        doc.setLineWidth(0.25);
        doc.line(hook.cell.x, hook.cell.y + hook.cell.height, hook.cell.x + hook.cell.width, hook.cell.y + hook.cell.height);
      }
    },
  });

  y = ((doc as any).lastAutoTable?.finalY || 120) + 9;

  // ── 4. Totales ────────────────────────────────
  const rows: Array<{ label: string; value: string; color?: RGB }> = [
    { label: 'Subtotal', value: money(d.subtotal) },
  ];
  if (d.discountAmount && d.discountAmount > 0) {
    rows.push({ label: d.discountLabel || 'Descuento', value: `-${money(d.discountAmount)}`, color: [200, 50, 65] });
  }
  if (d.shippingCost > 0) rows.push({ label: 'Envío', value: money(d.shippingCost) });
  if (d.vatAmount > 0) rows.push({ label: `IVA (${Math.round(d.vatRate * 100)}%)`, value: money(d.vatAmount) });

  const totalsW = 90;
  const totalsX = RIGHT - totalsW;
  const rowH = 6.4;
  y = ensureSpace(y, rows.length * rowH + 16);

  doc.setFontSize(10);
  rows.forEach((r, i) => {
    const ry = y + i * rowH;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...(r.color || DARK));
    doc.text(r.label, totalsX + 3, ry);
    doc.text(r.value, RIGHT - 3, ry, { align: 'right' });
  });
  const lineY = y + (rows.length - 1) * rowH + 3.2;
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.7);
  doc.line(totalsX, lineY, RIGHT, lineY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(...BRAND);
  doc.text('Total', totalsX + 3, lineY + 8);
  doc.text(money(d.totalAmount), RIGHT - 3, lineY + 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('Precios en pesos mexicanos (MXN).', RIGHT, lineY + 14, { align: 'right' });

  y = lineY + 24;

  // ── 5. Términos y condiciones (lista numerada) ─
  const paragraphs = d.notes ? normalizeNotes(d.notes) : [];
  if (paragraphs.length > 0) {
    y = ensureSpace(y, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...BRAND);
    doc.text('TÉRMINOS Y CONDICIONES', MARGIN, y);
    y += 6.5;

    const fontSize = 8.8;
    const lineH = 4.4;
    const indent = 6;
    const textW = CONTENT_W - indent;
    let n = 0;

    for (const raw of paragraphs) {
      n += 1;
      const text = raw.replace(/^(\d+\s*[-.)–]|[•\-*])\s*/, '');
      const { lead, rest } = splitLead(text);

      // Palabras con estilo (negrita solo en el encabezado del punto)
      const words: Array<{ w: string; bold: boolean }> = [
        ...lead.split(/\s+/).filter(Boolean).map(w => ({ w, bold: true })),
        ...rest.split(/\s+/).filter(Boolean).map(w => ({ w, bold: false })),
      ];

      // Armado de renglones midiendo cada palabra con su fuente
      const wrapped: Array<Array<{ w: string; bold: boolean }>> = [[]];
      let lineW = 0;
      doc.setFontSize(fontSize);
      for (const word of words) {
        doc.setFont('helvetica', word.bold ? 'bold' : 'normal');
        const ww = doc.getTextWidth(word.w);
        doc.setFont('helvetica', 'normal');
        const sp = doc.getTextWidth(' ');
        if (lineW > 0 && lineW + sp + ww > textW) {
          wrapped.push([]);
          lineW = 0;
        }
        wrapped[wrapped.length - 1].push(word);
        lineW += (lineW > 0 ? sp : 0) + ww;
      }

      // Un punto corto no se parte entre páginas
      if (wrapped.length <= 5) y = ensureSpace(y, wrapped.length * lineH);

      wrapped.forEach((lineWords, li) => {
        y = ensureSpace(y, lineH);
        if (li === 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(fontSize);
          doc.setTextColor(...MUTED);
          doc.text(`${n}.`, MARGIN + 1, y);
        }
        let x = MARGIN + indent;
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'normal');
        const spaceW = doc.getTextWidth(' ');
        lineWords.forEach(word => {
          doc.setFont('helvetica', word.bold ? 'bold' : 'normal');
          doc.setTextColor(...DARK);
          doc.text(word.w, x, y);
          x += doc.getTextWidth(word.w) + spaceW;
        });
        doc.setFont('helvetica', 'normal');
        y += lineH;
      });
      y += 2;
    }
  }

  // ── 6. Datos bancarios ────────────────────────
  if (d.showBankDetails !== false) {
    const bankH = 24;
    y = ensureSpace(y, bankH + 4);
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(MARGIN, y, CONTENT_W, bankH, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND);
    doc.text('DATOS BANCARIOS PARA PAGO (SPEI / TRANSFERENCIA)', MARGIN + 5, y + 6.5);
    const info: Array<[string, string]> = [
      ['Beneficiario:', bankDetails.beneficiary],
      ['Banco:', bankDetails.bank],
      ['CLABE interbancaria:', bankDetails.clabe],
    ];
    doc.setFontSize(9.5);
    info.forEach(([label, value], i) => {
      const ly = y + 12.5 + i * 4.8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MUTED);
      doc.text(label, MARGIN + 5, ly);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK);
      doc.text(String(value || ''), MARGIN + 44, ly);
    });
    y += bankH + 6;
  }

  // ── 7. Pie de página ──────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...ROW_LINE);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, 281, RIGHT, 281);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text('BORARLY · borarly.com · Gracias por su preferencia', PAGE_W / 2, 287, { align: 'center' });
    if (pages > 1) {
      doc.setFontSize(7.5);
      doc.text(`Página ${i} de ${pages}`, RIGHT, 287, { align: 'right' });
    }
  }

  return doc;
}
