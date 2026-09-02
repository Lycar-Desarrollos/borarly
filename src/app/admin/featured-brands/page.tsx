
"use client";

import { useState, useEffect, FormEvent } from 'react';
import type { FeaturedBrand } from '@/lib/types';
import {
  getFeaturedBrands,
  addFeaturedBrand,
  updateFeaturedBrand,
  deleteFeaturedBrand,
} from '@/services/featuredBrandService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import { safeImageSrc } from '@/lib/imageUrl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DEFAULT_BRAND: Partial<FeaturedBrand> = {
  name: '',
  logoUrl: '',
  order: 0,
};

export default function AdminFeaturedBrandsPage() {
  const [brands, setBrands] = useState<FeaturedBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Partial<FeaturedBrand>>(DEFAULT_BRAND);
  const { toast } = useToast();

  const loadBrands = async () => {
    setIsLoading(true);
    try {
      const fetchedBrands = await getFeaturedBrands();
      setBrands(fetchedBrands);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las marcas destacadas." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleAddNew = () => {
    setCurrentBrand(DEFAULT_BRAND);
    setShowForm(true);
  };

  const handleEdit = (brand: FeaturedBrand) => {
    setCurrentBrand(brand);
    setShowForm(true);
  };

  const handleDelete = async (brandId: string, brandName: string) => {
    try {
      await deleteFeaturedBrand(brandId);
      toast({ title: "Marca Eliminada", description: `La marca "${brandName}" ha sido eliminada.` });
      loadBrands();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo eliminar la marca." });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentBrand.name || !currentBrand.logoUrl) {
      toast({ variant: "destructive", title: "Error de Validación", description: "El Nombre y la URL del Logo son obligatorios." });
      return;
    }
    setIsSubmitting(true);

    const brandPayload = {
      name: currentBrand.name!,
      logoUrl: currentBrand.logoUrl!,
      order: Number(currentBrand.order) || 0,
    };

    try {
      if (currentBrand.id) {
        await updateFeaturedBrand(currentBrand.id, brandPayload);
        toast({ title: "Marca Actualizada", description: "La marca destacada ha sido actualizada." });
      } else {
        await addFeaturedBrand(brandPayload);
        toast({ title: "Marca Añadida", description: "Una nueva marca destacada ha sido añadida." });
      }
      loadBrands();
      setShowForm(false);
      setCurrentBrand(DEFAULT_BRAND);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo guardar la marca." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentBrand(prev => ({ ...prev, [name]: value }));
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestionar Marcas Destacadas</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nueva Marca
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{currentBrand.id ? 'Editar Marca' : 'Añadir Nueva Marca'}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la Marca</Label>
                <Input id="name" name="name" value={currentBrand.name || ''} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="logoUrl">URL del Logo</Label>
                <Input id="logoUrl" name="logoUrl" value={currentBrand.logoUrl || ''} onChange={handleInputChange} required placeholder="https://example.com/logo.png" />
                {currentBrand.logoUrl && (
                  <div className="mt-2 w-32 h-16 relative border rounded overflow-hidden bg-muted">
                    <NextImage src={safeImageSrc(currentBrand.logoUrl)} alt="Vista previa del logo" layout="fill" objectFit="contain" data-ai-hint="logo preview"/>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="order">Orden (ej. 1, 2, 3)</Label>
                <Input id="order" name="order" type="number" value={currentBrand.order || 0} onChange={handleInputChange} />
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentBrand.id ? 'Actualizar Marca' : 'Añadir Marca'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setCurrentBrand(DEFAULT_BRAND); }}>
                Cancelar
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Marcas Existentes</CardTitle>
          <CardDescription>Gestiona las marcas que aparecen en la sección "Marcas Destacadas" de la página de inicio.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Logo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.length > 0 ? brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div className="w-24 h-12 relative border rounded overflow-hidden bg-muted">
                        <NextImage src={safeImageSrc(brand.logoUrl)} alt={brand.name} layout="fill" objectFit="contain" data-ai-hint={`${brand.name} logo`}/>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell>{brand.order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(brand)} title="Editar Marca">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" title="Eliminar Marca">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la marca: "{brand.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(brand.id, brand.name)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">No se encontraron marcas. ¡Añade algunas para empezar!</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
