// Plantilla de correo "Nueva venta" para ventas@borarly.com
// Estilo inspirado en el aviso de venta de Mercado Libre, con la identidad de Borarly.
// Solo tablas + estilos inline para compatibilidad con Gmail/Outlook.

export interface OrderEmailItem {
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface OrderEmailData {
  orderId: string;
  reference: string;
  createdAt: string;
  status: string;
  paymentMethod: 'paypal' | 'spei' | 'oxxo' | string;
  customer: { name: string; email: string; phone?: string };
  shipping: { street: string; city: string; state?: string; zip: string; country: string };
  items: OrderEmailItem[];
  subtotal: number;
  vatAmount: number;
  shippingCost: number;
  total: number;
  billing?: { rfc: string; razonSocial: string; regimenFiscal?: string; usoCFDI?: string; zip?: string; email?: string } | null;
}

const BRAND_DARK = '#090d16';
const BRAND_BLUE = '#0256B9';
const SITE_URL = 'https://borarly.com';

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const money = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0);

const paymentLabel = (m: string) =>
  ({ paypal: 'PayPal / Tarjeta (pagado)', spei: 'Transferencia SPEI (pendiente de pago)', oxxo: 'Depósito OXXO (pendiente de pago)' } as Record<string, string>)[m] ||
  m.toUpperCase();

export function buildOrderEmailSubject(d: OrderEmailData) {
  const first = d.items[0]?.name || 'Pedido';
  const short = first.length > 60 ? first.slice(0, 57) + '…' : first;
  const more = d.items.length > 1 ? ` y ${d.items.length - 1} más` : '';
  return `¡Vendiste en Borarly! ${short}${more} — ${money(d.total)}`;
}

export function buildOrderEmailHtml(d: OrderEmailData) {
  const isPaid = d.paymentMethod === 'paypal';
  const headline = isPaid ? 'Prepara el paquete para enviarlo' : 'Nuevo pedido en espera de pago';
  const subline = isPaid
    ? 'El pago fue confirmado. Prepara los productos y coordina el envío al cliente.'
    : 'Confirma el depósito del cliente antes de preparar el envío.';
  const date = new Date(d.createdAt).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Merida' });

  const itemsHtml = d.items
    .map(
      (it) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #eef0f3;width:64px;vertical-align:top;">
          <img src="${esc(it.imageUrl || `${SITE_URL}/logo.png`)}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;object-fit:contain;border:1px solid #e5e7eb;border-radius:8px;background:#fff;" />
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #eef0f3;vertical-align:top;font-family:Arial,Helvetica,sans-serif;">
          <div style="font-size:14px;line-height:20px;color:#111827;font-weight:bold;">${esc(it.name)}</div>
          ${it.sku ? `<div style="font-size:12px;color:#6b7280;margin-top:2px;">SKU: ${esc(it.sku)}</div>` : ''}
          <div style="font-size:12px;color:#6b7280;margin-top:2px;">${it.quantity} × ${money(it.price)}</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #eef0f3;vertical-align:top;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827;font-weight:bold;white-space:nowrap;">
          ${money(it.price * it.quantity)}
        </td>
      </tr>`
    )
    .join('');

  const row = (label: string, value: string, bold = false) => `
    <tr>
      <td style="padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:${bold ? 16 : 14}px;color:${bold ? '#111827' : '#4b5563'};${bold ? 'font-weight:bold;' : ''}">${label}</td>
      <td style="padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:${bold ? 16 : 14}px;color:#111827;text-align:right;${bold ? 'font-weight:bold;' : ''}">${value}</td>
    </tr>`;

  const sectionTitle = (t: string) =>
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${BRAND_BLUE};margin:0 0 8px;">${t}</div>`;

  const p = (t: string) => `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:#374151;">${t}</div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(buildOrderEmailSubject(d))}</title></head>
<body style="margin:0;padding:0;background:#eceff3;">
  <div style="display:none;max-height:0;overflow:hidden;">Venta #${esc(d.reference)} · ${money(d.total)} · ${esc(d.customer.name)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eceff3;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">

        <!-- Header -->
        <tr><td style="background:${BRAND_DARK};padding:18px 28px;border-radius:12px 12px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><img src="${SITE_URL}/logo-white.png" height="32" alt="BORARLY" style="display:block;height:32px;width:auto;" /></td>
            <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9ca3af;">${esc(date)}</td>
          </tr></table>
        </td></tr>

        <!-- Banda de color -->
        <tr><td style="background:${BRAND_BLUE};padding:28px 28px 72px;">
          <span style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.35);color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:13px;padding:7px 12px;border-radius:6px;">Venta #${esc(d.reference)}</span>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:31px;font-weight:bold;color:#ffffff;margin-top:14px;">${headline}</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:#dbe7f7;margin-top:6px;">${subline}</div>
        </td></tr>

        <!-- Tarjeta blanca -->
        <tr><td style="padding:0 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;margin-top:-52px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <tr><td style="padding:24px;">

              ${sectionTitle(`Productos (${d.items.reduce((a, i) => a + i.quantity, 0)})`)}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
                ${row('Subtotal (sin IVA)', money(d.subtotal - d.vatAmount))}
                ${row('IVA (16%)', money(d.vatAmount))}
                ${row('Envío', d.shippingCost === 0 ? '<span style="color:#16a34a;font-weight:bold;">Gratis</span>' : money(d.shippingCost))}
                <tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding-top:6px;"></td></tr>
                ${row('Total', money(d.total), true)}
              </table>

              <div style="height:24px;"></div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td width="50%" style="vertical-align:top;padding-right:8px;">
                  ${sectionTitle('Cliente')}
                  ${p(`<strong>${esc(d.customer.name)}</strong><br>${esc(d.customer.email)}${d.customer.phone ? `<br>Tel. ${esc(d.customer.phone)}` : ''}`)}
                </td>
                <td width="50%" style="vertical-align:top;padding-left:8px;">
                  ${sectionTitle('Enviar a')}
                  ${p(`${esc(d.shipping.street)}<br>${esc(d.shipping.city)}${d.shipping.state ? `, ${esc(d.shipping.state)}` : ''}<br>C.P. ${esc(d.shipping.zip)} · ${esc(d.shipping.country)}`)}
                </td>
              </tr></table>

              <div style="height:20px;"></div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td width="50%" style="vertical-align:top;padding-right:8px;">
                  ${sectionTitle('Pago')}
                  ${p(`${esc(paymentLabel(d.paymentMethod))}<br><span style="color:#6b7280;font-size:12px;">Ref. ${esc(d.reference)}</span>`)}
                </td>
                <td width="50%" style="vertical-align:top;padding-left:8px;">
                  ${sectionTitle('Factura')}
                  ${
                    d.billing
                      ? p(`<strong>${esc(d.billing.razonSocial)}</strong><br>RFC: ${esc(d.billing.rfc)}${d.billing.regimenFiscal ? `<br>Régimen: ${esc(d.billing.regimenFiscal)}` : ''}${d.billing.usoCFDI ? ` · CFDI: ${esc(d.billing.usoCFDI)}` : ''}${d.billing.zip ? `<br>C.P. ${esc(d.billing.zip)}` : ''}${d.billing.email ? `<br>${esc(d.billing.email)}` : ''}`)
                      : p('<span style="color:#6b7280;">No requiere factura</span>')
                  }
                </td>
              </tr></table>

              <div style="height:28px;"></div>
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td style="background:${BRAND_BLUE};border-radius:8px;">
                  <a href="${SITE_URL}/admin/orders" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Ver pedido en el panel</a>
                </td>
              </tr></table>

            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 28px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6b7280;">
          Borarly Mayorista · Calle 8 C por 21, No. 105, Fracc. San Ángel, Kanasín, Yucatán, C.P. 97370<br>
          Notificación automática de venta. ID interno: ${esc(d.orderId)}
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
