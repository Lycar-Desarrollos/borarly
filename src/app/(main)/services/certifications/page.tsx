import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  GraduationCap, Award, BookOpen, CheckCircle2, ChevronRight, 
  MessageCircle, Sparkles, ShieldCheck, Users, Calendar, Clock
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Capacitaciones & Certificaciones Oficiales | Borarly Mayorista',
  description: 'Programas de certificación oficial Hikvision, Ubiquiti, Ruijie y Epcom para integradores en México. Constancias DC-3 con valor curricular.',
};

const COURSES = [
  {
    title: 'Certificación Oficial Hikvision HCSA-CCTV',
    brand: 'Hikvision Academy',
    duration: '16 Horas · 2 Días',
    modality: 'Presencial / Online en Vivo',
    badge: 'Oficial Hikvision',
    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/30',
    description: 'Aprende la configuración avanzada de cámaras IP, NVRs, analíticas AcuSense, ColorVu, configuración de red, y visualización remota por Hik-Connect y software iVMS-4200.',
    topics: [
      'Arquitectura de red IP y protocolos de streaming.',
      'Configuración de analíticas avanzadas y detección inteligente.',
      'Dimensionamiento de almacenamiento y esquemas RAID.',
      'Examen oficial de certificación con credencial internacional.'
    ]
  },
  {
    title: 'Certificación Especialista en Redes Ubiquiti & Ruijie Reyee',
    brand: 'Ubiquiti / Ruijie',
    duration: '12 Horas · Práctico',
    modality: 'Laboratorio con Equipos Físicos',
    badge: 'Redes Profesionales',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    description: 'Domina el despliegue de redes Wi-Fi empresariales, configuración de VLANs, enlaces inalámbricos punto a punto airMAX y gestión en la nube con Cloud Management.',
    topics: [
      'Topologías de red, switches administrables y alimentación PoE.',
      'Configuración de portales cautivos y segmentación de red.',
      'Estudios de sitio (site survey) y optimización de canales RF.',
      'Monitoreo remoto en la nube y alertas en tiempo real.'
    ]
  },
  {
    title: 'Control de Acceso, Biometría & Reconocimiento Facial',
    brand: 'AccessPRO / ZKTeco',
    duration: '8 Horas · 1 Día',
    modality: 'Presencial con Maqueta Real',
    badge: 'Seguridad Electrónica',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Instalación y puesta en marcha de terminales con biometría facial MinMoe, electroimanes, chapas magnéticas, relevadores y conexión a software de asistencia y control.',
    topics: [
      'Diagramas de conexión eléctrica segura y fuentes de respaldo.',
      'Configuración de horarios, permisos de acceso y reportes.',
      'Integración con torniquetes y barreras vehiculares.',
      'Enrolamiento masivo y sincronización en red.'
    ]
  }
];

export default function CertificationsPage() {
  return (
    <div className="space-y-12 sm:space-y-16 py-6 sm:py-10">
      
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#141026] via-[#090d16] to-[#090d16] border border-amber-500/20 p-8 sm:p-14 text-white">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/services" className="hover:text-white transition-colors">Servicios</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-amber-400">Capacitación & Certificaciones</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Academia Técnica para Integradores</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Capacitaciones & Certificaciones Oficiales
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
            Fortalece el conocimiento técnico de tu empresa. Impartimos cursos certificados y avalados por fabricantes líderes para que ejecutes proyectos de alta complejidad con total respaldo.
          </p>

          <div className="pt-3">
            <a 
              href="https://wa.me/5219999040931?text=Hola%2C%20deseo%20informaci%C3%B3n%20sobre%20las%20pr%C3%B3ximas%20certificaciones%20y%20cursos%20de%20Borarly"
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
            >
              <MessageCircle className="w-4.5 h-4.5" />
              <span>Consultar Calendario de Cursos</span>
            </a>
          </div>
        </div>
      </section>

      {/* Grid de Cursos y Certificaciones */}
      <section className="space-y-8">
        <div className="border-b border-border/60 pb-4">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Cursos Disponibles & Especialidades
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Todos nuestros programas incluyen material didáctico, acceso a laboratorios y constancia con valor curricular.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COURSES.map((course, idx) => (
            <div key={idx} className="p-7 rounded-3xl bg-card border border-border/80 hover:border-amber-500/50 shadow-sm transition-all duration-300 flex flex-col justify-between space-y-5">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${course.badgeColor}`}>
                    {course.badge}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{course.duration}</span>
                  </div>
                </div>

                <h3 className="text-lg font-black text-foreground">
                  {course.title}
                </h3>

                <p className="text-xs text-foreground/80 leading-relaxed">
                  {course.description}
                </p>

                <div className="space-y-2 pt-2 border-t border-border/40">
                  {course.topics.map((t, tIdx) => (
                    <div key={tIdx} className="flex items-start gap-2 text-xs text-foreground/90 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <a
                  href={`https://wa.me/5219999040931?text=Hola%2C%20deseo%20inscribirme%20o%20conocer%20fechas%20del%20curso%3A%20${encodeURIComponent(course.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Solicitar Registro</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
