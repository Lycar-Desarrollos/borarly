import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Globe, Bot, Cpu, Headphones, ArrowRight, CheckCircle2, 
  Sparkles, ShieldCheck, MapPin, Truck, Award, Zap, PhoneCall, 
  MessageCircle, Mail, ChevronRight, Layers, FileCheck, Users, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Servicios & Soluciones Tecnológicas | Borarly Mayorista',
  description: 'Conoce los servicios integrales de Borarly: Desarrollo Web & E-Commerce, Chatbots y Agentes de IA 24/7, Proyectos de Valor e Ingeniería, y Soporte Técnico 24/7 en México.',
};

const SERVICES_DETAILED = [
  {
    id: 'web',
    title: 'Desarrollo Web & Integración de Catálogos E-Commerce',
    badge: 'Digitalización Mayorista',
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    description: 'Transformamos tu negocio de seguridad y redes en una tienda digital automatizada. Conectamos tu plataforma directamente con las APIs de Syscom para sincronizar precios, stock y fichas técnicas en tiempo real.',
    icon: <Globe className="w-8 h-8 text-sky-400" />,
    features: [
      'Integración directa con API de Syscom para actualización de stock en vivo.',
      'Plataformas B2B y B2C optimizadas para alta conversión y velocidad.',
      'Pasarelas de pago seguras (Stripe, Mercado Pago, Transferencias SPEI).',
      'Facturación automática con timbrado CFDI 4.0 para clientes mayoristas.'
    ],
    ctaText: 'Ver detalles de servicios web',
    href: '/services/web',
    gradient: 'from-sky-950/30 via-background to-card'
  },
  {
    id: 'chatbots',
    title: 'Chatbots & Agentes de IA 24/7 para Empresas',
    badge: 'Automatización & IA',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'Tu propio agente de inteligencia artificial privado, siempre activo las 24 horas del día. Atiende consultas, cotiza productos en tiempo real con tu catálogo y automatiza tus ventas, incluso mientras duermes.',
    icon: <Bot className="w-8 h-8 text-purple-400" />,
    features: [
      'Configuración instantánea: Puesto en marcha en minutos, sin jerga técnica ni complejidad.',
      'Mantenimiento cero: Nos encargamos de la seguridad, servidores, actualizaciones y respaldos.',
      'Atención multicanal: Integración nativa con WhatsApp Business, Telegram y Web Chat.',
      'Catálogo y cotizador en vivo: Respuestas con precios, existencias y fichas técnicas en segundos.'
    ],
    ctaText: 'Ver detalles de agentes de IA y chatbots',
    href: '/services/chatbots',
    gradient: 'from-purple-950/30 via-background to-card'
  },
  {
    id: 'value-projects',
    title: 'Ingeniería de Proyectos & Consultoría Especializada',
    badge: 'Proyectos de Valor',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    description: 'Te acompañamos desde el anteproyecto hasta la entrega final en licitaciones y proyectos de gran escala. Diseñamos memorias de cálculo, planos y listas de materiales (BOM) con especificaciones exactas.',
    icon: <Cpu className="w-8 h-8 text-indigo-400" />,
    features: [
      'Estudios de línea de vista y cobertura de radiofrecuencia (RF) para enlaces inalámbricos.',
      'Dimensionamiento de sistemas de videovigilancia urbana y perimetral.',
      'Cálculo de sistemas fotovoltaicos aislados e interconectados de alta potencia.',
      'Acompañamiento técnico en carpetas para licitaciones públicas y privadas.'
    ],
    ctaText: 'Ver ingeniería de proyectos',
    href: '/services/value-projects',
    gradient: 'from-indigo-950/30 via-background to-card'
  },
  {
    id: 'support',
    title: 'Mesa de Ayuda, Laboratorio & Soporte Técnico 24/7',
    badge: 'Atención Directa',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Centro de ingeniería post-venta dedicado a resolver incidencias en sitio o de forma remota. Asistencia paso a paso en configuraciones de red, firmware, DVRs, NVRs y gestión ágil de garantías.',
    icon: <Headphones className="w-8 h-8 text-emerald-400" />,
    features: [
      'Acceso directo a ingenieros de soporte certificados vía WhatsApp y teléfono.',
      'Sesiones de configuración remota y puesta a punto de equipos.',
      'Gestión integral y acelerada de garantías (RMA) directamente con fabricante.',
      'Descarga de firmwares oficiales, manuales de instalación y diagramas.'
    ],
    ctaText: 'Contactar a soporte técnico',
    href: '/services/support',
    gradient: 'from-emerald-950/30 via-background to-card'
  }
];

const METRICS = [
  { value: '14+', label: 'Almacenes Nacionales', sub: 'Centros logísticos en México' },
  { value: '30,000+', label: 'Productos en Catálogo', sub: 'Disponibilidad en tiempo real' },
  { value: '24-48 hrs', label: 'Tiempos de Entrega', sub: 'Envíos asegurados a todo el país' },
  { value: '100%', label: 'Garantía Oficial', sub: 'Soporte directo de fabricante' }
];

export default function ServicesPage() {
  return (
    <div className="space-y-12 sm:space-y-16 py-6 sm:py-10">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0e1628] via-[#090d16] to-[#090d16] border border-blue-500/20 p-8 sm:p-14 lg:p-16">
        
        {/* Glow de Fondo */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-blue-400">Servicios & Alcance</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Ecosistema de Soluciones Integrales</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Nuestros Servicios & Alcance Tecnológico
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
            En <strong>Borarly Mayorista</strong> no solo comercializamos equipamiento de última generación: respaldamos a integradores, instaladores y corporativos con servicios integrales de ingeniería, capacitación, desarrollo e infraestructura en todo México.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <a 
              href="https://wa.me/5219999040931?text=Hola%2C%20me%20gustar%C3%ADa%20solicitar%20asesor%C3%ADa%20sobre%20los%20servicios%20de%20Borarly"
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/25 transition-all hover:scale-105"
            >
              <MessageCircle className="w-4.5 h-4.5" />
              <span>Solicitar Asesoría de Proyectos</span>
            </a>

            <a 
              href="#servicios"
              className="px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition-all"
            >
              <span>Explorar Soluciones</span>
            </a>
          </div>

        </div>

      </section>

      {/* 2. MÉTRICAS DE ALCANCE NACIONAL */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {METRICS.map((metric, idx) => (
          <div key={idx} className="p-6 rounded-3xl bg-card border border-border/80 text-center space-y-1 shadow-xs hover:border-primary/50 transition-colors">
            <div className="text-2xl sm:text-4xl font-black text-primary tracking-tight">
              {metric.value}
            </div>
            <div className="text-xs sm:text-sm font-bold text-foreground">
              {metric.label}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {metric.sub}
            </div>
          </div>
        ))}
      </section>

      {/* 3. LOS 4 PILARES DE SERVICIOS DETALLADOS */}
      <section id="servicios" className="space-y-8">
        
        <div className="border-b border-border/60 pb-4">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Pilares de Servicio y Cobertura
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cada solución está diseñada para maximizar el retorno de inversión y la confiabilidad técnica de tus proyectos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SERVICES_DETAILED.map((service) => (
            <div 
              key={service.id} 
              className={`p-8 rounded-3xl bg-gradient-to-b ${service.gradient} border border-border/80 hover:border-primary/50 shadow-md transition-all duration-300 flex flex-col justify-between space-y-6 group`}
            >
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3.5 rounded-2xl bg-card border border-border/80 group-hover:scale-110 transition-transform shadow-xs">
                    {service.icon}
                  </div>
                  <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${service.badgeColor}`}>
                    {service.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                </div>

                <p className="text-sm text-foreground/85 leading-relaxed">
                  {service.description}
                </p>

                {/* Features */}
                <div className="space-y-2.5 pt-3 border-t border-border/40">
                  {service.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de Enlace */}
              <div className="pt-4 border-t border-border/40">
                <Link 
                  href={service.href}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:text-primary/80 group-hover:translate-x-1 transition-all"
                >
                  <span>{service.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          ))}
        </div>

      </section>

      {/* 4. BANNER DE CONTACTO DIRECTO DE PROYECTOS */}
      <section className="rounded-3xl bg-gradient-to-r from-blue-950 via-[#0a0f1d] to-indigo-950 border border-blue-500/30 p-8 sm:p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl">
        
        <div className="space-y-3 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Mesa de Ingeniería & Cotizaciones</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            ¿Tienes un proyecto en puerta o requieres apoyo técnico?
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Platica directamente con nuestro equipo de ingenieros para recibir orientación técnica, listas de materiales sugeridas y precios preferenciales de mayoreo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full lg:w-auto">
          <a
            href="https://wa.me/5219999040931?text=Hola%2C%20deseo%20cotizar%20un%20proyecto%20de%20ingenier%C3%ADa%20con%20Borarly"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 transition-all hover:scale-105"
          >
            <MessageCircle className="w-5 h-5 fill-white/20" />
            <span>WhatsApp de Proyectos</span>
          </a>

          <a
            href="mailto:ventas@borarly.com"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 flex items-center justify-center gap-2 transition-all"
          >
            <Mail className="w-4.5 h-4.5" />
            <span>ventas@borarly.com</span>
          </a>
        </div>

      </section>

    </div>
  );
}
