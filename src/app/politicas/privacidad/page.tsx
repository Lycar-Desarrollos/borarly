import type { Metadata } from 'next';

import { Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Aviso de Privacidad',
  description: 'Aviso de privacidad de Borarly Mayorista. Conoce cómo protegemos y usamos tus datos personales conforme a la LFPDPPP.',
};

export default function PrivacidadPage() {
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
      <h1 className="text-4xl font-extrabold tracking-tight mb-4">Aviso de Privacidad</h1>
      <p className="text-muted-foreground text-lg mb-8">
        En Borarly, respetamos tu privacidad y protegemos tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
      </p>

      <div className="space-y-10">
        <section>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Responsable de los Datos</h2>
          </div>
          <p className="text-muted-foreground">
            Borarly Mayorista Tecnológico, con domicilio comercial en Yucatán, México, es responsable de recabar sus datos personales, del uso que se le dé a los mismos y de su protección.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Finalidad del Tratamiento</h2>
          </div>
          <p className="text-muted-foreground">
            Sus datos personales serán utilizados para:
          </p>
          <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground">
            <li>Procesar y dar seguimiento a sus pedidos de compra.</li>
            <li>Realizar la facturación CFDI correspondiente.</li>
            <li>Brindar soporte técnico y servicio post-venta.</li>
            <li>Enviar información sobre promociones o nuevos productos (si usted lo autoriza).</li>
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Seguridad de la Información</h2>
          </div>
          <p className="text-muted-foreground">
            Implementamos medidas de seguridad administrativas, técnicas y físicas para proteger sus datos personales contra daño, pérdida, alteración, destrucción o el uso, acceso o tratamiento no autorizado. Todas las transacciones de pago están encriptadas bajo protocolos de seguridad internacional.
          </p>
        </section>

        <section className="bg-muted/30 p-8 rounded-3xl border">
          <h2 className="text-xl font-bold mb-4">Derechos ARCO</h2>
          <p className="text-muted-foreground text-sm">
            Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales. Para ejercer estos derechos, puede enviar una solicitud por escrito a nuestro departamento de datos personales al correo: <strong>ventas@borarly.com</strong>.
          </p>
        </section>
      </div>

      <footer className="mt-12 pt-8 border-t text-sm text-muted-foreground text-center">
        <p>Última actualización: Abril 2024</p>
        <p className="mt-2">&copy; Borarly Mayorista Tecnológico.</p>
      </footer>
    </div>
  );
}
