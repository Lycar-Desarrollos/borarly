"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Building, CreditCard, Clock, AlertTriangle, Copy } from 'lucide-react';
import type { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { fetchUserOrders } from '@/services/orderService';
import Link from 'next/link';

export default function OrdersPage() {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login?redirect=/profile/orders');
      return;
    }
    if (currentUser && userProfile?.uid) {
      const loadOrders = async () => {
        setOrdersLoading(true);
        try {
          const userOrdersData = await fetchUserOrders(userProfile.uid);
          const now = new Date().getTime();
          const processedOrders = await Promise.all(userOrdersData.map(async (order) => {
            if (order.status === 'pending') {
              const createdAt = new Date(order.createdAt).getTime();
              if (now - createdAt > 24 * 60 * 60 * 1000) {
                import('@/lib/firebase').then(async ({ db }) => {
                  const { doc, updateDoc } = await import('firebase/firestore');
                  updateDoc(doc(db, 'orders', order.id), { status: 'cancelled', updatedAt: new Date().toISOString() })
                    .catch(err => console.error("Error auto-cancelling order:", err));
                });
                return { ...order, status: 'cancelled' as const };
              }
            }
            return order;
          }));
          setOrders(processedOrders);
        } catch (error) {
          console.error("[OrdersPage] Error fetching orders:", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el historial de pedidos." });
          setOrders([]);
        } finally {
          setOrdersLoading(false);
        }
      };
      loadOrders();
    }
  }, [currentUser, userProfile, authLoading, router, toast]);

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const formatDate = (isoString?: string): string => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return 'N/A'; }
  };

  const getBadgeVariant = (status?: Order['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending': return 'outline';
      case 'paid': return 'default';
      case 'shipped': return 'secondary';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    paid: 'Pagado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  };

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  if (ordersLoading) {
    return (
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle className="text-2xl">Historial de Pedidos</CardTitle>
          <CardDescription>Cargando tu historial...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-xl space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-1/5" />
                </div>
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="mb-4">
        <h1 className="text-2xl font-black tracking-tight">Historial de Pedidos</h1>
        {orders.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {`Mostrando ${indexOfFirstOrder + 1}–${Math.min(indexOfLastOrder, orders.length)} de ${orders.length} pedidos`}
          </p>
        )}
      </div>

      {orders.length > 0 ? (
        <>
          <div className="space-y-4">
            {currentOrders.map(order => {
              const isPending = order.status === 'pending';
              const isExpired = isPending && new Date().getTime() - new Date(order.createdAt).getTime() > 24 * 60 * 60 * 1000;
              const defaultPaymentTab = order.paymentDetails?.method === 'oxxo' ? 'oxxo' : 'spei';

              return (
                <div key={order.id} className={`rounded-xl border transition-colors ${isPending ? 'border-primary/30 bg-primary/5' : 'bg-muted/20 hover:bg-muted/40'}`}>
                  {/* Cabecera siempre visible */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold text-sm">
                        Pedido <span className="font-mono text-primary">#{order.id.substring(0, 8).toUpperCase()}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-bold">{formatCurrency(order.totalAmount)}</p>
                      </div>
                      <Badge variant={getBadgeVariant(order.status)} className="capitalize text-xs px-2.5 py-1">
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                      <Link href={`/profile/orders/${order.id}`}>
                        <Button size="sm" variant={isPending ? 'outline' : 'default'}>Ver Detalles</Button>
                      </Link>
                    </div>
                  </div>

                  {/* Instrucciones de pago — solo si está Pendiente */}
                  {isPending && (
                    <div className="border-t border-primary/20 px-4 pb-4 pt-3">
                      {isExpired ? (
                        <div className="p-3 border border-dashed border-destructive/50 rounded-lg bg-destructive/5 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <p className="text-xs text-destructive font-medium">Referencia expirada. Contacta a soporte o realiza un nuevo pedido.</p>
                        </div>
                      ) : (
                        <Tabs defaultValue={defaultPaymentTab} className="w-full">
                          <TabsList className="grid w-full grid-cols-2 h-9">
                            <TabsTrigger value="spei" className="text-xs"><Building className="mr-1.5 h-3.5 w-3.5" />Transferencia SPEI</TabsTrigger>
                            <TabsTrigger value="oxxo" className="text-xs"><CreditCard className="mr-1.5 h-3.5 w-3.5" />Depósito OXXO</TabsTrigger>
                          </TabsList>

                          {/* SPEI */}
                          <TabsContent value="spei">
                            <div className="p-4 mt-2 border-2 border-dashed border-primary/30 rounded-xl bg-white/60 dark:bg-background/40 space-y-3">
                              <div className="flex justify-between items-center">
                                <p className="text-sm font-bold text-primary">Transferencia SPEI — BBVA / BANCOMER</p>
                              </div>
                              <div className="grid gap-2">
                                {[{label:'Concepto / Referencia', value: order.paymentReference || 'N/A', copy: order.paymentReference || '', desc:'Referencia copiada', color:'text-primary'},
                                  {label:'CLABE Interbancaria', value:'012 180 01576278534 6', copy:'012180015762785346', desc:'CLABE copiada', color:''},
                                  {label:'Número de Cuenta', value:'157 627 8534', copy:'1576278534', desc:'Cuenta copiada', color:''},
                                ].map(f => (
                                  <div key={f.label} className="bg-muted/40 px-3 py-2 rounded-lg flex items-center justify-between gap-2">
                                    <div>
                                      <p className="text-[9px] text-muted-foreground uppercase font-bold">{f.label}</p>
                                      <span className={`font-mono font-bold text-sm ${f.color}`}>{f.value}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(f.copy); toast({ description: f.desc }); }}>
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ))}
                                <p className="text-[11px] text-muted-foreground px-1">Titular: <strong>Edgar Ydalimir Arevalo Escobedo</strong></p>
                              </div>
                              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
                                <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-800 dark:text-blue-300">
                                  Tu pago será validado automáticamente. Una vez confirmado el depósito, el pedido cambiará a <strong>Pagado</strong> sin necesidad de llamadas.
                                </p>
                              </div>
                            </div>
                          </TabsContent>

                          {/* OXXO */}
                          <TabsContent value="oxxo">
                            <div className="p-4 mt-2 border-2 border-dashed border-orange-500/30 rounded-xl bg-white/60 dark:bg-background/40 space-y-3">
                              <p className="text-sm font-bold text-orange-600">Depósito en OXXO — SANTANDER</p>
                              <div className="bg-muted/40 px-3 py-2 rounded-lg flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Número de Tarjeta (Santander)</p>
                                  <span className="font-mono font-bold text-sm text-orange-700">4152 3141 6673 6093</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-orange-600" onClick={() => { navigator.clipboard.writeText('4152314166736093'); toast({ description: 'Tarjeta copiada' }); }}>
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-2">
                                <Clock className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-orange-800 dark:text-orange-300">
                                  Tu pago en OXXO será enlazado a nuestra cuenta. Una vez detectada la transacción, el pedido cambiará a <strong>Pagado</strong> automáticamente.
                                </p>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4 border-t mt-4">
              <Button onClick={handlePrevPage} disabled={currentPage === 1} variant="outline" size="sm">
                <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
              </Button>
              <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
              <Button onClick={handleNextPage} disabled={currentPage === totalPages} variant="outline" size="sm">
                Siguiente <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Aún no tienes pedidos</p>
          <p className="text-sm mt-1">¡Explora nuestro catálogo y realiza tu primera compra!</p>
          <Link href="/" className="mt-4 inline-block">
            <Button className="mt-4">Ver Productos</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
