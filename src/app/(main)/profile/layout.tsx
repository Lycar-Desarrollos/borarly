
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, ShoppingBag, Heart, MapPin, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname.includes('/orders')) return 'orders';
    if (pathname.includes('/wishlist')) return 'wishlist';
    if (pathname.includes('/addresses')) return 'addresses';
    if (pathname.includes('/billing')) return 'billing';
    return 'profile';
  };

  const activeTab = getActiveTab();

  return (
    <div className="flex flex-col md:flex-row gap-5 md:gap-8 items-start w-full max-w-7xl mx-auto mt-4 mb-12 md:mb-20 px-0 md:px-4">
      <aside className="w-full md:w-64 shrink-0 md:top-24 md:sticky">
        <h2 className="text-xl font-bold tracking-tight mb-4 px-2 hidden md:block">Mi Cuenta</h2>
        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar scrollbar-hide w-full">
            <Link href="/profile" className={cn("shrink-0 flex flex-col md:flex-row items-center md:items-start md:justify-start gap-1.5 md:gap-2 py-2.5 md:py-3 px-3 md:px-4 rounded-xl transition-colors font-medium text-sm whitespace-nowrap", activeTab === 'profile' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
                <User className="h-5 w-5"/>
                <span className="text-[11px] sm:hidden">Perfil</span>
                <span className="hidden sm:inline">Perfil Completo</span>
            </Link>
            <Link href="/profile/orders" className={cn("shrink-0 flex flex-col md:flex-row items-center md:items-start md:justify-start gap-1.5 md:gap-2 py-2.5 md:py-3 px-3 md:px-4 rounded-xl transition-colors font-medium text-sm whitespace-nowrap", activeTab === 'orders' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
                <ShoppingBag className="h-5 w-5"/>
                <span className="text-[11px] sm:hidden">Pedidos</span>
                <span className="hidden sm:inline">Historial de Pedidos</span>
            </Link>
            <Link href="/profile/addresses" className={cn("shrink-0 flex flex-col md:flex-row items-center md:items-start md:justify-start gap-1.5 md:gap-2 py-2.5 md:py-3 px-3 md:px-4 rounded-xl transition-colors font-medium text-sm whitespace-nowrap", activeTab === 'addresses' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
                <MapPin className="h-5 w-5"/>
                <span className="text-[11px] sm:hidden">Direcciones</span>
                <span className="hidden sm:inline">Direcciones de Envío</span>
            </Link>
            <Link href="/profile/billing" className={cn("shrink-0 flex flex-col md:flex-row items-center md:items-start md:justify-start gap-1.5 md:gap-2 py-2.5 md:py-3 px-3 md:px-4 rounded-xl transition-colors font-medium text-sm whitespace-nowrap", activeTab === 'billing' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
                <FileText className="h-5 w-5"/>
                <span className="text-[11px] sm:hidden">Facturación</span>
                <span className="hidden sm:inline">Datos de Facturación</span>
            </Link>
            <Link href="/profile/wishlist" className={cn("shrink-0 flex flex-col md:flex-row items-center md:items-start md:justify-start gap-1.5 md:gap-2 py-2.5 md:py-3 px-3 md:px-4 rounded-xl transition-colors font-medium text-sm whitespace-nowrap", activeTab === 'wishlist' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
                <Heart className="h-5 w-5"/>
                <span className="text-[11px] sm:hidden">Deseos</span>
                <span className="hidden sm:inline">Lista de Deseos</span>
            </Link>
        </div>
      </aside>

      <main className="flex-1 w-full max-w-full overflow-hidden bg-card rounded-2xl shadow-sm border border-border/50 p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
