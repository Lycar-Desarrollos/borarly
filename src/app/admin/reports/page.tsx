
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, FileText, BarChart2 } from 'lucide-react';
import { getProducts, getCategories } from '@/services/productService';
import { fetchAllOrders } from '@/services/orderService';
import type { Product, Order, Category } from '@/lib/types';

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
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
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
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

  const handleDownloadInventory = async () => {
    setIsGenerating(true);
    toast({ title: 'Generando reporte...', description: 'Obteniendo datos de inventario. Esto puede tardar un momento.' });
    try {
      const [products, categories] = await Promise.all([getProducts(), getCategories()]);
      
      if (products.length === 0) {
        toast({ variant: 'destructive', title: 'No hay productos', description: 'No se encontraron productos para generar el reporte.' });
        return;
      }
      
      const categoryMap = new Map(categories.map(c => [c.id, c]));

      const headers = ['SKU', 'Nombre', 'Marca', 'Sección', 'Línea', 'Serie', 'Stock', 'Costo', 'Margen (%)', 'Moneda Costo', 'Precio Final (MXN)'];
      const rows = products.map(product => {
        let seccion = 'N/A', linea = 'N/A', serie = 'N/A';
        const serieCat = categoryMap.get(product.category);
        if (serieCat) {
            serie = serieCat.name;
            const lineaCat = categoryMap.get(serieCat.parentId || '');
            if (lineaCat) {
                linea = lineaCat.name;
                const seccionCat = categoryMap.get(lineaCat.parentId || '');
                if (seccionCat) {
                    seccion = seccionCat.name;
                }
            }
        }
        
        return [
          escapeCsvCell(product.id),
          escapeCsvCell(product.name),
          escapeCsvCell(product.brand),
          escapeCsvCell(seccion),
          escapeCsvCell(linea),
          escapeCsvCell(serie),
          escapeCsvCell(product.stock),
          escapeCsvCell(product.costPrice.toFixed(2)),
          escapeCsvCell(product.profitMargin),
          escapeCsvCell(product.currency),
          escapeCsvCell(product.price.toFixed(2)),
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      downloadCsv(csvContent, `reporte_inventario_${new Date().toISOString().split('T')[0]}.csv`);
      toast({ title: 'Reporte Descargado', description: 'El reporte de inventario se ha descargado exitosamente.' });

    } catch (error) {
      console.error('Error generando reporte de inventario:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el reporte de inventario.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSales = async () => {
    setIsGenerating(true);
    toast({ title: 'Generando reporte...', description: 'Obteniendo datos de ventas. Esto puede tardar un momento.' });
    try {
        const orders = await fetchAllOrders();
        if (orders.length === 0) {
            toast({ variant: 'destructive', title: 'No hay ventas', description: 'No se encontraron pedidos para generar el reporte.' });
            return;
        }

        const headers = ['ID Pedido', 'Fecha', 'ID Cliente', 'Email Cliente', 'Estado', 'Subtotal', 'Envío', 'IVA', 'Total'];
        const rows = orders.map(order => [
            escapeCsvCell(order.id),
            escapeCsvCell(new Date(order.createdAt).toLocaleString('es-MX')),
            escapeCsvCell(order.userId),
            escapeCsvCell(order.shippingAddress?.contactEmail),
            escapeCsvCell(order.status),
            escapeCsvCell(order.subtotal.toFixed(2)),
            escapeCsvCell(order.shippingCost.toFixed(2)),
            escapeCsvCell(order.vatAmount.toFixed(2)),
            escapeCsvCell(order.totalAmount.toFixed(2)),
        ].join(','));

        const csvContent = [headers.join(','), ...rows].join('\n');
        downloadCsv(csvContent, `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`);
        toast({ title: 'Reporte Descargado', description: 'El reporte de ventas se ha descargado exitosamente.' });

    } catch (error) {
        console.error('Error generando reporte de ventas:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el reporte de ventas.' });
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Generador de Reportes</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-6 w-6 text-primary"/> Reporte de Inventario</CardTitle>
            <CardDescription>Descarga un archivo CSV con todos los productos, su stock, categorías y precios.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDownloadInventory} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Descargar Inventario
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart2 className="h-6 w-6 text-primary"/> Reporte de Ventas</CardTitle>
            <CardDescription>Descarga un archivo CSV con el historial completo de pedidos y sus totales.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDownloadSales} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Descargar Ventas
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
