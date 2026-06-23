import type { Metadata } from 'next';
import { Building2, MapPin, Phone, Mail, ShieldCheck, Clock, Award, Users, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Quiénes Somos | Borarly Mayorista',
  description: 'Conoce a Borarly: distribuidor mayorista de seguridad electrónica, videovigilancia, redes y telecomunicaciones en Yucatán, México. Más de 10 años de experiencia.',
  alternates: {
    canonical: 'https://borarly.com/nosotros',
  },
};

export default function NosotrosPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Button>
        </Link>
      </div>

      <div className="mb-8 font-bold text-primary">BORARLY</div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-4">Quiénes Somos</h1>
      <p className="text-muted-foreground text-lg mb-8">
        Somos un distribuidor mayorista especializado en seguridad electrónica, videovigilancia, redes y telecomunicaciones con sede en Yucatán, México.
      </p>

      <div className="grid gap-8">
        {/* Nuestra Empresa */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Nuestra Empresa</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Borarly es una empresa mexicana con más de <strong>10 años de experiencia</strong> en la distribución mayorista de equipos de seguridad electrónica, sistemas de videovigilancia, redes de datos y telecomunicaciones. Trabajamos directamente con los principales fabricantes del mundo como Hikvision, Epcom, SFIRE y más, garantizando productos originales con garantía de fábrica.
          </p>
          <p className="text-muted-foreground">
            Nuestro compromiso es ofrecer a nuestros clientes — integradores, instaladores y empresas — la mejor relación precio-calidad del mercado, respaldados por soporte técnico especializado y logística eficiente a toda la República Mexicana.
          </p>
        </div>

        {/* Datos Fiscales */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Datos Fiscales</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground font-medium">Razón Social / Titular</p>
              <p className="font-semibold">Edgar Ydalimir Arevalo Escobedo</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">RFC</p>
              <p className="font-semibold">AEEE991122MA7</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Régimen Fiscal</p>
              <p className="font-semibold">Persona Física con Actividad Empresarial</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Inicio de Operaciones</p>
              <p className="font-semibold">22 de Junio de 2021</p>
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Ubicación y Contacto</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Dirección</p>
                  <p className="text-muted-foreground text-sm">
                    Calle 8 C por 21, No. 105<br />
                    Fracc. San Ángel, Kanasín<br />
                    Yucatán, México, C.P. 97370
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Horario de Atención</p>
                  <p className="text-muted-foreground text-sm">24 horas, los 7 días de la semana</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Teléfono / WhatsApp</p>
                  <a href="https://wa.me/5219999040931" target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">
                    +52 1 999 904 0931
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Correo Electrónico</p>
                  <a href="mailto:ventas@borarly.com" className="text-sm text-primary hover:underline">
                    ventas@borarly.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Por qué elegirnos */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">¿Por Qué Elegir Borarly?</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Productos 100% originales con garantía de fábrica',
              'Precios mayoristas competitivos',
              'Envíos a toda la República Mexicana',
              'Soporte técnico especializado 24/7',
              'Facturación electrónica (CFDI)',
              'Más de 1,500 productos en catálogo',
              'Distribuidor autorizado de marcas líderes',
              'Atención personalizada por WhatsApp',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-1" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nuestro Modelo de Negocio */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Nuestro Modelo de Negocio</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Operamos como <strong>distribuidor mayorista</strong>, lo que significa que compramos directamente a fabricantes y distribuidores autorizados para ofrecer los mejores precios del mercado. Nuestros clientes principales son:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground ml-4">
            <li>• <strong>Integradores de seguridad electrónica</strong> que instalan sistemas de videovigilancia</li>
            <li>• <strong>Empresas de telecomunicaciones</strong> que requieren equipo de redes</li>
            <li>• <strong>Instaladores independientes</strong> de CCTV y alarmas</li>
            <li>• <strong>Empresas y gobiernos</strong> que necesitan equipar sus instalaciones</li>
            <li>• <strong>Público en general</strong> que busca equipo de seguridad de calidad</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Todos los productos son <strong>nuevos, sellados y con garantía</strong>. No vendemos productos usados ni reacondicionados.
          </p>
        </div>
      </div>

      {/* CTA Final */}
      <div className="mt-12 text-center space-y-4">
        <p className="text-muted-foreground">¿Tienes preguntas? Estamos para ayudarte.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <a
            href="https://wa.me/5219999040931?text=Hola,%20me%20gustaría%20conocer%20más%20sobre%20Borarly."
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="gap-2">
              <Phone className="w-4 h-4" /> Contáctanos por WhatsApp
            </Button>
          </a>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              Ver Catálogo de Productos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
