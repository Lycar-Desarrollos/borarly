import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MessageCircle, Lock } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 dark:bg-background">
      {/* Barra superior con la identidad de la tienda */}
      <header className="bg-[#090d16] text-white border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0" aria-label="Ir a la tienda">
            <Image src="/logo-white.png" alt="BORARLY" width={150} height={40} className="h-8 sm:h-9 w-auto" priority />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://wa.me/5219999040931"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">¿Necesitas ayuda?</span>
            </a>
            <Link
              href="/"
              className="h-9 px-3 rounded-lg text-xs font-semibold text-slate-200 border border-white/15 hover:bg-white/10 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver a la tienda</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start md:items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-5xl">{children}</div>
      </main>

      <footer className="pb-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
        <Lock className="h-3.5 w-3.5" />
        Conexión segura · © {new Date().getFullYear()} Borarly Mayorista
      </footer>
    </div>
  );
}
