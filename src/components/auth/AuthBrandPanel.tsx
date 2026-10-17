import Image from 'next/image';
import { Check, ShieldCheck } from 'lucide-react';

const BENEFITS = [
  'Precios de mayoreo con stock real',
  'Factura CFDI 4.0 en cada compra',
  'Envíos a todo México',
  'Asesoría técnica de ingenieros',
  'Pago seguro: PayPal, SPEI u OXXO',
];

/** Panel lateral de marca para login/registro (oculto en móvil, compacto en tablet). */
export function AuthBrandPanel({ variant }: { variant: 'login' | 'signup' }) {
  return (
    <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-[#090d16] p-8 lg:p-10 text-white">
      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      <div className="relative">
        <Image src="/logo-white.png" alt="BORARLY" width={170} height={44} className="h-10 w-auto" priority />
        <h2 className="mt-8 text-2xl lg:text-3xl font-bold leading-tight">
          {variant === 'signup' ? (
            <>Crea tu cuenta y compra <span className="text-sky-400">a precio de mayorista</span></>
          ) : (
            <>Bienvenido de nuevo a <span className="text-sky-400">Borarly</span></>
          )}
        </h2>
        <p className="mt-3 text-sm text-slate-300 leading-relaxed">
          {variant === 'signup'
            ? 'Toma menos de un minuto. Guarda tus direcciones y datos de facturación para comprar más rápido.'
            : 'Tu carrito, pedidos y datos de facturación te esperan.'}
        </p>

        <ul className="mt-8 space-y-3.5">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-3 text-sm font-medium">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/90">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-10 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <ShieldCheck className="h-8 w-8 shrink-0 text-sky-400" />
        <p className="text-xs text-slate-300 leading-relaxed">
          Tus datos están protegidos con cifrado y nunca los compartimos con terceros.
        </p>
      </div>
    </div>
  );
}
