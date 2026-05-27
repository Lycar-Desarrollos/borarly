
import { ShieldCheck, Clock, Mail, Truck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DevolucionesPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8 font-bold text-primary">BORARLY</div>
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Button>
        </Link>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight mb-4">Política de Devoluciones y Reembolsos</h1>
      <p className="text-muted-foreground text-lg mb-8">
        En BORARLY, nuestra prioridad es tu satisfacción. Aquí detallamos los términos para procesar devoluciones y reembolsos de manera transparente.
      </p>

      <div className="grid gap-8">
        {/* Plazo */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Plazo de Devolución</h2>
          </div>
          <p className="text-muted-foreground">
            Cuentas con un plazo de <strong>5 días naturales</strong> a partir de la recepción de tu producto para solicitar una devolución. 
          </p>
        </div>

        {/* Condiciones */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Condiciones del Producto</h2>
          </div>
          <p className="text-muted-foreground">
            Para que una devolución sea aceptada, el producto debe estar en las mismas condiciones en que fue recibido:
          </p>
          <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground">
            <li>Debe ser un producto completamente nuevo.</li>
            <li>Debe contar con su empaque original sin daños graves.</li>
            <li>Debe incluir todos sus accesorios, manuales y pólizas de garantía.</li>
          </ul>
        </div>

        {/* Método y Costo */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Método y Gastos de Envío</h2>
          </div>
          <p className="text-muted-foreground">
            Las devoluciones se gestionan vía <strong>correo postal/paquetería</strong>. 
          </p>
          <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground">
            <li><strong>Etiqueta de devolución:</strong> Incluida en el paquete sin coste adicional.</li>
            <li><strong>Gastos de envío:</strong> Sin coste para el cliente en caso de defectos de fábrica o errores en el envío.</li>
            <li><strong>Tarifas de aprovisionamiento:</strong> No aplicamos cargos por reabastecimiento (Restocking fee).</li>
          </ul>
        </div>

        {/* Reembolso */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Procesamiento de Reembolso</h2>
          </div>
          <p className="text-muted-foreground">
            Una vez recibido y verificado el estado del producto en nuestro almacén, procederemos con el reembolso. El tiempo de procesamiento del reembolso es de aproximadamente <strong>15 días hábiles</strong>. El monto será devuelto al método original de pago.
          </p>
        </div>
      </div>

      <footer className="mt-12 pt-8 border-t text-sm text-muted-foreground">
        <p>¿Tienes dudas? Contáctanos a través de nuestro soporte oficial para asistencia inmediata en <strong>ventas@BORARLY.com</strong>.</p>
        <p className="mt-2">&copy; {new Date().getFullYear()} BORARLY Mayorista Tecnológico.</p>
      </footer>
    </div>
  );
}
