
import Link from 'next/link';
import type { Order } from '@/lib/types';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  DollarSign, Package, Users, ShoppingCart, ExternalLink,
  PackageIcon, Tag, Settings2, Upload, ArrowUpRight, Clock, CheckCircle2, XCircle, Truck
} from 'lucide-react';

async function getDashboardStats() {
  let totalRevenue = 0;
  let totalOrders = 0;
  let totalProducts = 0;
  let totalCustomers = 0;
  let recentOrders: Order[] = [];

  try {
    const ordersRef = collection(db, 'orders');
    const ordersSnapshot = await getDocs(ordersRef);
    totalOrders = ordersSnapshot.size;
    ordersSnapshot.forEach(doc => {
      const order = doc.data() as Omit<Order, 'id'>;
      totalRevenue += order.totalAmount || 0;
    });

    const recentOrdersQuery = query(ordersRef, orderBy('createdAt', 'desc'), limit(5));
    const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
    recentOrders = recentOrdersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        items: data.items || [],
        subtotal: data.subtotal || 0,
        shippingCost: data.shippingCost || 0,
        vatAmount: data.vatAmount || 0,
        totalAmount: data.totalAmount || 0,
        status: data.status || 'pending',
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : String(data.createdAt),
        shippingAddress: data.shippingAddress,
      } as Order;
    });

    const productsRef = collection(db, 'products');
    const productsSnapshot = await getDocs(productsRef);
    totalProducts = productsSnapshot.size;

    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    totalCustomers = usersSnapshot.size;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
  }

  return { totalRevenue, totalOrders, totalProducts, totalCustomers, recentOrders };
}

const STATUS_CONFIG: Record<Order['status'], { label: string; color: string; bg: string; icon: any }> = {
  pending:   { label: 'Pendiente',  color: 'text-[#FF9F0A]', bg: 'bg-[#FF9F0A]/10 border-[#FF9F0A]/20', icon: Clock },
  paid:      { label: 'Pagado',     color: 'text-[#00E676]', bg: 'bg-[#00E676]/10 border-[#00E676]/20', icon: CheckCircle2 },
  shipped:   { label: 'Enviado',    color: 'text-[#0070FF]', bg: 'bg-[#0070FF]/10 border-[#0070FF]/20', icon: Truck },
  delivered: { label: 'Entregado',  color: 'text-[#00E676]', bg: 'bg-[#00E676]/10 border-[#00E676]/20', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado',  color: 'text-[#FF3B30]', bg: 'bg-[#FF3B30]/10 border-[#FF3B30]/20', icon: XCircle },
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const fmt = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const fmtDate = (iso: string | undefined) => {
    if (!iso) return 'N/A';
    try { return new Date(iso).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return '—'; }
  };

  const kpis = [
    { label: 'Ingresos Totales', value: fmt(stats.totalRevenue), icon: DollarSign, color: '#00E676', sub: 'Ventas acumuladas' },
    { label: 'Pedidos',          value: `+${stats.totalOrders}`,  icon: ShoppingCart, color: '#0070FF', sub: 'Total de órdenes' },
    { label: 'Productos',        value: `${stats.totalProducts}`, icon: Package,      color: '#FF9F0A', sub: 'En catálogo' },
    { label: 'Clientes',         value: `+${stats.totalCustomers}`,icon: Users,       color: '#BF5AF2', sub: 'Usuarios registrados' },
  ];

  const quickActions = [
    { label: 'Nuevo Producto',    href: '/admin/products/new',      icon: PackageIcon, color: '#0070FF' },
    { label: 'Carga Masiva',      href: '/admin/products/bulk-upload', icon: Upload,   color: '#FF9F0A' },
    { label: 'Categorías',        href: '/admin/categories',         icon: Tag,        color: '#00E676' },
    { label: 'Configuración',     href: '/admin/settings',           icon: Settings2,  color: '#BF5AF2' },
  ];

  return (
    <div className="bg-background dark:bg-[#050c18] text-foreground dark:text-white pb-16">
      {/* HEADER */}
      <div className="relative overflow-hidden border-b border-border dark:border-slate-800/60 bg-gradient-to-r from-muted to-background dark:from-[#07111f] dark:to-[#0b1a2e] px-6 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,112,255,0.10),transparent_60%)]" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#0070FF] mb-1">Panel de Control</p>
          <h1 className="text-3xl font-black tracking-tighter text-foreground dark:text-white">Dashboard</h1>
          <p className="text-muted-foreground dark:text-slate-400 text-sm mt-1">Bienvenido de vuelta. Aquí el resumen de tu tienda.</p>
        </div>
      </div>

      <div className="px-6 pt-8 space-y-8">
        {/* KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="relative group rounded-2xl border border-border dark:border-slate-800 bg-card/80 dark:bg-[#0b1120]/80 backdrop-blur-xl p-5 hover:border-border/80 dark:hover:border-slate-700 transition-all duration-300">
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(circle at top left, ${kpi.color}08, transparent 70%)` }} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-muted-foreground dark:text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                    <div className="p-1.5 rounded-lg" style={{ background: `${kpi.color}15`, border: `1px solid ${kpi.color}25` }}>
                      <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-foreground dark:text-white tracking-tighter">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground dark:text-slate-600 mt-1">{kpi.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* RECENT ORDERS */}
          <div className="lg:col-span-2 rounded-2xl border border-border dark:border-slate-800 bg-card/80 dark:bg-[#0b1120]/80 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-slate-800">
              <div>
                <p className="font-black text-foreground dark:text-white">Pedidos Recientes</p>
                <p className="text-xs text-muted-foreground dark:text-slate-500">Últimas {stats.recentOrders.length} órdenes</p>
              </div>
              <Link href="/admin/orders" className="flex items-center gap-1 text-xs text-[#0070FF] hover:text-[#60a5fa] transition-colors font-bold">
                Ver todos <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border dark:divide-slate-800/60">
              {stats.recentOrders.length > 0 ? stats.recentOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
                const StatusIcon = cfg.icon;
                return (
                  <div key={order.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-muted dark:bg-slate-800 border border-border dark:border-slate-700 flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground dark:text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground dark:text-white truncate">#{order.id.substring(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground dark:text-slate-500">{fmtDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-3">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${cfg.bg} ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </div>
                      <p className="text-sm font-black text-foreground dark:text-white">{fmt(order.totalAmount)}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-12 text-center text-muted-foreground dark:text-slate-500 text-sm">No hay pedidos aún.</div>
              )}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="rounded-2xl border border-border dark:border-slate-800 bg-card/80 dark:bg-[#0b1120]/80 backdrop-blur-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border dark:border-slate-800">
              <p className="font-black text-foreground dark:text-white">Acciones Rápidas</p>
              <p className="text-xs text-muted-foreground dark:text-slate-500">Tareas frecuentes</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href}
                    className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border dark:border-slate-800 hover:border-border/80 dark:hover:border-slate-700 bg-muted/50 dark:bg-slate-900/50 hover:bg-muted dark:hover:bg-slate-800/50 transition-all duration-200 text-center">
                    <div className="p-2.5 rounded-xl transition-colors" style={{ background: `${action.color}15`, border: `1px solid ${action.color}25` }}>
                      <Icon className="w-5 h-5" style={{ color: action.color }} />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground dark:text-slate-300 group-hover:text-foreground dark:group-hover:text-white transition-colors leading-tight">{action.label}</span>
                  </Link>
                );
              })}
            </div>
            {/* MORE LINKS */}
            <div className="px-4 pb-4 space-y-2">
              {[
                { label: 'Gestionar Pedidos', href: '/admin/orders' },
                { label: 'Cotizaciones', href: '/admin/quotes' },
                { label: 'Carrusel / Hero', href: '/admin/hero-slides' },
                { label: 'Marcas Destacadas', href: '/admin/featured-brands' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border dark:border-slate-800 hover:border-border/80 dark:hover:border-slate-700 hover:bg-muted dark:hover:bg-slate-800/40 transition-all group">
                  <span className="text-xs text-muted-foreground dark:text-slate-400 group-hover:text-foreground dark:group-hover:text-white transition-colors font-medium">{l.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground dark:text-slate-600 group-hover:text-[#0070FF] transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
