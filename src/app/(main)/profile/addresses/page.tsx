"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { Loader2, MapPin, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { UserAddress } from '@/lib/types';

export default function AddressesPage() {
    const { userProfile, currentUser, loading, setUserProfile } = useAuth();
    const { toast } = useToast();
    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [newAddressForm, setNewAddressForm] = useState<UserAddress>({
        id: '', alias: 'Mi Nueva Dirección', firstName: '', lastName: '', street: '', city: '', state: '', zip: '', country: 'México', phone: '', isDefault: false
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (userProfile?.savedAddresses) {
            setAddresses(userProfile.savedAddresses);
        } else if (userProfile && userProfile.address && userProfile.address.street) {
             const names = (userProfile.displayName || '').split(' ');
             const legacyAddr: UserAddress = {
                 id: 'legacy-1',
                 alias: 'Dirección Principal',
                 firstName: names[0] || '',
                 lastName: names.slice(1).join(' ') || '',
                 street: userProfile.address.street || '',
                 city: userProfile.address.city || '',
                 state: (userProfile.address as any).state || userProfile.address.city || '',
                 zip: userProfile.address.zip || '',
                 country: userProfile.address.country || 'México',
                 phone: userProfile.address.phone || '',
                 isDefault: true
             };
             setAddresses([legacyAddr]);
        }
    }, [userProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewAddressForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsSaving(true);
        try {
            const newAddr = { ...newAddressForm, id: `addr_${Date.now()}` };
            const updatedAddresses = [...addresses, newAddr];
            
            await setDoc(doc(db, 'users', currentUser.uid), {
                savedAddresses: updatedAddresses
            }, { merge: true });
            
            setAddresses(updatedAddresses);
            setUserProfile(prev => prev ? { ...prev, savedAddresses: updatedAddresses } : null);
            setIsAddingMode(false);
            setNewAddressForm({
                id: '', alias: '', firstName: '', lastName: '', street: '', city: '', state: '', zip: '', country: 'México', phone: '', isDefault: false
            });
            toast({ title: "Dirección Guardada", description: "La dirección fue agregada a tu libreta." });
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error en Base de Datos", description: error.message || "No pudimos guardar la dirección", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAddress = async (idToDelete: string) => {
        if (!currentUser) return;
        try {
            const updatedAddresses = addresses.filter(a => a.id !== idToDelete);
            await updateDoc(doc(db, 'users', currentUser.uid), {
                savedAddresses: updatedAddresses
            });
            setAddresses(updatedAddresses);
            setUserProfile(prev => prev ? { ...prev, savedAddresses: updatedAddresses } : null);
            toast({ title: "Dirección Eliminada" });
        } catch (error) {
            toast({ title: "Error", description: "No pudimos eliminar la dirección", variant: "destructive" });
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-foreground">Libreta de Direcciones</h2>
                    <p className="text-muted-foreground mt-1">Gestiona las direcciones que aparecerán listas en tu Checkout.</p>
                </div>
                {!isAddingMode && (
                    <Button onClick={() => setIsAddingMode(true)} className="gap-2 rounded-full">
                        <Plus className="w-4 h-4"/> Agregar Dirección
                    </Button>
                )}
            </div>

            {isAddingMode && (
                <Card className="border-primary/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4">
                    <div className="bg-primary/5 px-6 py-4 border-b border-primary/10">
                        <CardTitle className="text-primary flex items-center gap-2">
                           <MapPin className="w-5 h-5"/> Crear Nueva Dirección
                        </CardTitle>
                    </div>
                    <CardContent className="p-6">
                        <form onSubmit={handleSaveAddress} className="space-y-5">
                             <div className="space-y-1">
                                <Label className="text-muted-foreground">Guardar como (Alias)</Label>
                                <Input name="alias" value={newAddressForm.alias} onChange={handleInputChange} required placeholder="Ej. Casa, Oficina" className="bg-muted/30"/>
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Nombre</Label>
                                    <Input name="firstName" value={newAddressForm.firstName} onChange={handleInputChange} required className="bg-muted/30"/>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Apellidos</Label>
                                    <Input name="lastName" value={newAddressForm.lastName} onChange={handleInputChange} required className="bg-muted/30"/>
                                </div>
                             </div>
                             <div className="space-y-1">
                                <Label className="text-muted-foreground">Dirección (Calle y número)</Label>
                                <Input name="street" value={newAddressForm.street} onChange={handleInputChange} required className="bg-muted/30"/>
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <div className="sm:col-span-2 space-y-1">
                                    <Label className="text-muted-foreground">Ciudad / Municipio</Label>
                                    <Input name="city" value={newAddressForm.city} onChange={handleInputChange} required className="bg-muted/30"/>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Cód. Postal</Label>
                                    <Input name="zip" value={newAddressForm.zip} onChange={handleInputChange} required className="bg-muted/30"/>
                                </div>
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Estado / Entidad</Label>
                                    <Input name="state" value={newAddressForm.state} onChange={handleInputChange} required className="bg-muted/30"/>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Teléfono de Contacto</Label>
                                    <Input name="phone" value={newAddressForm.phone} onChange={handleInputChange} required type="tel" className="bg-muted/30"/>
                                </div>
                             </div>

                             <div className="flex gap-3 justify-end pt-4 border-t border-border/50">
                                 <Button variant="outline" type="button" onClick={() => setIsAddingMode(false)}>Cancelar</Button>
                                 <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                                    Guardar en Libreta
                                </Button>
                             </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {!isAddingMode && addresses.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                    <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">No tienes ninguna dirección registrada en tu bóveda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {addresses.map(addr => (
                        <Card key={addr.id} className="relative overflow-hidden group shadow-sm hover:shadow-md transition-all border-border">
                            <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary"/> {addr.alias}
                                    </CardTitle>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteAddress(addr.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-1 text-sm text-muted-foreground">
                                <p className="font-bold text-foreground text-base">{addr.firstName} {addr.lastName}</p>
                                <p>{addr.street}</p>
                                <p>{addr.city}, {addr.state} {addr.zip}</p>
                                <p>{addr.country}</p>
                                <p className="pt-2 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-green-500"/>
                                    Tel: {addr.phone}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
