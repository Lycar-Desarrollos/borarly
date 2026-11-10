import { CreditCard, Lock, ShieldCheck, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

/* Logotipos oficiales vectoriales (SVG reales) para Ficha de Producto, Carrito, Pie de Página y Checkout. */

export function Chip({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 items-center justify-center rounded-md border border-slate-200/90 bg-white px-2 py-1 shadow-2xs select-none overflow-hidden',
        className
      )}
    >
      {children}
    </span>
  );
}

export const VisaChip = (
  <Chip label="Visa" className="w-[54px] p-0.5">
    <svg className="h-full w-full" viewBox="0 0 48 32" fill="none" aria-hidden="true">
      <rect width="48" height="32" rx="4" fill="#ffffff" />
      <path
        d="M19.5 21.5L21.6 10.5H25L22.9 21.5H19.5ZM34.9 10.8C34.2 10.5 33.1 10.2 31.7 10.2C28.2 10.2 25.7 12 25.7 14.5C25.7 16.4 27.4 17.4 28.7 18C30 18.6 30.5 19 30.5 19.6C30.5 20.5 29.4 20.9 28.3 20.9C26.9 20.9 26.1 20.7 24.9 20.2L24.4 20L23.9 23C24.8 23.4 26.4 23.7 28 23.7C31.7 23.7 34.1 21.9 34.1 19.2C34.1 17.7 33.2 16.5 31.1 15.6C29.9 15 29.1 14.6 29.1 14C29.1 13.4 29.8 12.8 31.2 12.8C32.4 12.8 33.3 13 34 13.3L34.4 13.5L34.9 10.8ZM43.5 10.5H40.8C39.9 10.5 39.3 10.8 38.9 11.7L33.6 21.5H37.3L38 19.5H42.5L42.9 21.5H46.2L43.5 10.5ZM39.1 17C39.4 16.2 40.6 13.1 40.6 13.1C40.6 13.1 40.9 12.3 41.1 11.8L41.4 13L42.3 17H39.1ZM16.6 10.5L13.1 18L12.7 16.1C12.1 14 10.1 11.8 7.9 10.7L11.1 21.5H14.8L20.3 10.5H16.6Z"
        fill="#1434CB"
      />
      <path
        d="M10 10.5H4.3L4.2 10.8C8.6 11.9 11.5 14.6 12.7 16.1L11.5 11.7C11.3 10.8 10.7 10.5 10 10.5Z"
        fill="#F9A533"
      />
    </svg>
  </Chip>
);

export const MastercardChip = (
  <Chip label="Mastercard" className="w-[54px] p-0.5">
    <svg className="h-full w-full" viewBox="0 0 48 32" fill="none" aria-hidden="true">
      <rect width="48" height="32" rx="4" fill="#ffffff" />
      <circle cx="19" cy="16" r="8.5" fill="#EB001B" />
      <circle cx="29" cy="16" r="8.5" fill="#F79E1B" />
      <path
        d="M24 9.36A8.48 8.48 0 0 0 20.5 16c0 2.75 1.38 5.19 3.5 6.64A8.48 8.48 0 0 0 27.5 16c0-2.75-1.38-5.19-3.5-6.64Z"
        fill="#FF5F00"
      />
    </svg>
  </Chip>
);

export const AmexChip = (
  <Chip label="American Express" className="w-[54px] bg-[#016FD0] border-[#016FD0] p-0">
    <img src="/logos/amex.svg" alt="American Express" className="h-full w-full object-contain" />
  </Chip>
);

export const BbvaChip = (
  <Chip label="BBVA" className="w-[58px] px-2 py-1.5">
    <img src="/logos/bbva.svg" alt="BBVA" className="h-full w-full object-contain" />
  </Chip>
);

export const OxxoChip = (
  <Chip label="OXXO" className="w-[58px] p-0.5">
    <img src="/logos/oxxo.svg" alt="OXXO" className="h-full w-full object-contain" />
  </Chip>
);

export const SpeiChip = (
  <Chip label="SPEI" className="w-[58px] p-0.5">
    <svg className="h-full w-full" viewBox="0 0 56 32" fill="none" aria-hidden="true">
      <rect width="56" height="32" rx="4" fill="#ffffff" />
      <path
        d="M8.5 18.7L10.3 17.4C10.9 18.2 11.9 18.7 13.1 18.7C14.2 18.7 14.8 18.3 14.8 17.7C14.8 17.1 14.1 16.9 12.7 16.6C10.7 16.1 9.3 15.4 9.3 13.6C9.3 11.7 11 10.4 13.5 10.4C15.4 10.4 16.8 11 17.7 12L16 13.4C15.3 12.7 14.4 12.3 13.4 12.3C12.4 12.3 11.8 12.7 11.8 13.3C11.8 13.9 12.5 14.1 13.9 14.4C15.9 14.9 17.3 15.6 17.3 17.4C17.3 19.4 15.6 20.6 13 20.6C10.9 20.6 9.3 19.8 8.5 18.7ZM19.2 10.6H23.8C26.1 10.6 27.6 11.9 27.6 13.9C27.6 16 26 17.3 23.6 17.3H21.6V20.4H19.2V10.6ZM23.5 15.4C24.6 15.4 25.2 14.8 25.2 13.9C25.2 13 24.6 12.5 23.5 12.5H21.6V15.4H23.5ZM29.2 10.6H36.6V12.5H31.6V14.5H36V16.4H31.6V18.5H36.8V20.4H29.2V10.6ZM38.6 10.6H41.1V20.4H38.6V10.6Z"
        fill="#1B2A6B"
      />
      <circle cx="46.5" cy="13.5" r="3" fill="#E4002B" />
      <path d="M43.5 19.5C45.5 17.5 48 16.8 50.5 17.2" stroke="#1B2A6B" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  </Chip>
);

export const OpenpayChip = (
  <Chip label="Openpay by BBVA" className="w-[70px] p-0.5">
    <svg className="h-full w-full" viewBox="0 0 68 32" fill="none" aria-hidden="true">
      <rect width="68" height="32" rx="4" fill="#ffffff" />
      <circle cx="11" cy="16" r="4.5" stroke="#004481" strokeWidth="2.4" />
      <circle cx="14.5" cy="12.5" r="1.8" fill="#00A9E0" />
      <text x="19" y="19" fill="#004481" fontSize="10.5" fontWeight="800" fontFamily="system-ui, sans-serif" letterSpacing="-0.3">
        openpay
      </text>
    </svg>
  </Chip>
);

const PAYMENT_LOGOS = [
  { key: 'spei', el: SpeiChip },
  { key: 'oxxo', el: OxxoChip },
  { key: 'bbva', el: BbvaChip },
  { key: 'visa', el: VisaChip },
  { key: 'mastercard', el: MastercardChip },
  { key: 'amex', el: AmexChip },
  { key: 'openpay', el: OpenpayChip },
];

const SHIPPING_LOGOS = [
  {
    key: 'estafeta',
    el: (
      <Chip label="Estafeta" className="w-[72px] px-2 py-1">
        <img src="/logos/estafeta.svg" alt="Estafeta" className="h-full w-full object-contain" />
      </Chip>
    ),
  },
  {
    key: 'dhl',
    el: (
      <Chip label="DHL" className="w-[62px] bg-[#FFCC00] border-[#FFCC00] px-1.5 py-1">
        <img src="/logos/dhl.svg" alt="DHL" className="h-full w-full object-contain" />
      </Chip>
    ),
  },
  {
    key: 'paquetexpress',
    el: (
      <Chip label="Paquetexpress" className="w-[96px] p-0.5">
        <svg className="h-full w-full" viewBox="0 0 96 32" fill="none" aria-hidden="true">
          <rect width="96" height="32" rx="4" fill="#ffffff" />
          <text x="7" y="19" fill="#003B7A" fontSize="9.5" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="-0.3">
            PAQUET
          </text>
          <text x="47" y="19" fill="#F39200" fontSize="9.5" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="-0.3">
            EXPRESS
          </text>
        </svg>
      </Chip>
    ),
  },
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
          <p className="text-xs text-muted-foreground">Paga con tarjeta de crédito/débito, transferencia SPEI o efectivo en OXXO. Tus datos viajan cifrados.</p>
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
