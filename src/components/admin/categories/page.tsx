
"use client"; 

import { useState, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }  from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2, Image as ImageIcon, ArrowUpRightFromSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getCategories as fetchCategoriesSvc, 
  addCategory as addCategorySvc,
  updateCategory as updateCategorySvc,
  deleteCategory as deleteCategorySvc 
} from '@/services/productService'; 
import type { Category } from '@/lib/types';
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
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NONE_PARENT_VALUE = "__NONE_PARENT__";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category> & { parentId?: string | null }>({ name: '', description: '', isFeatured: false, featuredImageUrl: '', parentId: null });
  const { toast } = useToast();

  const loadCategories = async () => {
      setIsLoading(true);
      try {
        const fetchedCategories = await fetchCategoriesSvc();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("No se pudieron cargar las categorías:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las categorías." });
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentCategory || !currentCategory.name) {
      toast({ variant: "destructive", title: "Error de Validación", description: "El nombre de la categoría es obligatorio." });
      return;
    }
    setIsSubmitting(true);
    
    const categoryPayload: Partial<Omit<Category, 'id'>> = {
        name: currentCategory.name,
        description: currentCategory.description || '',
        isFeatured: !!currentCategory.isFeatured,
        featuredImageUrl: currentCategory.featuredImageUrl || '',
        parentId: currentCategory.parentId || null,
    };

    try {
      if (currentCategory.id) { 
        await updateCategorySvc(currentCategory.id, categoryPayload);
        toast({ title: "Categoría Actualizada", description: `La categoría "${currentCategory.name}" ha sido actualizada.` });
      } else { 
        await addCategorySvc(categoryPayload as Omit<Category, 'id'>);
        toast({ title: "Categoría Añadida", description: `La categoría "${currentCategory.name}" ha sido añadida.` });
      }
      await loadCategories(); 
      setShowForm(false);
      setCurrentCategory({ name: '', description: '', isFeatured: false, featuredImageUrl: '', parentId: null });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo guardar la categoría." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEdit = (category: Category) => {
    setCurrentCategory({...category, parentId: category.parentId || null});
    setShowForm(true);
  };

  const handleAddNew = () => {
    setCurrentCategory({ name: '', description: '', isFeatured: false, featuredImageUrl: '', parentId: null });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    try {
      await deleteCategorySvc(categoryId);
      await loadCategories();
      toast({ title: "Categoría Eliminada", description: `La categoría "${categoryName}" ha sido eliminada.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo eliminar la categoría." });
    }
  };

  const getParentCategoryName = (parentId: string | null | undefined): string => {
    if (!parentId) return 'N/A (Nivel Superior)';
    const parent = categories.find(cat => cat.id === parentId);
    return parent ? parent.name : 'Padre Desconocido';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestionar Categorías</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nueva Categoría
        </Button>
      </div>

      {showForm && currentCategory && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{currentCategory.id ? 'Editar Categoría' : 'Añadir Nueva Categoría'}</CardTitle>
          </CardHeader>
          <form onSubmit={handleFormSubmit}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="categoryName">Nombre de la Categoría</Label>
                <Input
                  id="categoryName"
                  value={currentCategory.name || ''}
                  onChange={(e) => setCurrentCategory(prev => ({ ...prev!, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="categoryDescription">Descripción (Opcional)</Label>
                <Textarea
                  id="categoryDescription"
                  value={currentCategory.description || ''}
                  onChange={(e) => setCurrentCategory(prev => ({ ...prev!, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="parentCategory">Categoría Padre (Opcional)</Label>
                <Select
                  value={currentCategory.parentId || NONE_PARENT_VALUE}
                  onValueChange={(value) => setCurrentCategory(prev => ({ ...prev!, parentId: value === NONE_PARENT_VALUE ? null : value }))}
                >
                  <SelectTrigger id="parentCategory">
                    <SelectValue placeholder="-- Seleccionar Padre (Opcional) --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_PARENT_VALUE}>-- Ninguna (Categoría de Nivel Superior) --</SelectItem>
                    {categories
                        .filter(cat => cat.id !== currentCategory.id) 
                        .map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isFeatured" className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    id="isFeatured"
                    checked={!!currentCategory.isFeatured}
                    onCheckedChange={(checked) => setCurrentCategory(prev => ({ ...prev!, isFeatured: !!checked }))}
                  />
                  Marcar como Destacada (para mostrar en la página de inicio)
                </Label>
              </div>
              <div>
                <Label htmlFor="featuredImageUrl">URL de Imagen Destacada (para la página de inicio)</Label>
                <Input
                  id="featuredImageUrl"
                  value={currentCategory.featuredImageUrl || ''}
                  onChange={(e) => setCurrentCategory(prev => ({ ...prev!, featuredImageUrl: e.target.value }))}
                  placeholder="https://example.com/image.png"
                />
                {currentCategory.featuredImageUrl && (
                  <div className="mt-2 w-24 h-16 relative border rounded overflow-hidden bg-white">
                    <Image src={currentCategory.featuredImageUrl} alt="Vista previa destacada" layout="fill" objectFit="contain" data-ai-hint="category image"/>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Si se marca como destacada, esta imagen se usará en la página de inicio. Asegúrate de que sea una URL pública.</p>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentCategory.id ? 'Actualizar Categoría' : 'Añadir Categoría'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setCurrentCategory({ name: '', description: '', isFeatured: false, featuredImageUrl: '', parentId: null }); }}>
                Cancelar
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Categorías Existentes</CardTitle>
          <CardDescription>Lista de todas las categorías de productos. Las categorías destacadas aparecerán en la página de inicio.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría Padre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Destacada</TableHead>
                  <TableHead className="text-center">Imagen Destacada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length > 0 ? categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{getParentCategoryName(category.parentId)}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-xs" title={category.description}>{category.description || 'N/A'}</TableCell>
                    <TableCell className="text-center">
                      {category.isFeatured ? 
                        <span className="text-green-600 font-semibold">Sí</span> : 
                        <span className="text-muted-foreground">No</span>
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      {category.featuredImageUrl ? (
                         <div className="w-16 h-10 relative border rounded overflow-hidden mx-auto group bg-white">
                            <Image src={category.featuredImageUrl} alt={category.name} layout="fill" objectFit="contain" data-ai-hint="category image" />
                            <a href={category.featuredImageUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <ArrowUpRightFromSquare className="h-5 w-5 text-white"/>
                            </a>
                         </div>
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(category)} title="Editar Categoría">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" title="Eliminar Categoría">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la categoría "{category.name}".
                                Los productos en esta categoría no se eliminarán pero podrían necesitar ser recategorizados.
                                Si esta es una categoría padre, sus subcategorías TAMPOCO se eliminarán, pero pasarán a ser de nivel superior.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(category.id, category.name)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No se encontraron categorías. ¡Añade algunas para empezar!</TableCell>
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

    