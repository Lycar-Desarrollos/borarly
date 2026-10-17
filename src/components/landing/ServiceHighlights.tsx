import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SERVICES } from '@/lib/services';
import { ServiceCard } from '@/components/services/ServiceParts';

export function ServiceHighlights() {
  return (
    <section className="w-full py-6 space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            SERVICIOS BORARLY
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Desarrollo de tiendas en línea, asistentes de WhatsApp, ingeniería de proyectos y soporte técnico.
          </p>
        </div>
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline shrink-0"
        >
          <span>Ver todos</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((service) => (
          <ServiceCard key={service.slug} service={service} />
        ))}
      </div>
    </section>
  );
}
