"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ShoppingBag, Package, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MercadoLibrePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<{ count: number; date: string } | null>(null);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsGenerating(true);
    toast({ title: 'Generando archivo...', description: 'Consultando stock de Mérida en Syscom. Esto puede tomar 1-2 minutos.' });

    try {
      const response = await fetch('/api/ml-export');
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Error ${response.status}`);
      }

      const count = response.headers.get('X-Product-Count') || '?';
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = response.headers.get('Content-Disposition') || '';
      const fileName = disposition.match(/filename="(.+)"/)?.[1] || `BORARLY_ML_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setLastResult({ count: Number(count), date: new Date().toLocaleString('es-MX') });
      toast({ title: 'Archivo descargado', description: `${count} productos con stock en Mérida exportados correctamente.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo generar el archivo.' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-background dark:bg-[#050c18] text-foreground dark:text-white min-h-full pb-16">
      {/* HEADER */}
      <div className="relative overflow-hidden border-b border-border dark:border-slate-800/60 bg-card dark:bg-gradient-to-r dark:from-[#07111f] dark:to-[#0b1a2e] px-4 sm:px-6 py-6 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,230,0,0.08),transparent_60%)]" />
        <div className="relative flex items-center justify-between flex-wrap gap-4 max-w-5xl">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600 dark:text-[#FFE600] mb-1">Integración</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground dark:text-white flex items-center gap-3">
              <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 dark:text-[#FFE600]" />
              Mercado Libre Export
            </h1>
            <p className="text-muted-foreground dark:text-slate-400 text-xs sm:text-sm mt-1">
              Genera un archivo XLSX listo para carga masiva en Mercado Libre México
            </p>
          </div>
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
            className="bg-[#FFE600] hover:bg-[#FFD000] text-slate-950 font-black text-sm sm:text-base px-6 py-3 h-11 rounded-xl shadow-md transition-all gap-2"
          >
            {isGenerating
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Generando...</>
              : <><Download className="w-5 h-5" /> Descargar XLSX</>
            }
          </Button>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 max-w-4xl">
        {/* RESULTADO ÚLTIMO EXPORT */}
        {lastResult && (
          <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-[#00E676] shrink-0" />
            <div>
              <p className="font-bold text-foreground dark:text-white">Último archivo generado exitosamente</p>
              <p className="text-sm text-muted-foreground dark:text-slate-400">{lastResult.count} productos · {lastResult.date}</p>
            </div>
          </div>
        )}

        {/* INFORMACIÓN */}
        <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-[#0b1120]/80 p-5 sm:p-6 space-y-5 shadow-sm">
          <h2 className="text-lg font-black text-foreground dark:text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            ¿Qué incluye el archivo?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Package, text: 'Solo productos con stock disponible en Mérida', color: 'text-emerald-600 dark:text-[#00E676]' },
              { icon: ShoppingBag, text: 'Tipo de publicación: Clásica (gratuita)', color: 'text-amber-600 dark:text-[#FFE600]' },
              { icon: CheckCircle2, text: 'Imágenes directas de catálogo (hasta 6 por producto)', color: 'text-primary' },
              { icon: CheckCircle2, text: 'Precio con IVA + margen de ganancia configurado', color: 'text-primary' },
              { icon: CheckCircle2, text: 'SKU = Modelo de fábrica (no ID interno)', color: 'text-primary' },
              { icon: CheckCircle2, text: 'Descripción enriquecida automáticamente', color: 'text-primary' },
            ].map(({ icon: Icon, text, color }, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground dark:text-slate-300">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* INSTRUCCIONES */}
        <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-[#0b1120]/80 p-5 sm:p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-black text-foreground dark:text-white">Pasos para publicar en Mercado Libre</h2>
          <ol className="space-y-3 text-sm text-muted-foreground dark:text-slate-300">
            {[
              'Haz clic en "Descargar XLSX" (tarda ~1-2 min por la consulta de catálogo).',
              'Abre el archivo. Revisa la hoja "Instrucciones" primero.',
              'Ve a mercadolibre.com.mx → Tu cuenta → Publicaciones → Carga masiva.',
              'Descarga la plantilla oficial de ML y copia los datos de tu archivo a esa plantilla.',
              'En el portal de ML asigna manualmente la categoría de cada grupo (Videovigilancia, Redes, etc.).',
              'Sube el archivo y ML procesará tu catálogo automáticamente.',
              'Repite el proceso cada vez que quieras actualizar precios o stock.',
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-black flex items-center justify-center">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ADVERTENCIA */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 text-sm text-muted-foreground dark:text-slate-300">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-foreground dark:text-white mb-1">Nota importante sobre imágenes</p>
            <p>
              Mercado Libre requiere que las imágenes sean accesibles públicamente. Las URLs incluidas funcionan directamente. Si alguna imagen es rechazada, súbela manualmente desde el panel de publicaciones de ML.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
