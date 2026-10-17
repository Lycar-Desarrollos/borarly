import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Mail, MessageCircle } from 'lucide-react';
import { SERVICES, waLink } from '@/lib/services';
import { SectionTitle, ServiceCard, ServiceNavBar, ServicesContactBand } from '@/components/services/ServiceParts';

export const metadata: Metadata = {
  title: 'Servicios | Borarly',
  description: 'Desarrollo de tiendas en línea y sitios web, asistentes de venta por WhatsApp, ingeniería de proyectos de CCTV, redes y solar, y soporte técnico con ingenieros.',
};

const METRICS = [
  { value: '14+', label: 'Almacenes en México' },
  { value: '30,000+', label: 'Productos en catálogo' },
  { value: '24-48 hrs', label: 'Tiempo de entrega' },
  { value: '100%', label: 'Garantía de fabricante' },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-14 py-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Ruta" className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">Servicios</span>
        </nav>

        <ServiceNavBar />
      </div>

      {/* Hero en azul marino sólido Borarly (#090d16), limpio y con métricas integradas */}
      <section className="overflow-hidden rounded-2xl bg-[#090d16] text-white shadow-sm">
        <div className="p-7 sm:p-10 lg:p-12">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs sm:text-sm font-semibold text-sky-400">Servicios Borarly</p>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold leading-[1.15] tracking-tight">
              Soluciones prácticas para vender más y operar mejor
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-zinc-300">
              Apoyamos a comercios, integradores y empresas en todo México con el desarrollo de su tienda en línea, atención automatizada por WhatsApp, ingeniería de proyectos y soporte técnico directo.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <a
                href={waLink('Hola, me gustaría información sobre los servicios de Borarly.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                <MessageCircle className="h-4 w-4" />
                Hablar por WhatsApp
              </a>
              <a
                href="mailto:ventas@borarly.com"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              >
                <Mail className="h-4 w-4 text-zinc-400" />
                ventas@borarly.com
              </a>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 border-t border-white/10 bg-white/[0.02] md:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.label} className="px-6 py-5">
              <dd className="text-xl sm:text-2xl font-bold text-white tracking-tight">{m.value}</dd>
              <dt className="mt-0.5 text-xs sm:text-sm text-zinc-400">{m.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Los 4 Servicios */}
      <section id="servicios" className="space-y-6">
        <SectionTitle
          title="Nuestros servicios"
          subtitle="Selecciona un servicio para ver qué incluye, qué entregamos y cómo trabajamos."
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </section>

      <ServicesContactBand
        title="¿Tienes un proyecto en puerta?"
        text="Platica con nuestro equipo para orientarte y prepararte una propuesta sin compromiso."
        waMessage="Hola, deseo cotizar un proyecto o servicio con Borarly."
      />
    </div>
  );
}
