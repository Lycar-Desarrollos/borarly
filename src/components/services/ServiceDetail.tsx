import Link from 'next/link';
import { ArrowRight, Check, ChevronDown, ChevronRight, Mail, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SERVICES, waLink, type BorarlyService } from '@/lib/services';
import {
  FEATURE_ICONS, SERVICE_ICONS, SectionTitle, ServiceCard,
  ServiceNavBar, ServicesContactBand,
} from './ServiceParts';

export function ServiceDetail({ service }: { service: BorarlyService }) {
  const Icon = SERVICE_ICONS[service.slug];
  const others = SERVICES.filter((s) => s.slug !== service.slug);

  return (
    <div className="mx-auto max-w-6xl space-y-14 py-6 sm:py-8">
      {/* Ruta + Selector segmentado de servicios */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Ruta" className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/services" className="hover:text-primary transition-colors">Servicios</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{service.name}</span>
        </nav>

        <ServiceNavBar activeSlug={service.slug} />
      </div>

      {/* Hero con el azul marino sólido de Borarly (#090d16), limpio y sin efectos artificiales */}
      <section className="rounded-2xl bg-[#090d16] p-7 sm:p-10 lg:p-12 text-white shadow-sm">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-center lg:gap-12">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-sky-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
                <Icon className="h-4 w-4" />
              </span>
              <span>{service.tagline}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold leading-[1.15] tracking-tight text-white">
              {service.heroTitle}
            </h1>

            <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-300">
              {service.heroText}
            </p>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <a
                href={waLink(service.waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                <MessageCircle className="h-4 w-4" />
                Cotizar por WhatsApp
              </a>
              <a
                href={`mailto:ventas@borarly.com?subject=${encodeURIComponent(service.name)}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              >
                <Mail className="h-4 w-4 text-zinc-400" />
                ventas@borarly.com
              </a>
            </div>
          </div>

          {/* 3 indicadores clave en panel sobrio */}
          <dl className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-2">
            {service.heroFacts.map((f) => (
              <div key={f.label} className="flex items-baseline justify-between gap-4 py-4">
                <dt className="text-sm text-zinc-400">{f.label}</dt>
                <dd className="text-xl sm:text-2xl font-bold text-white tracking-tight shrink-0">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Qué incluye: tarjetas limpias con ícono sutil */}
      <section className="space-y-6">
        <SectionTitle
          title={service.includesTitle}
          subtitle="Todo lo que contemplamos para que tu solución opere sin contratiempos."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {service.includes.map((item) => {
            const FeatIcon = (item.icon && FEATURE_ICONS[item.icon]) || Check;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-colors hover:border-primary/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FeatIcon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modalidades (si aplica) */}
      {service.plans && (
        <section className="space-y-6">
          <SectionTitle
            title="Modalidades"
            subtitle="Elige la opción que se ajuste a tu operación. Cotizamos sin compromiso."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {service.plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'flex flex-col rounded-2xl border bg-card p-6 shadow-xs',
                  plan.highlight ? 'border-2 border-primary' : 'border-border'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                  {plan.highlight && (
                    <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      Recomendado
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{plan.forWho}</p>
                <ul className="mb-6 mt-5 space-y-2.5 border-t border-border pt-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/90">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={waLink(plan.waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'mt-auto inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                    plan.highlight
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-border text-foreground hover:bg-muted'
                  )}
                >
                  Cotizar esta opción
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cómo trabajamos + Entregables */}
      <section className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <SectionTitle
            title="Cómo trabajamos"
            subtitle="Un proceso claro y ordenado de principio a fin."
          />
          <ol className="space-y-3">
            {service.steps.map((step, i) => (
              <li
                key={step.title}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#090d16] text-xs font-bold text-white tabular-nums">
                  0{i + 1}
                </span>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-6">
          <SectionTitle
            title={service.deliverablesTitle}
            subtitle="Lo que incluye formalmente nuestro servicio."
          />
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 sm:p-7 space-y-6">
            <ul className="space-y-3.5">
              {service.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-border pt-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ideal para
              </p>
              <div className="flex flex-wrap gap-2">
                {service.idealFor.map((who) => (
                  <span
                    key={who}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground"
                  >
                    {who}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <a
                href={waLink(service.waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <span>Solicitar propuesta para mi negocio</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start border-t border-border pt-12">
        <SectionTitle
          title="Preguntas frecuentes"
          subtitle="Si tienes otra duda, escríbenos por WhatsApp y te respondemos al momento."
        />
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
          {service.faqs.map((faq, idx) => (
            <details key={faq.q} className="group" open={idx === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-sm sm:text-base font-semibold text-foreground hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
                <span>{faq.q}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <ServicesContactBand
        title="¿Platicamos sobre tu proyecto?"
        text="Cuéntanos qué necesitas y te preparamos una propuesta clara y por escrito."
        waMessage={service.waMessage}
      />

      {/* Otros servicios */}
      <section className="space-y-6">
        <SectionTitle title="Otros servicios de Borarly" />
        <div className="grid gap-4 md:grid-cols-3">
          {others.map((s) => (
            <ServiceCard key={s.slug} service={s} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
