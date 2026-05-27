
import { Truck, Globe, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EnviosPage() {
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
      <h1 className="text-4xl font-extrabold tracking-tight mb-4">Política de Envíos y Logística</h1>
      <p className="text-muted-foreground text-lg mb-8">
        En BORARLY, nos esforzamos por que tus equipos lleguen de forma segura y rápida a cualquier rincón de México.
      </p>

      <div className="grid gap-8">
        {/* Cobertura */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Cobertura Nacional</h2>
          </div>
          <p className="text-muted-foreground">
            Realizamos envíos a toda la República Mexicana a través de las paqueterías líderes (FedEx, Estafeta, DHL, Paquetexpress). Nuestra logística está optimizada para llegar tanto a grandes ciudades como a zonas remotas.
          </p>
        </div>

        {/* Tiempo de entrega */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Tiempos de Entrega</h2>
          </div>
          <p className="text-muted-foreground">
            El tiempo promedio de entrega es de <strong>2 a 5 días hábiles</strong> una vez confirmado el pago. 
          </p>
          <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground">
            <li><strong>Procesamiento:</strong> Los pedidos pagados antes de las 13:00 hrs (CST) se procesan el mismo día.</li>
            <li><strong>Rastreo:</strong> Recibirás un código de seguimiento vía correo electrónico en cuanto tu paquete sea recolectado.</li>
          </ul>
        </div>

        {/* Costos */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Costos de Envío</h2>
          </div>
          <p className="text-muted-foreground">
            Calculamos el costo de envío basándonos en el peso y dimensiones de tu pedido, así como en el destino.
          </p>
          <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground">
            <li><strong>Envío Estándar:</strong> Calculado dinámicamente en el checkout.</li>
            <li><strong>Promociones:</strong> Ocasionalmente contamos con promociones de "Envío Gratis" en compras que superen un monto determinado (ver banners informativos en la tienda).</li>
          </ul>
        </div>

        {/* Seguridad */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Seguro y Empaque</h2>
          </div>
          <p className="text-muted-foreground">
            Todos nuestros envíos viajan protegidos. Es responsabilidad del cliente revisar el estado físico del paquete al recibirlo y reportar cualquier anomalía en la guía de la paquetería para poder hacer válido el seguro.
          </p>
        </div>
      </div>

      <footer className="mt-12 pt-8 border-t text-sm text-muted-foreground">
        <p>¿Necesitas una entrega urgente o recolección en sucursal? Contáctanos antes de realizar tu compra.</p>
        <p className="mt-2">&copy; {new Date().getFullYear()} BORARLY Mayorista Tecnológico.</p>
      </footer>
    </div>
  );
}
