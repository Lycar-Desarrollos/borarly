'use client';

import { useState } from 'react';
import { RefreshCw, Database, CheckCircle2, AlertTriangle, Layers, Box, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function AdminSyncPage() {
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSyncNow = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cron/sync-syscom');
      const data = await res.json();
      setSyncResult(data);
      if (!data.success && data.status?.status === 'rate_limited') {
        setError('Syscom limita las descargas a 1 por hora. Se utilizó el estado en caché.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error al conectar con la API de sincronización');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" /> Sincronizador de Catálogo Syscom
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión y estado del catálogo masivo de 42,520 productos vía reporte CSV automático.
          </p>
        </div>
        <Button onClick={handleSyncNow} disabled={loading} size="lg" className="gap-2">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Sincronizando...' : 'Ejecutar Sincronización'}
        </Button>
      </div>

      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Catálogo Total Syscom</CardTitle>
            <Box className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {syncResult?.status?.totalProducts ? syncResult.status.totalProducts.toLocaleString() : '42,520'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Productos procesados en el feed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Con Existencia Real</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {syncResult?.status?.inStockProducts ? syncResult.status.inStockProducts.toLocaleString() : 'En proceso...'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Equipos listos para envío inmediato</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categorías L1</CardTitle>
            <Layers className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {syncResult?.status?.categoriesCount || 'Varias'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Categorías clasificadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Info de Configuración */}
      <Card>
        <CardHeader>
          <CardTitle>Enlace de Descarga Automática Configurado</CardTitle>
          <CardDescription>
            Este enlace es provisto directamente por tu cuenta de Syscom para sincronizar datos en tiempo real.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg flex items-center justify-between flex-wrap gap-2 text-xs font-mono break-all">
            <span>https://www.syscom.mx/api/reportes-csv/publico/1116/cf7b016765e791c9d91980c27b9e1301</span>
            <a
              href="https://www.syscom.mx/api/reportes-csv/publico/1116/cf7b016765e791c9d91980c27b9e1301"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 shrink-0 font-sans"
            >
              Probar Enlace Directo <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>• <strong>Límite de Syscom:</strong> 1 descarga automática por hora.</p>
            <p>• <strong>Formato:</strong> CSV completo con precios mayoristas en USD/MXN, descripciones HTML, existencias y clave SAT.</p>
            <p>• <strong>Alcance:</strong> Google Merchant Center (Google Shopping) procesa ahora este catálogo expandido.</p>
          </div>
        </CardContent>
      </Card>

      {/* Muestra de Productos Sincronizados */}
      {syncResult?.sample && syncResult.sample.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa de Productos Sincronizados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {syncResult.sample.map((prod: any, idx: number) => (
              <div key={idx} className="p-3 border rounded-lg flex justify-between items-center gap-4 text-sm">
                <div>
                  <p className="font-bold">{prod.name}</p>
                  <p className="text-xs text-muted-foreground">Modelo: {prod.line} | Marca: {prod.brand} | Categoría: {prod.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-primary">${prod.price?.toFixed(2)} MXN</p>
                  <p className="text-xs text-muted-foreground">Stock: {prod.stock}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
