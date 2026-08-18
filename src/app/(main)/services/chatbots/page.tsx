import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Bot, Sparkles, CheckCircle2, ChevronRight, MessageCircle, 
  ShieldCheck, Zap, Clock, MessageSquare, Send, Cpu, 
  Workflow, ArrowRight, Database, PhoneCall, Headphones, Check, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Chatbots & Agentes de IA 24/7 para Empresas | Borarly',
  description: 'Tu propio agente de inteligencia artificial privado, siempre activo las 24 horas del día. Automatiza ventas, cotizaciones en tiempo real y atención en WhatsApp y Web.',
};

const PILLARS = [
  {
    icon: <Zap className="w-8 h-8 text-purple-400" />,
    title: "Configuración Instantánea",
    description: "Increíblemente fácil de implementar y poner en marcha. Sin jerga técnica ni configuraciones complicadas: solo un camino rápido hacia tu primera automatización de ventas y soporte."
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
    title: "Mantenimiento Cero",
    description: "Servicio 100% gestionado. Nos encargamos de la infraestructura, seguridad, actualizaciones, modelos de IA y copias de seguridad. Tu agente se mantiene activo 24/7 sin intervención manual."
  },
  {
    icon: <Database className="w-8 h-8 text-sky-400" />,
    title: "Herramientas & Catálogo Integrado",
    description: "Conexión directa con tu catálogo de productos, inventario en tiempo real, precios, fichas técnicas, navegación web y captura de prospectos con notificación directa a tu equipo."
  }
];

const INCLUDED_FEATURES = [
  { title: "Listo para usar", desc: "Despliegue rápido con prompts y flujos comerciales optimizados para tu sector." },
  { title: "Cero mantenimiento", desc: "Infraestructura, servidores cloud y modelos de IA totalmente administrados." },
  { title: "Conexión con WhatsApp & Telegram", desc: "Atención inmediata en las aplicaciones de mensajería más utilizadas por tus clientes." },
  { title: "Catálogo & Precios en Vivo", desc: "Consulta automática de existencias, modelos, marcas y cotizaciones instantáneas." },
  { title: "Modelos de IA de Última Generación", desc: "Impulsado por los mejores modelos (ChatGPT / Claude / Gemini) con razonamiento avanzado." },
  { title: "Captura y Calificación de Leads", desc: "Recopila nombre, teléfono, correo y requerimientos para enviarlos a tu CRM o asesores." },
  { title: "Transferencia a Asesor Humano", desc: "Deriva conversaciones complejas a tu equipo de ventas cuando el cliente lo requiera." },
  { title: "Privacidad y Seguridad Blindada", desc: "Tus datos comerciales y las conversaciones de tus clientes se mantienen 100% privados." }
];

const PLANS = [
  {
    name: "Starter Web Bot",
    badge: "Ideal para Sitios Web",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    description: "Agente de IA integrado en tu tienda online o página web para responder dudas frecuentes y guiar a tus visitantes.",
    features: [
      "Widget de Chat Web personalizado",
      "Entrenamiento con la información de tu empresa",
      "Respuestas inteligentes 24/7",
      "Captura de prospectos (Nombre, Email, Teléfono)",
      "Mantenimiento y servidores incluidos",
      "Soporte técnico por correo y WhatsApp"
    ],
    ctaText: "Cotizar Starter Web",
    highlight: false,
    waMessage: "Hola, me interesa información sobre el Plan Starter Web Bot de Borarly."
  },
  {
    name: "Comercial WhatsApp Pro",
    badge: "Más Popular",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    description: "Agente autónomo conectado a tu línea de WhatsApp Business con cotizador inteligente y catálogo en vivo.",
    features: [
      "Integración directa con WhatsApp Business API / Telegram",
      "Conexión a Catálogo de Productos y Precios en tiempo real",
      "Cotizador automático en PDF o mensaje estructurado",
      "Calificación de clientes y alertas a ejecutivos de venta",
      "Sin límite de horarios: atiende incluso mientras duermes",
      "Panel de control con métricas de conversaciones",
      "Actualizaciones continuas y soporte prioritario"
    ],
    ctaText: "Cotizar WhatsApp Pro",
    highlight: true,
    waMessage: "Hola, me interesa implementar el Plan Comercial WhatsApp Pro con cotizador para mi empresa."
  },
  {
    name: "Enterprise & A la Medida",
    badge: "Proyectos Corporativos",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    description: "Sistemas avanzados de automatización con IA, integración a ERP, CRM, APIs personalizadas y flujos de trabajo complejos.",
    features: [
      "Múltiples canales: WhatsApp, Telegram, Web, Instagram, Email",
      "Integración profunda con ERP (SAP, Microsip, Syscom API)",
      "Creación de órdenes de compra y facturación asistida",
      "Modelos de IA afinados con terminología especializada",
      "Acuerdo de Nivel de Servicio (SLA) 99.9%",
      "Ingeniero de automatización dedicado"
    ],
    ctaText: "Consultar Solución Enterprise",
    highlight: false,
    waMessage: "Hola, necesito una propuesta Enterprise de Agentes de IA y automatizaciones a la medida para mi empresa."
  }
];

export default function ChatbotsPage() {
  return (
    <div className="space-y-12 sm:space-y-16 py-6 sm:py-10">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1c1033] via-[#0c0d18] to-[#090d16] border border-purple-500/30 p-8 sm:p-14 lg:p-16 text-white shadow-2xl">
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/services" className="hover:text-white transition-colors">Servicios</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-purple-400">Chatbots & Agentes de IA</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Automatización & Agentes Inteligentes 24/7</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Tu propio Agente de IA. <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Privado, siempre activo y disponible 24/7.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
            Instálalo una sola vez y se encargará de atender clientes, calificar prospectos, responder dudas técnicas y cotizar productos de tu catálogo las 24 horas del día, <strong>incluso mientras duermes</strong>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <a 
              href="https://wa.me/5219999040931?text=Hola%2C%20me%20interesa%20implementar%20un%20Chatbot%20o%20Agente%20de%20IA%20para%20mi%20empresa%20con%20Borarly"
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-4.5 h-4.5" />
              <span>Solicitar Demostración en WhatsApp</span>
            </a>

            <a 
              href="#planes"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-200 font-bold text-sm border border-white/10 transition-colors"
            >
              <span>Ver Planes & Opciones</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Micro badges */}
          <div className="pt-3 flex flex-wrap items-center gap-6 text-xs text-zinc-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sin jerga técnica ni complejidad</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Cero mantenimiento de servidores</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Conexión con tu catálogo en vivo</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LOS 3 PILARES FUNDAMENTALES */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            Inteligencia Artificial Potente, Simple y Sin Fricción
          </h2>
          <p className="text-sm text-muted-foreground">
            Diseñamos e implementamos agentes de IA listos para producir resultados comerciales desde el primer día.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS.map((pillar, idx) => (
            <Card key={idx} className="p-7 rounded-3xl bg-card border-border/70 hover:border-purple-500/40 transition-all hover:shadow-lg space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 w-fit">
                {pillar.icon}
              </div>
              <h3 className="text-lg font-black text-foreground">
                {pillar.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {pillar.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. TODO LO QUE INCLUYE TU AGENTE (GRID DE CARACTERÍSTICAS) */}
      <section className="p-8 sm:p-12 rounded-3xl bg-card/60 border border-border/70 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-purple-400 tracking-wider">
              Ecosistema Integral
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              Todo Incluido en tu Solución de Agente de IA
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Sin costos ocultos ni complicaciones técnicas. Te entregamos un agente completamente afinado y listo para operar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {INCLUDED_FEATURES.map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-background/70 border border-border/60 space-y-2 hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-2 font-black text-sm text-foreground">
                <Check className="w-4 h-4 text-purple-500 shrink-0 stroke-[3]" />
                <h4>{item.title}</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PLANES Y MODELOS DE IMPLEMENTACIÓN */}
      <section id="planes" className="space-y-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-black uppercase text-purple-400 tracking-wider">
            Planes a Tu Medida
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            Selecciona la Solución Perfecta para tu Negocio
          </h2>
          <p className="text-sm text-muted-foreground">
            Inicia con un asistente web o escala hacia un agente comercial completo para WhatsApp integrado a tu catálogo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan, idx) => (
            <div 
              key={idx}
              className={`rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 border ${
                plan.highlight 
                  ? 'bg-gradient-to-b from-purple-950/40 via-card to-card border-purple-500/60 shadow-xl shadow-purple-950/20 ring-2 ring-purple-500/30' 
                  : 'bg-card border-border/70 hover:border-border'
              }`}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                  {plan.highlight && (
                    <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Recomendado
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Incluye:
                  </p>
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
                      <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón Cotizar Plan */}
              <div className="pt-8">
                <a
                  href={`https://wa.me/5219999040931?text=${encodeURIComponent(plan.waMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                    plan.highlight
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/25'
                      : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{plan.ctaText}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CTA BANNER FINAL */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-zinc-950 border border-purple-500/30 p-8 sm:p-12 text-white text-center space-y-6 shadow-2xl">
        <div className="max-w-2xl mx-auto space-y-3">
          <Bot className="w-12 h-12 text-purple-400 mx-auto animate-bounce" />
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            ¿Listo para automatizar la atención y ventas de tu empresa?
          </h2>
          <p className="text-sm sm:text-base text-zinc-300">
            Agenda una llamada o envíanos un mensaje por WhatsApp. Analizamos tu catálogo y te mostramos una demostración personalizada en menos de 24 horas.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <a
            href="https://wa.me/5219999040931?text=Hola%2C%20quiero%20agendar%20una%20demostraci%C3%B3n%20para%20un%20agente%20de%20IA%20en%20mi%20negocio."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-purple-500 hover:bg-purple-400 text-zinc-950 font-black text-sm shadow-xl shadow-purple-500/30 transition-all hover:scale-105"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Hablar con un Especialista en IA</span>
          </a>
        </div>
      </section>

    </div>
  );
}
