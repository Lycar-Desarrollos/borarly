
"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Mail, MapPin, Edit3, Phone, BookOpen, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { currentUser, userProfile, loading: authLoading, signOut, setUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    displayName: '',
  });
  const [formSaving, setFormSaving] = useState(false);
  
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login?redirect=/profile');
      return;
    }

    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
      });
    }
  }, [currentUser, userProfile, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;
    setFormSaving(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const updatedProfileData = {
        displayName: formData.displayName,
      };
      await updateDoc(userDocRef, updatedProfileData);
      
      if (setUserProfile) {
        setUserProfile(prev => {
            if (!prev) return null;
            return {
                ...prev,
                displayName: updatedProfileData.displayName || prev.displayName,
            };
        });
      }
      
      toast({ title: "Perfil Actualizado", description: "La información de tu perfil ha sido guardada." });
      setIsEditing(false);

    } catch (error) {
      console.error("Error actualizando perfil:", error);
      toast({ variant: "destructive", title: "Fallo al Actualizar", description: "No se pudo guardar tu perfil." });
    } finally {
      setFormSaving(false);
    }
  };

  if (authLoading || (!userProfile?.uid && currentUser !== null)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-300px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentUser || !userProfile) {
    return <div className="text-center py-10">Por favor, inicia sesión para ver tu perfil.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl">Mi Perfil</CardTitle>
            <CardDescription>Ve y gestiona los detalles de tu cuenta.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => {
             setIsEditing(!isEditing);
             if (!isEditing && userProfile) {
                setFormData({
                    displayName: userProfile.displayName || '',
                });
             }
          }}>
            <Edit3 className="mr-2 h-4 w-4" /> {isEditing ? 'Cancelar' : 'Editar Perfil'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || 'User'} data-ai-hint="user avatar" />
              <AvatarFallback className="text-3xl">
                {userProfile.displayName?.charAt(0)?.toUpperCase() || <User className="h-10 w-10" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              {isEditing ? (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="displayName">Nombre Completo</Label>
                    <Input id="displayName" name="displayName" value={formData.displayName || ''} onChange={handleInputChange} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (no se puede cambiar)</Label>
                    <Input id="email" type="email" value={userProfile.email || ''} disabled className="bg-muted/50" />
                  </div>
                  <Button type="submit" disabled={formSaving}>
                    {formSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar Cambios
                  </Button>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-lg">{userProfile.displayName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span>{userProfile.email || 'N/A'}</span>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/profile/addresses" legacyBehavior passHref>
                        <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5">
                            <BookOpen className="h-6 w-6 text-primary" />
                            <div className="text-center">
                                <span className="block font-bold">Libreta de Direcciones</span>
                                <span className="text-xs text-muted-foreground font-normal">Gestiona dónde enviamos tus pedidos</span>
                            </div>
                        </Button>
                    </Link>
                    <Link href="/profile/billing" legacyBehavior passHref>
                        <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-500/5">
                            <FileText className="h-6 w-6 text-blue-500" />
                            <div className="text-center">
                                <span className="block font-bold">Datos de Facturación</span>
                                <span className="text-xs text-muted-foreground font-normal">Administra tus RFCs y CFDI 4.0</span>
                            </div>
                        </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
            <Button variant="destructive" onClick={signOut}>Cerrar Sesión</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
