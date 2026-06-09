
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Landmark, Bot } from 'lucide-react';
import Link from 'next/link';

export default function FinancialServicesPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <header className="text-center mb-12">
        <Landmark className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">
          Servicios Financieros y Contables a la Medida
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Optimizamos tus procesos financieros con tecnología de punta, integrando sistemas y desarrollando las herramientas que tu negocio necesita para crecer.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
        <div>
          <h2 className="text-3xl font-bold mb-4">Integración con CONTPAQi y Más</h2>
          <p className="text-muted-foreground mb-6">
            Nos especializamos en conectar tus sistemas existentes, como CONTPAQi, con otras plataformas para automatizar flujos de trabajo, eliminar la entrada de datos manual y obtener una visión unificada de tus finanzas.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <span>Sincronización de catálogos de clientes, productos y proveedores.</span>
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <span>Generación automática de pólizas desde tu E-commerce o CRM.</span>
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <span>Reportes consolidados con información de múltiples fuentes.</span>
            </li>
          </ul>
        </div>
        <div className="relative h-64 md:h-80 rounded-lg overflow-hidden shadow-xl">
           <img src="https://plus.unsplash.com/premium_photo-1661443781814-333019eaad2d?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8ZmluYW56YXN8ZW58MHx8MHx8fDA%3D" alt="Integración de Sistemas Financieros" className="w-full h-full object-cover" data-ai-hint="financial systems integration" />
           <div className="absolute inset-0 bg-primary/20"></div>
        </div>
      </div>

      <Card className="bg-secondary/30">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Bot className="h-7 w-7 mr-3 text-primary"/>
            Programas a la Medida para tus Finanzas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Cuando las soluciones estándar no son suficientes, creamos software financiero a la medida. Desde calculadoras de comisiones complejas hasta dashboards de KPIs en tiempo real, construimos herramientas robustas, seguras y escalables que se adaptan perfectamente a tus reglas de negocio.
          </p>
          <div className="mt-6 text-center">
            <a
              href="https://wa.me/5219999040931?text=Hola,%20quisiera%20saber%20más%20sobre%20sus%20soluciones%20financieras%20personalizadas."
              target="_blank"
              rel="noopener noreferrer"
            >
                <Button size="lg">
                    Contactar por WhatsApp
                </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
