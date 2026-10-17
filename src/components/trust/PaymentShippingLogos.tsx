import { CreditCard, Lock, ShieldCheck, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

/* Logotipos dibujados en HTML/SVG (sin imágenes externas): ligeros, nítidos y sin peticiones extra. */

function Chip({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 min-w-[52px] items-center justify-center rounded-md border border-border bg-white px-2.5 shadow-[0_1px_0_rgba(0,0,0,0.03)] select-none',
        className
      )}
    >
      {children}
    </span>
  );
}

const PAYMENT_LOGOS = [
  { key: 'spei', el: <Chip label="SPEI"><span className="text-[15px] font-black italic tracking-tight text-[#1b2a6b]">SPEI<sup className="text-[7px] text-[#e4002b]">®</sup></span></Chip> },
  { key: 'oxxo', el: <Chip label="OXXO" className="bg-[#e4002b] border-[#e4002b]"><span className="rounded-sm bg-[#ffd200] px-1 text-[12px] font-black tracking-tight text-[#e4002b]">OXXO</span></Chip> },
  { key: 'monex', el: <Chip label="Monex"><span className="text-[14px] font-bold tracking-tight text-[#0a6ebd]">m<span className="text-[#41b6e6]">o</span>nex</span></Chip> },
  { key: 'bbva', el: <Chip label="BBVA"><span className="text-[14px] font-semibold tracking-[0.12em] text-[#072146]">BBVA</span></Chip> },
  { key: 'visa', el: <Chip label="Visa"><span className="text-[16px] font-black italic tracking-tight text-[#1a1f71]">VISA</span></Chip> },
  {
    key: 'mastercard',
    el: (
      <Chip label="Mastercard">
        <svg viewBox="0 0 38 24" className="h-5 w-auto" aria-hidden="true">
          <circle cx="14" cy="12" r="9" fill="#eb001b" />
          <circle cx="24" cy="12" r="9" fill="#f79e1b" />
          <path d="M19 4.7a9 9 0 0 1 0 14.6 9 9 0 0 1 0-14.6z" fill="#ff5f00" />
        </svg>
      </Chip>
    ),
  },
  { key: 'amex', el: <Chip label="American Express" className="bg-[#2e77bc] border-[#2e77bc]"><span className="text-center text-[8px] font-black leading-[9px] tracking-tight text-white">AMERICAN<br />EXPRESS</span></Chip> },
  { key: 'paypal', el: <Chip label="PayPal"><span className="text-[14px] font-black italic tracking-tight text-[#003087]">Pay<span className="text-[#009cde]">Pal</span></span></Chip> },
];

const SHIPPING_LOGOS = [
  { key: 'estafeta', el: <Chip label="Estafeta"><span className="text-[14px] font-black italic tracking-tight text-[#e1251b]">estafeta</span></Chip> },
  { key: 'dhl', el: <Chip label="DHL" className="bg-[#ffcc00] border-[#ffcc00]"><span className="text-[15px] font-black italic tracking-tight text-[#d40511]">DHL</span></Chip> },
  { key: 'paquetexpress', el: <Chip label="Paquetexpress"><span className="text-[10px] font-black uppercase tracking-tight text-[#003b7a]">Paquet<span className="text-[#f39200]">express</span></span></Chip> },
];

export function PaymentLogos({ className }: { className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-1.5', className)}>{PAYMENT_LOGOS.map((l) => <span key={l.key}>{l.el}</span>)}</div>;
}

export function ShippingLogos({ className }: { className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-1.5', className)}>{SHIPPING_LOGOS.map((l) => <span key={l.key}>{l.el}</span>)}</div>;
}

/** Franja completa para el pie de página: "Formas de pago" | "Envíos a todo México". */
export function PaymentShippingStrip({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between', className)}>
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
          <CreditCard className="h-4 w-4 text-primary" /> Formas de pago
        </p>
        <PaymentLogos />
      </div>
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
          <Truck className="h-4 w-4 text-primary" /> Envíos a todo México
        </p>
        <ShippingLogos />
      </div>
    </div>
  );
}

/**
 * Bloque de confianza junto al botón de compra (ficha de producto, carrito).
 * Se coloca justo debajo del botón: es donde el cliente duda si pagar o no.
 */
export function SecureCheckoutBox({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-muted/30 p-3.5 space-y-3', className)}>
      <div className="flex items-start gap-2.5">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
        <div>
          <p className="text-sm font-bold text-foreground">Compra 100% segura</p>
          <p className="text-xs text-muted-foreground">Paga con tarjeta, transferencia SPEI o en efectivo en OXXO. Tus datos viajan cifrados.</p>
        </div>
      </div>
      <PaymentLogos />
      <div className="flex items-start gap-2.5 border-t border-border pt-3">
        <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-bold text-foreground">Envío asegurado a todo México</p>
          <p className="text-xs text-muted-foreground">Con número de guía para rastrear tu pedido.</p>
        </div>
      </div>
      <ShippingLogos />
      <p className="flex items-center gap-1.5 border-t border-border pt-3 text-xs font-semibold text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> Garantía oficial de fábrica · Factura CFDI 4.0
      </p>
    </div>
  );
}
