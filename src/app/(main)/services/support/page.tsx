
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LifeBuoy, Clock, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <header className="text-center mb-12">
        <LifeBuoy className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">
          Soporte Técnico 24/7 para tu Empresa
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Mantén la continuidad de tu negocio con nuestro servicio de soporte técnico especializado. Nos aseguramos de que tus sistemas estén siempre operativos para que tú te enfoques en crecer.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <Card className="text-center">
          <CardHeader>
            <Clock className="mx-auto h-10 w-10 text-primary mb-3" />
            <CardTitle>Disponibilidad Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Nuestro equipo está disponible 24/7 para atender cualquier incidencia, sin importar la hora o el día.</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardHeader>
            <Zap className="mx-auto h-10 w-10 text-primary mb-3" />
            <CardTitle>Respuesta Rápida</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Garantizamos tiempos de respuesta mínimos para diagnosticar y comenzar a resolver tu problema de inmediato.</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardHeader>
            <ShieldCheck className="mx-auto h-10 w-10 text-primary mb-3" />
            <CardTitle>Soporte Proactivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No solo resolvemos problemas; monitoreamos tus sistemas para prevenir futuras fallas antes de que ocurran.</p>
          </CardContent>
        </Card>
      </div>

       <div className="relative p-8 md:p-12 rounded-lg bg-secondary/30 overflow-hidden">
         <div className="relative z-10 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para tener tranquilidad total?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Nuestros planes de soporte se adaptan a las necesidades y tamaño de tu empresa. Contáctanos para diseñar un plan a tu medida y olvídate de las emergencias de sistemas.
          </p>
          <a
            href="https://wa.me/5219999040931?text=Hola,%20estoy%20interesado%20en%20sus%20planes%20de%20soporte%20técnico%2024/7."
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg">
              Contactar por WhatsApp
            </Button>
          </a>
         </div>
       </div>
    </div>
  );
}
