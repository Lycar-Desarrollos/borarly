"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { Order, Quote } from '@/lib/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fetchAllOrders } from '@/services/orderService';
import { getQuotes } from '@/services/quoteService';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Users,
  ShoppingCart,
  Tag,
  Settings2,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  FileText,
  RefreshCw,
  Image as ImageIcon,
  Star,
  CalendarClock,
  ShoppingBag,
  FileSpreadsheet,
  Receipt,
  Loader2,
} from 'lucide-react';

interface DashboardStats {
  confirmedRevenue: number;
  pendingRevenue: number;
  totalOrders: number;
  toShipCount: number;
  pendingPaymentCount: number;
  totalQuotes: number;
  acceptedQuotes: number;
  totalCustomers: number;
  recentOrders: Order[];
}

const STATUS_CONFIG: Record<Order['status'], { label: string; color: string; bg: string; icon: any }> = {
  pending:   { label: 'Por confirmar', color: 'text-amber-600 dark:text-[#FF9F0A]', bg: 'bg-amber-500/10 border-amber-500/25', icon: Clock },
  paid:      { label: 'Por enviar',    color: 'text-emerald-600 dark:text-[#00E676]', bg: 'bg-emerald-500/10 border-emerald-500/25', icon: CheckCircle2 },
  shipped:   { label: 'En tránsito',   color: 'text-blue-600 dark:text-[#0070FF]', bg: 'bg-blue-500/10 border-blue-500/25', icon: Truck },
  delivered: { label: 'Entregado',     color: 'text-emerald-600 dark:text-[#00E676]', bg: 'bg-emerald-500/10 border-emerald-500/25', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado',     color: 'text-red-600 dark:text-[#FF3B30]', bg: 'bg-red-500/10 border-red-500/25', icon: XCircle },
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    confirmedRevenue: 0,
    pendingRevenue: 0,
    totalOrders: 0,
    toShipCount: 0,
    pendingPaymentCount: 0,
    totalQuotes: 0,
    acceptedQuotes: 0,
    totalCustomers: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [orders, quotes, usersSnap] = await Promise.all([
        fetchAllOrders(),
        getQuotes(),
        getDocs(collection(db, 'users')).catch(() => null),
      ]);

      let confirmedRevenue = 0;
      let pendingRevenue = 0;
      let toShipCount = 0;
      let pendingPaymentCount = 0;

      for (const o of orders) {
        if (o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered') {
          confirmedRevenue += o.totalAmount || 0;
        } else if (o.status === 'pending') {
          pendingRevenue += o.totalAmount || 0;
          pendingPaymentCount++;
        }
        if (o.status === 'paid') {
          toShipCount++;
        }
      }

      const activeOrdersCount = orders.filter(o => o.status !== 'cancelled').length;
      const acceptedQuotes = quotes.filter((q: Quote) => q.status === 'accepted').length;

      setStats({
        confirmedRevenue,
        pendingRevenue,
        totalOrders: activeOrdersCount,
        toShipCount,
        pendingPaymentCount,
        totalQuotes: quotes.length,
        acceptedQuotes,
        totalCustomers: usersSnap ? usersSnap.size : 0,
        recentOrders: orders.slice(0, 6),
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const fmt = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const fmtDate = (iso: string | undefined) => {
    if (!iso) return 'N/A';
    try {
      return new Date(iso).toLocaleDateString('es-MX', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const kpis = [
    {
      label: 'Ingresos Confirmados',
      value: fmt(stats.confirmedRevenue),
      icon: DollarSign,
      color: '#00E676',
      sub: stats.pendingRevenue > 0 ? `+ ${fmt(stats.pendingRevenue)} por confirmar` : 'Pagos acreditados',
      href: '/admin/orders',
    },
    {
      label: 'Ventas Activas',
      value: `${stats.totalOrders}`,
      icon: ShoppingCart,
      color: '#0070FF',
      sub: `${stats.toShipCount} por enviar · ${stats.pendingPaymentCount} por confirmar`,
      href: '/admin/orders',
    },
    {
      label: 'Cotizaciones',
      value: `${stats.totalQuotes}`,
      icon: FileText,
      color: '#FF9F0A',
      sub: `${stats.acceptedQuotes} aceptada${stats.acceptedQuotes !== 1 ? 's' : ''}`,
      href: '/admin/quotes',
    },
    {
      label: 'Clientes',
      value: `${stats.totalCustomers}`,
      icon: Users,
      color: '#BF5AF2',
      sub: 'Cuentas registradas',
      href: '/admin/reports',
    },
  ];

  const quickActions = [
    { label: 'Ventas y Envíos',    href: '/admin/orders',          icon: ShoppingCart, color: '#0070FF' },
    { label: 'Nueva Cotización',   href: '/admin/quotes/new',      icon: FileText,     color: '#FF9F0A' },
    { label: 'Categorías',         href: '/admin/categories',      icon: Tag,          color: '#00E676' },
    { label: 'Precios / Envío',    href: '/admin/settings',        icon: Settings2,    color: '#BF5AF2' },
  ];

  return (
    <div className="bg-background dark:bg-[#050c18] text-foreground dark:text-white pb-16 min-h-full">
      {/* HEADER */}
      <div className="relative overflow-hidden border-b border-border dark:border-slate-800/60 bg-gradient-to-r from-muted to-background dark:from-[#07111f] dark:to-[#0b1a2e] px-4 sm:px-6 py-6 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,112,255,0.10),transparent_60%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-1">Panel de Control</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground dark:text-white">Dashboard Operativo</h1>
            <p className="text-muted-foreground dark:text-slate-400 text-xs sm:text-sm mt-1">
              Resumen en vivo de tus ventas, cotizaciones y configuración de tienda.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={loading}
            className="gap-2 h-9 font-semibold"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link
                key={kpi.label}
                href={kpi.href}
                className="relative group rounded-2xl border border-border dark:border-slate-800 bg-card/80 dark:bg-[#0b1120]/80 backdrop-blur-xl p-5 hover:border-primary/40 transition-all duration-200 block"
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `radial-gradient(circle at top left, ${kpi.color}10, transparent 70%)` }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                    <div className="p-1.5 rounded-lg" style={{ background: `${kpi.color}15`, border: `1px solid ${kpi.color}25` }}>
                      <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                    </div>
                  </div>
                  {loading ? (
                    <div className="h-8 flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <p className="text-2xl font-black text-foreground dark:text-white tracking-tight">{kpi.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground dark:text-slate-500 mt-1 truncate">{kpi.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* RECENT ORDERS */}
          <div className="lg:col-span-2 rounded-2xl border border-border dark:border-slate-800 bg-card/80 dark:bg-[#0b1120]/80 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-slate-800">
              <div>
                <p className="font-black text-foreground dark:text-white">Ventas Recientes</p>
                <p className="text-xs text-muted-foreground dark:text-slate-500">
                  Haz clic en cualquier orden para abrir el panel de ventas
                </p>
              </div>
              <Link href="/admin/orders" className="flex items-center gap-1 text-xs text-primary hover:underline font-bold">
                Ir a Ventas <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-border dark:divide-slate-800/60">
              {loading ? (
                <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Cargando ventas recientes...
                </div>
              ) : stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
                  const StatusIcon = cfg.icon;
                  const folio = order.id.substring(0, 8).toUpperCase();
                  return (
                    <Link
                      key={order.id}
                      href="/admin/orders"
                      className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-muted dark:bg-slate-800 border border-border dark:border-slate-700 flex items-center justify-center shrink-0">
                          <ShoppingCart className="w-4 h-4 text-muted-foreground dark:text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-foreground dark:text-white font-mono">#{folio}</p>
                            {order.paymentReference && (
                              <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                Ref: {order.paymentReference}
                              </span>
                            )}
                            {order.requiresBilling && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                <Receipt className="w-3 h-3" /> Factura
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground dark:text-slate-400 truncate">
                            {order.shippingAddress?.contactEmail || 'Cliente'} · {fmtDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-auto">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </div>
                        <p className="text-sm font-black text-foreground dark:text-white min-w-[90px] text-right">
                          {fmt(order.totalAmount)}
                        </p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="py-12 text-center text-muted-foreground dark:text-slate-500 text-sm">
                  No hay pedidos registrados aún.
                </div>
              )}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="rounded-2xl border border-border dark:border-slate-800 bg-card/80 dark:bg-[#0b1120]/80 backdrop-blur-xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-5 py-4 border-b border-border dark:border-slate-800">
                <p className="font-black text-foreground dark:text-white">Acciones Rápidas</p>
                <p className="text-xs text-muted-foreground dark:text-slate-500">Accesos directos de administración</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border dark:border-slate-800 hover:border-primary/40 bg-muted/40 dark:bg-slate-900/50 hover:bg-muted dark:hover:bg-slate-800/50 transition-all duration-200 text-center"
                    >
                      <div className="p-2.5 rounded-xl transition-colors" style={{ background: `${action.color}15`, border: `1px solid ${action.color}25` }}>
                        <Icon className="w-5 h-5" style={{ color: action.color }} />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground dark:text-slate-300 group-hover:text-foreground dark:group-hover:text-white transition-colors leading-tight">
                        {action.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* MORE LINKS */}
            <div className="px-4 pb-4 space-y-2">
              {[
                { label: 'Carrusel Principal (Hero)', href: '/admin/hero-slides', icon: ImageIcon },
                { label: 'Marcas Destacadas',         href: '/admin/featured-brands', icon: Star },
                { label: 'Eventos y Promociones',     href: '/admin/upcoming-events', icon: CalendarClock },
                { label: 'Exportar a Mercado Libre',  href: '/admin/mercadolibre', icon: ShoppingBag },
                { label: 'Descargar Reportes CSV',    href: '/admin/reports', icon: FileSpreadsheet },
              ].map(l => {
                const Icon = l.icon;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border dark:border-slate-800 hover:border-primary/40 hover:bg-muted dark:hover:bg-slate-800/40 transition-all group"
                  >
                    <span className="flex items-center gap-2.5 text-xs text-muted-foreground dark:text-slate-400 group-hover:text-foreground dark:group-hover:text-white transition-colors font-medium">
                      <Icon className="w-3.5 h-3.5 text-primary/80" />
                      {l.label}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground dark:text-slate-600 group-hover:text-primary transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
