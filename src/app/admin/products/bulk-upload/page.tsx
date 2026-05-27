
"use client";

import { useState, ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileText, Loader2, Download, AlertTriangle, CheckCircle2, Edit } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FailedRowDetail {
  csvRowNumber: number;
  error?: string;
  name?: string;
  sku?: string;
  seccion_nombre?: string;
  linea_nombre?: string;
  serie_nombre?: string;
}

interface UploadReport {
  message: string;
  summary: {
    totalRows: number;
    successfullyAdded: number;
    successfullyUpdated: number;
    failed: number;
  };
  failedRowsDetails?: FailedRowDetail[];
}

export default function BulkUploadProductsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadReport, setUploadReport] = useState<UploadReport | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUploadReport(null);
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setSelectedFile(file);
      } else {
        toast({
          variant: "destructive",
          title: "Archivo no válido",
          description: "Por favor, selecciona un archivo CSV.",
        });
        setSelectedFile(null);
        event.target.value = "";
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "No hay archivo seleccionado",
        description: "Por favor, selecciona un archivo para procesar.",
      });
      return;
    }

    setIsProcessing(true);
    setUploadReport(null);
    toast({
      title: "Procesando archivo...",
      description: `Enviando "${selectedFile.name}" para procesamiento. Esto puede tardar unos momentos.`,
      duration: 5000,
    });

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/admin/bulk-upload-products', {
        method: 'POST',
        body: formData,
      });

      const result: UploadReport & { error?: string; details?: string } = await response.json();

      if (response.ok) {
        setUploadReport(result);
        toast({
          title: "Proceso de carga completado",
          description: result.message || "El archivo ha sido procesado.",
          duration: 7000,
        });
        setSelectedFile(null);
        const fileInput = document.getElementById('bulkProductFile') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = "";
        }
      } else {
        setUploadReport({
            message: result.error || result.details || "Error desconocido durante la carga.",
            summary: result.summary || { totalRows: 0, successfullyAdded: 0, successfullyUpdated: 0, failed: 0 },
            failedRowsDetails: result.failedRowsDetails || []
        });
        toast({
          variant: "destructive",
          title: "Error en la carga",
          description: result.error || result.details || "Ocurrió un error al procesar el archivo.",
          duration: 10000,
        });
      }
    } catch (error) {
      console.error("Error al enviar el archivo:", error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo conectar con el servidor.";
      setUploadReport({
        message: `Error de Red: ${errorMessage}`,
        summary: { totalRows: 0, successfullyAdded: 0, successfullyUpdated: 0, failed: 0 },
        failedRowsDetails: []
      });
      toast({
        variant: "destructive",
        title: "Error de Red",
        description: "No se pudo conectar con el servidor para procesar el archivo.",
        duration: 10000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

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

  const handleDownloadTemplate = () => {
    const headers = ['sku', 'name', 'description', 'brand', 'costPrice', 'currency', 'profitMargin', 'seccion_nombre', 'linea_nombre', 'serie_nombre', 'stock', 'imageUrls', 'isFeatured'];
    
    const exampleRow1 = [
      escapeCsvCell("SKU-LPX-001"),
      escapeCsvCell("Laptop Modelo X (USD)"),
      escapeCsvCell("Potente laptop con 16GB RAM y SSD 512GB."),
      escapeCsvCell("HP"),
      escapeCsvCell(600.00),
      escapeCsvCell("USD"),
      escapeCsvCell(25), // 25% profit margin
      escapeCsvCell("Tecnología"), // seccion_nombre
      escapeCsvCell("Laptops"),    // linea_nombre
      escapeCsvCell("Gaming"),      // serie_nombre
      escapeCsvCell(15),
      escapeCsvCell("https://example.com/laptop_image1.jpg,https://example.com/laptop_image2.jpg"),
      escapeCsvCell("TRUE")
    ];
    const exampleRow2 = [
      escapeCsvCell("SKU-TSH-ORG-M"),
      escapeCsvCell("Camiseta Algodón Orgánico (MXN)"),
      escapeCsvCell("Camiseta suave y cómoda, 100% algodón orgánico."),
      escapeCsvCell("MiMarca"),
      escapeCsvCell(350.00),
      escapeCsvCell("MXN"),
      escapeCsvCell(40), // 40% profit margin
      escapeCsvCell("Ropa"),          // seccion_nombre
      escapeCsvCell("Playeras"),     // linea_nombre
      escapeCsvCell("Manga Corta"),  // serie_nombre
      escapeCsvCell(50),
      escapeCsvCell("https://example.com/tshirt_image.png"),
      escapeCsvCell("FALSE")
    ];
    
    const exampleUpdateRow = [
      escapeCsvCell("SKU-LPX-001"), // Existing SKU
      escapeCsvCell(""), // Name can be empty to keep the old one
      escapeCsvCell(""), // Description can be empty
      escapeCsvCell(""), // Brand can be empty
      escapeCsvCell(580.00), // New costPrice
      escapeCsvCell(""), // Currency can be empty
      escapeCsvCell(30), // New profitMargin
      escapeCsvCell(""), // Category can be empty
      escapeCsvCell(""),
      escapeCsvCell(""),
      escapeCsvCell(10), // New stock
      escapeCsvCell(""), // ImageUrls can be empty
      escapeCsvCell("") // isFeatured can be empty
    ];

    const csvContent = [
      headers.join(','),
      `// --- Ejemplo de creación de productos nuevos ---`,
      exampleRow1.join(','),
      exampleRow2.join(','),
      `// --- Ejemplo de actualización de un producto existente (SKU-LPX-001) ---`,
      `// --- Solo los campos con valores nuevos serán actualizados. Los campos vacíos se ignorarán. ---`,
      exampleUpdateRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-t8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_carga_masiva_productos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Plantilla Descargada", description: "La plantilla CSV ha sido descargada." });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">Carga y Actualización Masiva</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
                <CardTitle>Subir Archivo de Productos</CardTitle>
                <CardDescription>
                    Sube un archivo CSV para crear productos nuevos o actualizar existentes usando su SKU.
                </CardDescription>
            </div>
            <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Descargar Plantilla
            </Button>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bulkProductFile" className="text-base">Seleccionar Archivo CSV</Label>
              <div className="flex items-center gap-3 p-4 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                <UploadCloud className="h-10 w-10 text-muted-foreground" />
                <Input
                  id="bulkProductFile"
                  type="file"
                  accept=".csv, text/csv"
                  onChange={handleFileChange}
                  className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  disabled={isProcessing}
                />
              </div>
            </div>

            {selectedFile && (
              <div className="p-3 border rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!selectedFile || isProcessing}>
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              {isProcessing ? 'Procesando...' : 'Procesar Archivo'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {uploadReport && (
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle>Resultados de la Carga</CardTitle>
            <CardDescription>{uploadReport.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-center">
                <div className="p-3 bg-gray-100 dark:bg-gray-900/30 rounded">
                    <p className="text-sm text-gray-700 dark:text-gray-300">Filas Totales</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{uploadReport.summary.totalRows}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded">
                    <p className="text-sm text-green-700 dark:text-green-300">Creados</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">{uploadReport.summary.successfullyAdded}</p>
                </div>
                 <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded">
                    <p className="text-sm text-blue-700 dark:text-blue-300">Actualizados</p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{uploadReport.summary.successfullyUpdated}</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded">
                    <p className="text-sm text-red-700 dark:text-red-300">Fallidos</p>
                    <p className="text-2xl font-bold text-red-800 dark:text-red-200">{uploadReport.summary.failed}</p>
                </div>
            </div>

            {uploadReport.failedRowsDetails && uploadReport.failedRowsDetails.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5"/> Detalles de Filas Fallidas:</h3>
                <ScrollArea className="h-[200px] border rounded-md p-3 bg-muted/30">
                  <ul className="space-y-2 text-sm">
                    {uploadReport.failedRowsDetails.map((item, index) => (
                      <li key={index} className="p-2 border-b border-destructive/20 dark:border-destructive/40">
                        <p><strong>Fila CSV (aprox.):</strong> {item.csvRowNumber}</p>
                        {item.sku && <p><strong>SKU:</strong> {item.sku}</p>}
                        {item.name && <p><strong>Nombre Producto:</strong> {item.name}</p>}
                        {(item.seccion_nombre || item.linea_nombre || item.serie_nombre) && (
                            <p><strong>Categoría Intentada:</strong> {`${item.seccion_nombre || '?'} > ${item.linea_nombre || '?'} > ${item.serie_nombre || '?'}`}</p>
                        )}
                        <p className="text-destructive"><strong>Error:</strong> {item.error || 'Error desconocido'}</p>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
            {uploadReport.summary.failed === 0 && (uploadReport.summary.successfullyAdded > 0 || uploadReport.summary.successfullyUpdated > 0) && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md flex items-center text-green-700 dark:text-green-300">
                    <CheckCircle2 className="mr-2 h-5 w-5"/>
                    <p>Todos los productos válidos se procesaron exitosamente.</p>
                </div>
            )}
          </CardContent>
        </Card>
      )}

       <Card>
        <CardHeader>
            <CardTitle className="text-lg">Instrucciones y Formato Esperado</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
            <p>El archivo CSV debe tener las siguientes columnas como encabezado en la primera fila:</p>
            <pre className="p-2 bg-muted rounded-md text-xs overflow-x-auto">
                <code>sku,name,description,brand,costPrice,currency,profitMargin,seccion_nombre,linea_nombre,serie_nombre,stock,imageUrls,isFeatured</code>
            </pre>
            <p className="font-semibold">Puntos Clave para la Actualización:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
                <li>Para <strong>actualizar un producto existente</strong>, solo incluye la columna <strong>`sku`</strong> y las columnas que deseas cambiar.</li>
                <li>Los campos que dejes <strong>en blanco</strong> en una fila de actualización se <strong>ignorarán</strong> y no modificarán los datos existentes del producto.</li>
                <li>Para <strong>crear un producto nuevo</strong>, los siguientes campos son requeridos: `sku`, `name`, `costPrice`, `currency`, `profitMargin`, y los tres campos de categoría.</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
                <strong>Nota Importante:</strong> El sistema creará las categorías (Sección, Línea, Serie) si no existen, manteniendo la jerarquía.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}
