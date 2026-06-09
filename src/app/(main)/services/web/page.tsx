
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, ShoppingCart, PencilRuler } from 'lucide-react';
import Link from 'next/link';

export default function WebServicesPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto py-12 px-4 md:px-6">
        <header className="text-center mb-16">
          <Globe className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">
            Servicios de Desarrollo Web
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Creamos la presencia online que tu negocio necesita para destacar, atraer clientes y vender más.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Globe className="mx-auto h-12 w-12 text-primary mb-4"/>
              <CardTitle className="text-2xl font-bold">Páginas Web Corporativas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Diseñamos sitios web modernos, rápidos y optimizados para móviles que comunican tu propuesta de valor de manera efectiva y profesional.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <ShoppingCart className="mx-auto h-12 w-12 text-primary mb-4"/>
              <CardTitle className="text-2xl font-bold">Tiendas en Línea (E-commerce)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Construimos plataformas de e-commerce robustas, seguras y fáciles de gestionar, con todas las funcionalidades para que empieces a vender online.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <PencilRuler className="mx-auto h-12 w-12 text-primary mb-4"/>
              <CardTitle className="text-2xl font-bold">Sistemas Web a la Medida</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Desarrollamos aplicaciones web personalizadas, desde portales de clientes hasta sistemas de gestión interna, para solucionar tus desafíos específicos.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center bg-primary text-primary-foreground p-8 md:p-12 rounded-lg">
          <h2 className="text-3xl font-bold mb-4">¿Listo para lanzar o renovar tu proyecto web?</h2>
          <p className="max-w-xl mx-auto mb-6 opacity-90">
            Hablemos sobre tus ideas. Te ofrecemos una consulta gratuita para entender tus objetivos y proponerte la mejor solución tecnológica.
          </p>
          <a
            href="https://wa.me/5219999040931?text=Hola,%20me%20gustaría%20recibir%20más%20información%20sobre%20sus%20servicios%20de%20desarrollo%20web."
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-200">
                Contactar por WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
