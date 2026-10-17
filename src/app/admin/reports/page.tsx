"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, FileText, BarChart2, Users, Tag, FileSpreadsheet } from 'lucide-react';
import { getCategories } from '@/services/productService';
import { fetchAllOrders } from '@/services/orderService';
import { getQuotes } from '@/services/quoteService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ReportsPage() {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const { toast } = useToast();

  const escapeCsvCell = (cellData: any): string => {
    if (cellData === null || cellData === undefined) {
      return '';
    }
    const stringData = String(cellData);
    if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
      return `"${stringData.replace(/"/g, '""')}"`;
    }
    return stringData;
  };

  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSales = async () => {
    setGeneratingReport('sales');
    toast({ title: 'Generando reporte de ventas...', description: 'Obteniendo historial de pedidos y facturación.' });
    try {
      const orders = await fetchAllOrders();
      if (orders.length === 0) {
        toast({ variant: 'destructive', title: 'Sin registros', description: 'No se encontraron pedidos para exportar.' });
        return;
      }

      const headers = [
        'Folio',
        'Referencia Pago',
        'Fecha',
        'Estado',
        'Método Pago',
        'Email Cliente',
        'Teléfono',
        'Dirección',
        'Ciudad / Estado',
        'CP',
        'Paquetería',
        'Número de Guía',
        'Requiere Factura',
        'RFC',
        'Razón Social',
        'Régimen Fiscal',
        'Uso CFDI',
        'CP Fiscal',
        'Artículos (Cant x Nombre)',
        'Subtotal (MXN)',
        'Envío (MXN)',
        'IVA (MXN)',
        'Total (MXN)',
      ];

      const rows = orders.map(order => {
        const itemsSummary = (order.items || [])
          .map(i => `${i.quantity}x ${i.name} (${i.productId})`)
          .join(' | ');

        return [
          escapeCsvCell(order.id.substring(0, 8).toUpperCase()),
          escapeCsvCell(order.paymentReference || ''),
          escapeCsvCell(new Date(order.createdAt).toLocaleString('es-MX')),
          escapeCsvCell(order.status),
          escapeCsvCell(order.paymentDetails?.method || ''),
          escapeCsvCell(order.shippingAddress?.contactEmail || ''),
          escapeCsvCell(order.shippingAddress?.phone || ''),
          escapeCsvCell(order.shippingAddress?.street || ''),
          escapeCsvCell(order.shippingAddress?.city || ''),
          escapeCsvCell(order.shippingAddress?.zip || ''),
          escapeCsvCell(order.shippingProvider || ''),
          escapeCsvCell(order.trackingNumber || ''),
          escapeCsvCell(order.requiresBilling ? 'SÍ' : 'NO'),
          escapeCsvCell(order.billingDetails?.rfc || ''),
          escapeCsvCell(order.billingDetails?.razonSocial || ''),
          escapeCsvCell(order.billingDetails?.regimenFiscal || ''),
          escapeCsvCell(order.billingDetails?.usoCFDI || ''),
          escapeCsvCell(order.billingDetails?.zip || ''),
          escapeCsvCell(itemsSummary),
          escapeCsvCell((order.subtotal || 0).toFixed(2)),
          escapeCsvCell((order.shippingCost || 0).toFixed(2)),
          escapeCsvCell((order.vatAmount || 0).toFixed(2)),
          escapeCsvCell((order.totalAmount || 0).toFixed(2)),
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      downloadCsv(csvContent, `BORARLY_Ventas_${new Date().toISOString().split('T')[0]}.csv`);
      toast({ title: 'Reporte Descargado', description: `${orders.length} pedidos exportados para Excel.` });
    } catch (error) {
      console.error('Error generando reporte de ventas:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el reporte de ventas.' });
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleDownloadQuotes = async () => {
    setGeneratingReport('quotes');
    toast({ title: 'Generando reporte de cotizaciones...', description: 'Obteniendo cotizaciones registradas.' });
    try {
      const quotes = await getQuotes();
      if (quotes.length === 0) {
        toast({ variant: 'destructive', title: 'Sin registros', description: 'No se encontraron cotizaciones para exportar.' });
        return;
      }

      const headers = [
        'Folio Cotización',
        'Cliente',
        'Email',
        'Estado',
        'Fecha Creación',
        'Fecha Vencimiento',
        'Artículos Cotizados',
        'Subtotal (MXN)',
        'Envío (MXN)',
        'IVA (MXN)',
        'Total (MXN)',
        'Notas',
      ];

      const rows = quotes.map(q => {
        const itemsSummary = (q.items || [])
          .map(i => `${i.quantity}x ${i.name} [${i.sku || i.productId}]`)
          .join(' | ');

        return [
          escapeCsvCell(q.quoteNumber),
          escapeCsvCell(q.customerName),
          escapeCsvCell(q.customerEmail),
          escapeCsvCell(q.status),
          escapeCsvCell(new Date(q.createdAt).toLocaleDateString('es-MX')),
          escapeCsvCell(new Date(q.expiresAt).toLocaleDateString('es-MX')),
          escapeCsvCell(itemsSummary),
          escapeCsvCell((q.subtotal || 0).toFixed(2)),
          escapeCsvCell((q.shippingCost || 0).toFixed(2)),
          escapeCsvCell((q.vatAmount || 0).toFixed(2)),
          escapeCsvCell((q.totalAmount || 0).toFixed(2)),
          escapeCsvCell(q.notes || ''),
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      downloadCsv(csvContent, `BORARLY_Cotizaciones_${new Date().toISOString().split('T')[0]}.csv`);
      toast({ title: 'Reporte Descargado', description: `${quotes.length} cotizaciones exportadas para Excel.` });
    } catch (error) {
      console.error('Error generando reporte de cotizaciones:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el reporte de cotizaciones.' });
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleDownloadCustomers = async () => {
    setGeneratingReport('customers');
    toast({ title: 'Generando directorio de clientes...', description: 'Consultando usuarios registrados.' });
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (snap.empty) {
        toast({ variant: 'destructive', title: 'Sin registros', description: 'No se encontraron clientes registrados.' });
        return;
      }

      const headers = [
        'UID',
        'Nombre',
        'Email',
        'Rol',
        'Teléfono Principal',
        'Ciudad / Estado',
        'Direcciones Guardadas',
        'RFC Principal',
        'Razón Social Principal',
      ];

      const rows = snap.docs.map(d => {
        const u = d.data();
        const primaryAddr = Array.isArray(u.savedAddresses) && u.savedAddresses.length > 0
          ? (u.savedAddresses.find((a: any) => a.isDefault) || u.savedAddresses[0])
          : u.address;
        const primaryBill = Array.isArray(u.savedBilling) && u.savedBilling.length > 0
          ? (u.savedBilling.find((b: any) => b.isDefault) || u.savedBilling[0])
          : null;

        return [
          escapeCsvCell(d.id),
          escapeCsvCell(u.displayName || ''),
          escapeCsvCell(u.email || ''),
          escapeCsvCell(u.role || 'customer'),
          escapeCsvCell(primaryAddr?.phone || u.phone || ''),
          escapeCsvCell(primaryAddr ? `${primaryAddr.city || ''} ${primaryAddr.state || ''}`.trim() : ''),
          escapeCsvCell(Array.isArray(u.savedAddresses) ? u.savedAddresses.length : (u.address?.street ? 1 : 0)),
          escapeCsvCell(primaryBill?.rfc || ''),
          escapeCsvCell(primaryBill?.razonSocial || ''),
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      downloadCsv(csvContent, `BORARLY_Clientes_${new Date().toISOString().split('T')[0]}.csv`);
      toast({ title: 'Reporte Descargado', description: `${snap.size} clientes exportados para Excel.` });
    } catch (error) {
      console.error('Error generando reporte de clientes:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el reporte de clientes.' });
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleDownloadCategories = async () => {
    setGeneratingReport('categories');
    toast({ title: 'Generando reporte de categorías...', description: 'Obteniendo estructura del catálogo.' });
    try {
      const categories = await getCategories();
      if (categories.length === 0) {
        toast({ variant: 'destructive', title: 'Sin categorías', description: 'No se encontraron categorías configuradas.' });
        return;
      }

      const headers = ['ID Syscom / Categoría', 'Nombre Original', 'Alias en Tienda', 'Nivel', 'ID Padre', 'Visible en Tienda', 'Destacada', 'En Navbar'];
      const rows = categories.map(cat => [
        escapeCsvCell(cat.id),
        escapeCsvCell(cat.name),
        escapeCsvCell(cat.alias || cat.name),
        escapeCsvCell(cat.level),
        escapeCsvCell(cat.parentId || ''),
        escapeCsvCell(cat.isVisible !== false ? 'SÍ' : 'NO'),
        escapeCsvCell(cat.isFeatured ? 'SÍ' : 'NO'),
        escapeCsvCell(cat.showInNavbar !== false ? 'SÍ' : 'NO'),
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      downloadCsv(csvContent, `BORARLY_Categorias_${new Date().toISOString().split('T')[0]}.csv`);
      toast({ title: 'Reporte Descargado', description: `${categories.length} categorías exportadas para Excel.` });
    } catch (error) {
      console.error('Error generando reporte de categorías:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el reporte de categorías.' });
    } finally {
      setGeneratingReport(null);
    }
  };

  const reportCards = [
    {
      id: 'sales',
      title: 'Reporte de Ventas y Facturación',
      description: 'Historial completo de pedidos con estatus, método de pago, guía logística, dirección de envío y datos fiscales (RFC, Razón Social, Uso CFDI).',
      icon: BarChart2,
      action: handleDownloadSales,
      buttonLabel: 'Descargar Excel de Ventas (.CSV)',
    },
    {
      id: 'quotes',
      title: 'Reporte de Cotizaciones B2B',
      description: 'Todas las cotizaciones emitidas con folios, clientes, vigencias, partidas cotizadas, descuentos y estado de aceptación.',
      icon: FileText,
      action: handleDownloadQuotes,
      buttonLabel: 'Descargar Cotizaciones (.CSV)',
    },
    {
      id: 'customers',
      title: 'Directorio de Clientes Registrados',
      description: 'Base de datos de usuarios registrados en la tienda con correo, teléfono de contacto, ubicación y datos de facturación guardados.',
      icon: Users,
      action: handleDownloadCustomers,
      buttonLabel: 'Descargar Clientes (.CSV)',
    },
    {
      id: 'categories',
      title: 'Estructura de Categorías',
      description: 'Listado de categorías sincronizadas, alias personalizados, visibilidad en tienda y configuración del menú principal.',
      icon: Tag,
      action: handleDownloadCategories,
      buttonLabel: 'Descargar Categorías (.CSV)',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
          <FileSpreadsheet className="h-4 w-4" />
          Exportación Compatible con Excel (UTF-8)
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Centro de Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Descarga archivos CSV optimizados para Microsoft Excel y Google Sheets con codificación de acentos.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {reportCards.map((card) => {
          const Icon = card.icon;
          const isBusy = generatingReport === card.id;
          return (
            <Card key={card.id} className="shadow-sm border-border flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  {card.title}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed pt-1">
                  {card.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={card.action}
                  disabled={generatingReport !== null}
                  className="w-full sm:w-auto font-semibold"
                >
                  {isBusy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {card.buttonLabel}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
