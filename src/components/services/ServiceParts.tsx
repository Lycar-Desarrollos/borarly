import Link from 'next/link';
import type { ComponentType } from 'react';
import {
  ArrowRight, Bell, BookOpen, Bot, Camera, Check, Compass, CreditCard,
  Download, FileCheck, FileText, GraduationCap, Headphones, LayoutDashboard,
  Lock, Mail, MessageCircle, Monitor, Network, Package, Percent,
  PhoneForwarded, Radio, Search, Shield, ShieldCheck, ShoppingCart, Sun,
  Users, Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SERVICES, waLink, type BorarlyService, type ServiceIconKey } from '@/lib/services';

export const SERVICE_ICONS: Record<ServiceIconKey, ComponentType<{ className?: string }>> = {
  web: ShoppingCart,
  chatbots: Bot,
  'value-projects': Network,
  support: Headphones,
};

export const FEATURE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  package: Package,
  percent: Percent,
  'credit-card': CreditCard,
  layout: LayoutDashboard,
  bell: Bell,
  search: Search,
  message: MessageCircle,
  'file-text': FileText,
  users: Users,
  'phone-forwarded': PhoneForwarded,
  'book-open': BookOpen,
  shield: Shield,
  camera: Camera,
  network: Network,
  radio: Radio,
  sun: Sun,
  lock: Lock,
  'file-check': FileCheck,
  compass: Compass,
  monitor: Monitor,
  wrench: Wrench,
  'shield-check': ShieldCheck,
  download: Download,
  'graduation-cap': GraduationCap,
};

/** Selector limpio tipo control segmentado para cambiar entre los 4 servicios. */
export function ServiceNavBar({ activeSlug }: { activeSlug?: ServiceIconKey }) {
  return (
    <nav aria-label="Servicios Borarly" className="overflow-x-auto no-scrollbar">
      <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 rounded-xl bg-muted/70 p-1.5 border border-border/60">
        <Link
          href="/services"
          className={cn(
            'shrink-0 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all',
            !activeSlug
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Todos
        </Link>
        {SERVICES.map((s) => {
          const Icon = SERVICE_ICONS[s.slug];
          const isActive = activeSlug === s.slug;
          return (
            <Link
              key={s.slug}
              href={s.href}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all',
                isActive
                  ? 'bg-card text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span>{s.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Título de sección con jerarquía clara y sobria. */
export function SectionTitle({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">{subtitle}</p>}
    </div>
  );
}

/** Tarjeta de servicio con presencia visual y estética minimalista Borarly. */
export function ServiceCard({ service, compact = false }: { service: BorarlyService; compact?: boolean }) {
  const Icon = SERVICE_ICONS[service.slug];
  return (
    <Link
      href={service.href}
      className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#090d16] text-white transition-colors group-hover:bg-primary">
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground/60 tabular-nums">
            {service.number}
          </span>
        </div>

        <h3 className="mt-5 text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">
          {service.name}
        </h3>
        <p className="mt-0.5 text-xs font-semibold text-primary">
          {service.tagline}
        </p>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          {service.cardText}
        </p>

        {!compact && (
          <ul className="mt-5 space-y-2 border-t border-border/70 pt-4">
            {service.cardBullets.map((b) => (
              <li key={b} className="flex items-center gap-2 text-xs sm:text-sm text-foreground/85">
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4 text-sm font-semibold text-primary">
        <span>Conocer más</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

/** Banda de contacto final en el azul marino de Borarly. */
export function ServicesContactBand({
  title = '¿Hablamos de tu proyecto?',
  text = 'Escríbenos directamente y un especialista de Borarly te atenderá sin compromiso.',
  waMessage = 'Hola, me gustaría información sobre los servicios de Borarly.',
}: { title?: string; text?: string; waMessage?: string }) {
  return (
    <section className="rounded-2xl bg-[#090d16] px-6 py-8 sm:px-10 sm:py-10 text-white shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm sm:text-base text-zinc-400">{text}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row shrink-0">
          <a
            href={waLink(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp directo
          </a>
          <a
            href="mailto:ventas@borarly.com"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
          >
            <Mail className="h-4 w-4" />
            ventas@borarly.com
          </a>
        </div>
      </div>
    </section>
  );
}
