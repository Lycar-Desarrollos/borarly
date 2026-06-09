
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Scale, Rocket, Users } from 'lucide-react';
import Link from 'next/link';

export default function ValueProjectsPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <header className="text-center mb-12">
        <Star className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">
          Proyectos de Valor en Sistemas
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Somos tu socio tecnológico estratégico, listos para apoyar y ejecutar proyectos de sistemas de cualquier tamaño y complejidad. Tu visión es nuestro plan de acción.
        </p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Scale className="h-10 w-10 text-primary"/>
            <CardTitle>Proyectos de Cualquier Medida</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Desde pequeños scripts de automatización hasta la implementación de un ERP completo, tenemos la experiencia para llevar tu proyecto al éxito.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Rocket className="h-10 w-10 text-primary"/>
            <CardTitle>Metodologías Ágiles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Trabajamos con sprints y entregas continuas que te permiten ver el progreso y adaptar el proyecto a las necesidades cambiantes del mercado.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Users className="h-10 w-10 text-primary"/>
            <CardTitle>Un Equipo Extendido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Considera a nuestro equipo como una extensión del tuyo. Nos integramos a tu operación para entender a fondo tus metas y desafíos.</p>
          </CardContent>
        </Card>
      </div>

       <div className="text-center bg-muted/50 p-8 rounded-lg">
          <h2 className="text-3xl font-bold mb-4">¿Tienes una idea o un desafío de sistemas?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            No importa en qué etapa te encuentres, estamos aquí para ayudarte a planificar, diseñar, desarrollar e implementar la solución tecnológica que impulsará tu negocio.
          </p>
          <a
            href="https://wa.me/5219999040931?text=Hola,%20me%20gustaría%20hablar%20con%20ustedes%20sobre%20un%20proyecto%20de%20sistemas."
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg">
                Contactar por WhatsApp
            </Button>
          </a>
       </div>
    </div>
  );
}
