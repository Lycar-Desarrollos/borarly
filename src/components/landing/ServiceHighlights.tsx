"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Globe, GraduationCap, Cpu, Headphones, ArrowRight, Sparkles, 
  ShieldCheck, CheckCircle2, Layers, Award, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
  features: string[];
  href: string;
  gradient: string;
}

const BORARLY_SERVICES: ServiceCard[] = [
  {
    id: 'web',
    title: 'Servicios Web & E-Commerce',
    subtitle: 'Desarrollo & Integraciones API',
    description: 'Creamos plataformas digitales de venta B2B y B2C integradas directamente con catálogos e inventarios en tiempo real.',
    icon: <Globe className="w-7 h-7 text-sky-400" />,
    badge: 'Digitalización',
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    features: ['Integración API Syscom', 'Catálogo Automatizado', 'Pasarelas de Pago Seguras'],
    href: '/services/web',
    gradient: 'from-sky-950/40 via-card to-card hover:border-sky-500/50'
  },
  {
    id: 'certifications',
    title: 'Capacitación & Certificaciones',
    subtitle: 'Academia Técnica & Constancias DC-3',
    description: 'Programas de certificación oficial presencial y online en marcas líderes como Hikvision, Ubiquiti, Ruijie y Epcom para integradores.',
    icon: <GraduationCap className="w-7 h-7 text-amber-400" />,
    badge: 'Certificación',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    features: ['Certificaciones Hikvision HCSA', 'Cursos Ubiquiti & Ruijie', 'Constancias Oficiales DC-3'],
    href: '/services/certifications',
    gradient: 'from-amber-950/40 via-card to-card hover:border-amber-500/50'
  },
  {
    id: 'value-projects',
    title: 'Proyectos de Valor',
    subtitle: 'Ingeniería & Consultoría',
    description: 'Acompañamiento especializado en el dimensionamiento, licitaciones y diseño de infraestructuras críticas de seguridad y redes.',
    icon: <Cpu className="w-7 h-7 text-indigo-400" />,
    badge: 'Especializado',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    features: ['Diseño de Redes y CCTV', 'Estudios de Cobertura RF', 'Proyectos Solares Industriales'],
    href: '/services/value-projects',
    gradient: 'from-indigo-950/40 via-card to-card hover:border-indigo-500/50'
  },
  {
    id: 'support',
    title: 'Soporte Técnico 24/7',
    subtitle: 'Ingeniería de Campo Certificada',
    description: 'Centro de soporte técnico directo para configuración remota, diagnóstico de fallas, garantías oficiales y capacitación de producto.',
    icon: <Headphones className="w-7 h-7 text-emerald-400" />,
    badge: 'Atención Directa',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    features: ['Asesoría en Tiempo Real', 'Configuración Remota', 'Gestión de Garantías Directa'],
    href: '/services/support',
    gradient: 'from-emerald-950/40 via-card to-card hover:border-emerald-500/50'
  }
];

export function ServiceHighlights() {
  return (
    <section className="w-full py-8 space-y-6">
      
      {/* Header de la Sección */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ecosistema de Soluciones</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Servicios Integrales Borarly
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl">
            Más que un distribuidor de tecnología: tu socio estratégico en ingeniería, certificaciones, desarrollo y soporte continuo.
          </p>
        </div>

        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors group self-start md:self-auto"
        >
          <span>Conocer todos los servicios</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Grid de Tarjetas de Servicios Grandes y Espaciosas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {BORARLY_SERVICES.map((service) => (
          <Link 
            key={service.id} 
            href={service.href}
            className="group block h-full focus:outline-none"
          >
            <div className={cn(
              "h-full p-6 sm:p-7 rounded-3xl bg-gradient-to-b border border-border/80 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 flex flex-col justify-between relative overflow-hidden",
              service.gradient
            )}>
              
              {/* Contenido Superior */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-background/80 backdrop-blur-md border border-border/60 shadow-xs group-hover:scale-110 transition-transform">
                    {service.icon}
                  </div>
                  <span className={cn("text-[10px] font-black uppercase px-2.5 py-1 rounded-full border", service.badgeColor)}>
                    {service.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                    {service.subtitle}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                  {service.description}
                </p>

                {/* Features List */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  {service.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-medium text-foreground/90">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón Inferior */}
              <div className="pt-6 mt-4 border-t border-border/40 flex items-center justify-between text-xs font-bold text-primary group-hover:underline">
                <span>Explorar Solución</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>

            </div>
          </Link>
        ))}
      </div>

    </section>
  );
}
