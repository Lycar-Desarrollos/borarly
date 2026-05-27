"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { Loader2, FileText, Plus, Trash2, Building2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { BillingData } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BillingPage() {
    const { userProfile, currentUser, loading, setUserProfile } = useAuth();
    const { toast } = useToast();
    const [billingList, setBillingList] = useState<BillingData[]>([]);
    
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [newBillingForm, setNewBillingForm] = useState<BillingData>({
        id: '', alias: 'Mi Empresa', rfc: '', razonSocial: '', regimenFiscal: '601', usoCFDI: 'G03', zip: '', email: '', isDefault: false
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (userProfile?.savedBilling) {
            setBillingList(userProfile.savedBilling);
        }
    }, [userProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Transformar RFC a mayúsculas
        if (name === 'rfc') {
            setNewBillingForm(prev => ({ ...prev, [name]: value.toUpperCase() }));
        } else {
            setNewBillingForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setNewBillingForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveBilling = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsSaving(true);
        try {
            const newBill = { ...newBillingForm, id: `bill_${Date.now()}` };
            const updatedList = [...billingList, newBill];
            
            await setDoc(doc(db, 'users', currentUser.uid), {
                savedBilling: updatedList
            }, { merge: true });
            
            setBillingList(updatedList);
            setUserProfile(prev => prev ? { ...prev, savedBilling: updatedList } : null);
            setIsAddingMode(false);
            setNewBillingForm({
                id: '', alias: '', rfc: '', razonSocial: '', regimenFiscal: '601', usoCFDI: 'G03', zip: '', email: '', isDefault: false
            });
            toast({ title: "Datos Guardados", description: "Tus datos fiscales fueron agregados correctamente." });
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message || "No pudimos guardar los datos", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBilling = async (idToDelete: string) => {
        if (!currentUser) return;
        try {
            const updatedList = billingList.filter(b => b.id !== idToDelete);
            await setDoc(doc(db, 'users', currentUser.uid), {
                savedBilling: updatedList
            }, { merge: true });
            setBillingList(updatedList);
            setUserProfile(prev => prev ? { ...prev, savedBilling: updatedList } : null);
            toast({ title: "Datos Eliminados" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "No pudimos eliminar los datos", variant: "destructive" });
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-foreground">Datos de Facturación</h2>
                    <p className="text-muted-foreground mt-1">Configura tu RFC y CFDI 4.0 para agilizar tu compra.</p>
                </div>
                {!isAddingMode && (
                    <Button onClick={() => setIsAddingMode(true)} className="gap-2 rounded-full w-full sm:w-auto">
                        <Plus className="w-4 h-4"/> Nuevo RFC
                    </Button>
                )}
            </div>

            {isAddingMode && (
                <Card className="border-blue-500/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4">
                    <div className="bg-blue-500/5 px-6 py-4 border-b border-blue-500/10">
                        <CardTitle className="text-blue-600 dark:text-blue-400 flex items-center gap-2">
                           <FileText className="w-5 h-5"/> Alta de Identificación Fiscal
                        </CardTitle>
                    </div>
                    <CardContent className="p-6">
                        <form onSubmit={handleSaveBilling} className="space-y-5">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                 <div className="space-y-1">
                                    <Label className="text-muted-foreground">Identificador Opcional (Alias)</Label>
                                    <Input name="alias" value={newBillingForm.alias} onChange={handleInputChange} required placeholder="Ej. Corporativo, Profesional" className="bg-muted/30"/>
                                 </div>
                                 <div className="space-y-1">
                                    <Label className="text-muted-foreground">RFC (Obligatorio)</Label>
                                    <Input name="rfc" value={newBillingForm.rfc} onChange={handleInputChange} required minLength={12} maxLength={13} placeholder="XAXX010101000" className="bg-muted/30 uppercase font-mono"/>
                                 </div>
                             </div>
                             <div className="space-y-1">
                                <Label className="text-muted-foreground">Razón Social o Nombre Completo</Label>
                                <Input name="razonSocial" value={newBillingForm.razonSocial} onChange={handleInputChange} required placeholder="De acuerdo a Constancia de Situación Fiscal" className="bg-muted/30 uppercase"/>
                             </div>
                             
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                 <div className="space-y-1">
                                    <Label className="text-muted-foreground">Régimen Fiscal</Label>
                                    <Select value={newBillingForm.regimenFiscal} onValueChange={(val) => handleSelectChange('regimenFiscal', val)}>
                                        <SelectTrigger className="bg-muted/30 backdrop-blur-sm">
                                            <SelectValue placeholder="Seleccione Régimen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="601">601 - General de Ley Personas Morales</SelectItem>
                                            <SelectItem value="603">603 - Personas Morales con Fines no Lucrativos</SelectItem>
                                            <SelectItem value="605">605 - Sueldos y Salarios e Ingresos Asimilados</SelectItem>
                                            <SelectItem value="606">606 - Arrendamiento</SelectItem>
                                            <SelectItem value="612">612 - Personas Físicas con Actividades Empresariales</SelectItem>
                                            <SelectItem value="616">616 - Sin obligaciones fiscales</SelectItem>
                                            <SelectItem value="626">626 - Régimen Simplificado de Confianza (RESICO)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                 </div>
                                 <div className="space-y-1">
                                    <Label className="text-muted-foreground">Uso de CFDI</Label>
                                    <Select value={newBillingForm.usoCFDI} onValueChange={(val) => handleSelectChange('usoCFDI', val)}>
                                        <SelectTrigger className="bg-muted/30 backdrop-blur-sm">
                                            <SelectValue placeholder="Seleccione Uso" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="G01">G01 - Adquisición de mercancías</SelectItem>
                                            <SelectItem value="G03">G03 - Gastos en general</SelectItem>
                                            <SelectItem value="I04">I04 - Equipo de cómputo y accesorios</SelectItem>
                                            <SelectItem value="I08">I08 - Otra maquinaria y equipo</SelectItem>
                                            <SelectItem value="S01">S01 - Sin efectos fiscales</SelectItem>
                                        </SelectContent>
                                    </Select>
                                 </div>
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Código Postal Fiscal</Label>
                                    <Input name="zip" value={newBillingForm.zip} onChange={handleInputChange} required maxLength={5} placeholder="00000" className="bg-muted/30 font-mono"/>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Correo de Facturación</Label>
                                    <Input name="email" type="email" value={newBillingForm.email} onChange={handleInputChange} required placeholder="facturas@empresa.com" className="bg-muted/30"/>
                                </div>
                             </div>

                             <div className="flex gap-3 justify-end pt-4 border-t border-border/50">
                                 <Button variant="outline" type="button" onClick={() => setIsAddingMode(false)}>Cancelar</Button>
                                 <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                                    Guardar Datos
                                </Button>
                             </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {!isAddingMode && billingList.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">No tienes datos de facturación registrados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {billingList.map(bill => (
                        <Card key={bill.id} className="relative overflow-hidden group shadow-sm hover:shadow-md transition-all border-border">
                            <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                        <Building2 className="w-4 h-4"/> {bill.alias}
                                    </CardTitle>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteBilling(bill.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-1.5 text-sm text-muted-foreground">
                                <p className="font-bold text-foreground text-base tracking-widest">{bill.rfc}</p>
                                <p className="leading-snug">{bill.razonSocial}</p>
                                <p className="pt-2"><span className="font-semibold text-foreground/70">CP Fiscal:</span> {bill.zip}</p>
                                <p><span className="font-semibold text-foreground/70">CFDI:</span> {bill.usoCFDI}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
