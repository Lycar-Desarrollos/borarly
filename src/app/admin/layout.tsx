
"use client";

import React, { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ShoppingCart,
  Tag,
  Loader2,
  ShieldAlert,
  Home,
  Image as ImageIcon,
  Cloud,
  PackageIcon,
  Upload,
  FileText,
  Star,
  CalendarClock,
  FileSpreadsheet,
  ShoppingBag
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminNavLinkProps {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function AdminNavLink({ href, icon: Icon, children }: AdminNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
  return (
    <SidebarMenuItem>
      <Link href={href} legacyBehavior passHref>
        <SidebarMenuButton isActive={isActive} className="justify-start text-sm">
          <Icon className="h-5 w-5 mr-3" />
          {children}
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { userProfile, isAdmin, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!userProfile) {
        router.push('/login?redirect=/admin');
      } else if (!isAdmin) {
        router.push('/');
      }
    }
  }, [userProfile, isAdmin, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-screen items-center justify-center text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
        <p className="text-muted-foreground mb-6">No tienes permiso para ver esta página.</p>
        <Link href="/" legacyBehavior passHref>
          <Button><Home className="mr-2 h-4 w-4"/>Ir a la Página Principal</Button>
        </Link>
      </div>
    );
  }
  
  const defaultSidebarOpen = typeof window !== 'undefined' ? document.cookie.includes('sidebar_state=true') : true;


  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen} className="flex h-screen overflow-hidden bg-background dark:bg-[#050c18]">
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r border-border dark:border-slate-800 bg-card text-card-foreground dark:bg-[#07111f] dark:text-slate-200">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <Link href="/admin" className="flex items-center gap-2 text-lg font-semibold text-sidebar-primary-foreground group-data-[collapsible=icon]:justify-center">
              <Cloud className="h-6 w-6 text-sidebar-primary shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden leading-none">Admin BORARLY</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="flex-1 p-2">
            <SidebarMenu>
              <AdminNavLink href="/admin" icon={LayoutDashboard}>Dashboard</AdminNavLink>
              <AdminNavLink href="/admin/categories" icon={Tag}>Categorías</AdminNavLink>
              <AdminNavLink href="/admin/orders" icon={ShoppingCart}>Pedidos</AdminNavLink>
              <AdminNavLink href="/admin/quotes" icon={FileText}>Cotizaciones</AdminNavLink>
              <AdminNavLink href="/admin/reports" icon={FileSpreadsheet}>Reportes</AdminNavLink>
              <AdminNavLink href="/admin/hero-slides" icon={ImageIcon}>Carrusel</AdminNavLink>
              <AdminNavLink href="/admin/featured-brands" icon={Star}>Marcas Destacadas</AdminNavLink>
              <AdminNavLink href="/admin/upcoming-events" icon={CalendarClock}>Eventos</AdminNavLink>
              <AdminNavLink href="/admin/mercadolibre" icon={ShoppingBag}>Mercado Libre</AdminNavLink>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-2 border-t border-sidebar-border">
            <SidebarMenu>
              <AdminNavLink href="/admin/settings" icon={Settings}>Configuración</AdminNavLink>
               <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} className="justify-start text-sm w-full">
                  <LogOut className="h-5 w-5 mr-3" />
                  Cerrar Sesión
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col min-w-0 flex-1 overflow-hidden bg-background dark:bg-[#050c18]">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 shrink-0">
            {/* Trigger siempre visible — colapsa a íconos y libera espacio */}
            <SidebarTrigger className="h-9 w-9 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors shrink-0" />
            <div className="h-5 w-px bg-border shrink-0" />
            <div className="ml-auto flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" size="sm" asChild>
                <Link href="/"><Home className="mr-2 h-4 w-4"/>Ver Tienda</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={userProfile?.photoURL || undefined} alt={userProfile?.displayName || 'Admin'} />
                      <AvatarFallback>{userProfile?.displayName?.charAt(0)?.toUpperCase() || 'A'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile?.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userProfile?.email} (Admin)
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
