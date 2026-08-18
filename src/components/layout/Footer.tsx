import Link from 'next/link';
import { Mail, Phone, MapPin, ShieldCheck, ChevronRight, Clock } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-card text-card-foreground">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12 pb-safe">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Logo y Descripción */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <h2 className="text-2xl font-black tracking-tighter text-primary">BORARLY</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Distribuidor mayorista líder en equipo de seguridad electrónica, videovigilancia y redes. Calidad y servicio garantizado.
            </p>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Distribuidor Autorizado
            </div>
          </div>

          {/* Enlaces Legales (Critico para Google) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/politicas/terminos" className="hover:text-primary transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/politicas/privacidad" className="hover:text-primary transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> Aviso de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/politicas/devoluciones" className="hover:text-primary transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> Política de Devoluciones
                </Link>
              </li>
              <li>
                <Link href="/politicas/envios" className="hover:text-primary transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> Política de Envíos
                </Link>
              </li>
            </ul>
          </div>

          {/* Navegación */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Explorar</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Inicio</Link></li>
              <li><Link href="/nosotros" className="hover:text-primary transition-colors">Quiénes Somos</Link></li>
              <li><Link href="/profile/orders" className="hover:text-primary transition-colors">Mis Pedidos</Link></li>
              <li><Link href="/cart" className="hover:text-primary transition-colors">Mi Carrito</Link></li>
            </ul>
          </div>

          {/* Contacto - COMPLETO para Google Merchant Center */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Contacto</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Calle 8 C por 21, No. 105<br />
                  Fracc. San Ángel, Kanasín<br />
                  Yucatán, México, C.P. 97370
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <a href="https://wa.me/5219999040931" target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition-colors">
                  +52 1 999 904 0931
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href="mailto:ventas@borarly.com" className="hover:text-primary transition-colors">ventas@borarly.com</a>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span>Atención 24 horas</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Datos Fiscales + Copyright */}
        <div className="mt-10 sm:mt-12 pt-8 border-t border-border/50 text-center space-y-2">
          <p className="text-xs text-muted-foreground break-words">
            Edgar Ydalimir Arevalo Escobedo &middot; RFC: AEEE991122MA7 &middot; Persona Física con Actividad Empresarial
          </p>
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} BORARLY. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
