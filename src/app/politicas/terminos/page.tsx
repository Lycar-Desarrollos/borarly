
import { Scale, Users, ShoppingBag, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TerminosPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Button>
        </Link>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight mb-4">Términos y Condiciones de Uso</h1>
      <p className="text-muted-foreground text-lg mb-8">
        Bienvenido a BORARLY. Al acceder y utilizar nuestro sitio web, usted acepta cumplir con los siguientes términos y condiciones.
      </p>

      <div className="space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Registro y Uso de Cuenta</h2>
          </div>
          <p className="text-muted-foreground">
            El acceso a ciertos servicios y precios de mayorista puede requerir la creación de una cuenta. Usted es responsable de mantener la confidencialidad de su cuenta y contraseña. BORARLY se reserva el derecho de rechazar servicios o cancelar cuentas a su discreción.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Productos y Precios</h2>
          </div>
          <p className="text-muted-foreground">
            Los precios y la disponibilidad de los productos están sujetos a cambios sin previo aviso. Debido a la naturaleza dinámica del inventario tecnológico, si un producto ordenado no está disponible, se notificará al cliente para ofrecer una alternativa o el reembolso íntegro.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Limitación de Responsabilidad</h2>
          </div>
          <p className="text-muted-foreground">
            BORARLY no será responsable por daños indirectos, incidentales o consecuentes que resulten del uso o la imposibilidad de uso de la tienda o de los productos adquiridos. La garantía de los productos es limitada a los términos ofrecidos por el fabricante.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Legislación Aplicable</h2>
          </div>
          <p className="text-muted-foreground">
            Cualquier controversia derivada del uso de este sitio web será resuelta bajo las leyes vigentes en el Estado de Yucatán, México, renunciando a cualquier otra jurisdicción que pudiera corresponder.
          </p>
        </section>
      </div>

      <footer className="mt-12 pt-8 border-t text-sm text-muted-foreground text-center">
        <p>Última actualización: Abril 2024</p>
        <p className="mt-2 text-xs">Si tiene dudas sobre estos términos, por favor contáctenos antes de realizar su compra.</p>
        <p className="mt-4">&copy; BORARLY Mayorista Tecnológico.</p>
      </footer>
    </div>
  );
}
