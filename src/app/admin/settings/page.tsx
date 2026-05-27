"use client";

import { useState, useEffect, FormEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, DollarSign, Percent, TrendingUp, CheckCircle2, Truck, Settings2, ImageIcon, Upload, X, Building2, CreditCard } from 'lucide-react';
import { 
    getShippingSettings, 
    updateShippingSettings, 
    getVatRate,
    updateVatRate,
    getProfitMargin,
    updateProfitMargin,
    getQuoteLogoUrl,
    updateQuoteLogo,
    getBankDetails,
    updateBankDetails,
    type BankDetails,
} from '@/services/settingsService';

export default function AdminSettingsPage() {
  const [shippingCost, setShippingCost] = useState<number | string>('');
  const [vatRate, setVatRate] = useState<number | string>('');
  const [profitMargin, setProfitMargin] = useState<number | string>('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Logo
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Datos de empresa y bancarios
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    companyName: 'BORARLY',
    email: 'contacto@BORARLY.com',
    phone: '+52 999 310 1452',
    beneficiary: 'BORARLY',
    clabe: '012 180 01576278534 6',
    bank: 'BBVA',
  });
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [savedBank, setSavedBank] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const [shippingSettings, vat, profit, logoUrl, bank] = await Promise.all([
            getShippingSettings(),
            getVatRate(),
            getProfitMargin(),
            getQuoteLogoUrl(),
            getBankDetails(),
        ]);
        setShippingCost(shippingSettings.cost);
        setVatRate(vat * 100);
        setProfitMargin(profit * 100);
        setCurrentLogoUrl(logoUrl);
        setBankDetails(bank);
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las configuraciones." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleSaveBankDetails = async () => {
    setIsSavingBank(true);
    setSavedBank(false);
    try {
      await updateBankDetails(bankDetails);
      setSavedBank(true);
      toast({ title: '¡Guardado!', description: 'Datos de empresa y bancarios actualizados correctamente.' });
      setTimeout(() => setSavedBank(false), 3000);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron guardar los datos bancarios.' });
    } finally {
      setIsSavingBank(false);
    }
  };
  
  const handleSaveAll = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    
    const costValue = Number(shippingCost);
    const vatValue = Number(vatRate) / 100;
    const profitValue = Number(profitMargin) / 100;

    if (isNaN(costValue) || costValue < 0 || isNaN(vatValue) || vatValue < 0 || isNaN(profitValue) || profitValue < 0) {
      toast({ variant: "destructive", title: "Valores Inválidos", description: "Todos los valores deben ser números positivos." });
      setIsSaving(false);
      return;
    }

    try {
      await Promise.all([
          updateShippingSettings(costValue, 0),
          updateVatRate(vatValue),
          updateProfitMargin(profitValue),
      ]);
      setSaved(true);
      toast({ title: "¡Éxito!", description: "Configuración Maestra guardada. Los precios se actualizarán en ~60 segundos." });
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar las configuraciones." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setIsUploadingLogo(true);
    try {
      const newUrl = await updateQuoteLogo(logoFile);
      setCurrentLogoUrl(newUrl);
      setLogoPreview(null);
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast({ title: "Logo Actualizado", description: "El logo se ha guardado correctamente." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo subir el logo." });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const profitNum = Number(profitMargin);
  const vatNum = Number(vatRate);
  const exampleBase = 1000;
  const exampleWithMargin = exampleBase * (1 + profitNum / 100);
  const exampleFinal = exampleWithMargin * (1 + vatNum / 100);

  return (
    <div className="min-h-full bg-background text-foreground pb-16">
      {/* HEADER — theme-aware */}
      <div className="relative overflow-hidden border-b border-border bg-card px-6 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,112,255,0.06),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(0,112,255,0.12),transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Settings2 className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">Motor de Precios</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground leading-none mb-2">
            Configuración Maestra
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Controla la ganancia, los impuestos y el envío desde un solo lugar. Todos los precios de la tienda se recalculan automáticamente.
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <form onSubmit={handleSaveAll} className="max-w-4xl mx-auto px-6 pt-10 space-y-6">
        
        {/* PREVIEW CARD */}
        {!isLoading && (
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500 mb-3">Vista Previa del Cálculo</p>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Costo Syscom</p>
                <p className="text-xl font-black text-foreground">$1,000</p>
              </div>
              <div className="text-muted-foreground font-bold text-xl">→</div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">+ Margen {profitNum}%</p>
                <p className="text-xl font-black text-foreground">${exampleWithMargin.toLocaleString('es-MX', {minimumFractionDigits: 0})}</p>
              </div>
              <div className="text-muted-foreground font-bold text-xl">→</div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">+ IVA {vatNum}%</p>
                <p className="text-2xl font-black text-emerald-500">${exampleFinal.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-muted-foreground">+ Envío</p>
                <p className="text-lg font-black text-primary">${Number(shippingCost).toLocaleString('es-MX')} MXN</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-5">
          {/* GANANCIA */}
          <div className="relative group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors duration-300">
            <div className="relative space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-primary">Ganancia</p>
                  <p className="text-[10px] text-muted-foreground">Margen de utilidad</p>
                </div>
              </div>
              <div>
                <Label htmlFor="profitMargin" className="text-xs text-muted-foreground mb-1.5 block">Margen de Utilidad (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input
                    id="profitMargin"
                    type="number"
                    step="0.1"
                    min="0"
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(e.target.value)}
                    className="pl-10 text-2xl font-black h-14 focus:border-primary transition-colors"
                    placeholder="20"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  $1,000 → <span className="text-foreground font-bold">${(1000 * (1 + profitNum/100)).toFixed(0)}</span> después de margen
                </p>
              </div>
            </div>
          </div>

          {/* IVA */}
          <div className="relative group rounded-2xl border border-border bg-card p-5 hover:border-amber-500/40 transition-colors duration-300">
            <div className="relative space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Percent className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-amber-500">IVA</p>
                  <p className="text-[10px] text-muted-foreground">Impuesto al valor agregado</p>
                </div>
              </div>
              <div>
                <Label htmlFor="vatRate" className="text-xs text-muted-foreground mb-1.5 block">Tasa de IVA (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/60" />
                  <Input
                    id="vatRate"
                    type="number"
                    step="1"
                    min="0"
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                    className="pl-10 text-2xl font-black h-14 focus:border-amber-500 transition-colors"
                    placeholder="16"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Se cobra al cliente final sobre el precio con margen
                </p>
              </div>
            </div>
          </div>

          {/* ENVÍO */}
          <div className="relative group rounded-2xl border border-border bg-card p-5 hover:border-emerald-500/40 transition-colors duration-300">
            <div className="relative space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Truck className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-500">Envío</p>
                  <p className="text-[10px] text-muted-foreground">Tarifa plana fija</p>
                </div>
              </div>
              <div>
                <Label htmlFor="shippingCost" className="text-xs text-muted-foreground mb-1.5 block">Costo Envío Fijo (MXN)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/60" />
                  <Input
                    id="shippingCost"
                    type="number"
                    step="0.50"
                    min="0"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    className="pl-10 text-2xl font-black h-14 focus:border-emerald-500 transition-colors"
                    placeholder="180"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Se suma al total en el carrito de compras
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            size="lg"
            disabled={isLoading || isSaving}
            className={`h-14 px-10 text-base font-black rounded-xl transition-all duration-300 shadow-lg ${
              saved
                ? 'bg-emerald-500 hover:bg-emerald-600 text-black'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {isSaving ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Guardando...</>
            ) : saved ? (
              <><CheckCircle2 className="mr-2 h-5 w-5" /> ¡Guardado con Éxito!</>
            ) : (
              <><Save className="mr-2 h-5 w-5" /> Guardar Configuración Maestra</>
            )}
          </Button>
        </div>
      </form>

      {/* LOGO SECTION — separate from the pricing form */}
      <div className="max-w-4xl mx-auto px-6 pt-8 pb-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <ImageIcon className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="font-bold text-foreground">Logo de la Empresa</p>
              <p className="text-xs text-muted-foreground">Se muestra en cotizaciones y en el PDF</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Current logo preview */}
            <div className="flex-shrink-0">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Logo actual</p>
              <div className="w-48 h-24 rounded-xl border-2 border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden">
                {currentLogoUrl ? (
                  <img src={currentLogoUrl} alt="Logo actual" className="max-h-20 max-w-44 object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImageIcon className="h-6 w-6 opacity-40" />
                    <p className="text-[10px]">Sin logo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload area */}
            <div className="flex-1 space-y-3">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Subir nuevo logo (PNG, SVG recomendado)</p>
              
              {logoPreview && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                  <img src={logoPreview} alt="Vista previa" className="h-12 max-w-32 object-contain bg-white rounded p-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{logoFile?.name}</p>
                    <p className="text-xs text-muted-foreground">{logoFile ? (logoFile.size / 1024).toFixed(0) + ' KB' : ''}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => { setLogoPreview(null); setLogoFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Elegir archivo
                </Button>
                {logoFile && (
                  <Button
                    type="button"
                    onClick={handleLogoUpload}
                    disabled={isUploadingLogo}
                    className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {isUploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isUploadingLogo ? 'Subiendo...' : 'Guardar Logo'}
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoFileChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* DATOS DE EMPRESA Y BANCARIOS */}
      <div className="max-w-4xl mx-auto px-6 pt-2 pb-16">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-foreground">Datos de Empresa y Pago</p>
              <p className="text-xs text-muted-foreground">Se usan en todas las cotizaciones PDF generadas</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="text-xs text-muted-foreground">Nombre de la Empresa</Label>
              <Input id="companyName" value={bankDetails.companyName}
                onChange={e => setBankDetails(p => ({ ...p, companyName: e.target.value }))}
                placeholder="BORARLY" disabled={isLoading} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="companyEmail" className="text-xs text-muted-foreground">Correo de Contacto</Label>
              <Input id="companyEmail" value={bankDetails.email}
                onChange={e => setBankDetails(p => ({ ...p, email: e.target.value }))}
                placeholder="contacto@BORARLY.com" disabled={isLoading} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="companyPhone" className="text-xs text-muted-foreground">Teléfono</Label>
              <Input id="companyPhone" value={bankDetails.phone}
                onChange={e => setBankDetails(p => ({ ...p, phone: e.target.value }))}
                placeholder="+52 999 310 1452" disabled={isLoading} />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-semibold text-foreground">Datos Bancarios para PDF</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="beneficiary" className="text-xs text-muted-foreground">Beneficiario</Label>
                <Input id="beneficiary" value={bankDetails.beneficiary}
                  onChange={e => setBankDetails(p => ({ ...p, beneficiary: e.target.value }))}
                  placeholder="BORARLY" disabled={isLoading} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bank" className="text-xs text-muted-foreground">Banco</Label>
                <Input id="bank" value={bankDetails.bank}
                  onChange={e => setBankDetails(p => ({ ...p, bank: e.target.value }))}
                  placeholder="BBVA" disabled={isLoading} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="clabe" className="text-xs text-muted-foreground">Cuenta CLABE</Label>
                <Input id="clabe" value={bankDetails.clabe}
                  onChange={e => setBankDetails(p => ({ ...p, clabe: e.target.value }))}
                  placeholder="012 180 01576278534 6" disabled={isLoading} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleSaveBankDetails}
              disabled={isLoading || isSavingBank}
              className={`h-11 px-8 font-bold rounded-xl transition-all duration-300 ${
                savedBank ? 'bg-emerald-500 hover:bg-emerald-600 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSavingBank ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
              ) : savedBank ? (
                <><CheckCircle2 className="mr-2 h-4 w-4" />¡Guardado!</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />Guardar Datos Bancarios</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
