
"use client"; 

import { useState, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }  from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2, Image as ImageIcon, ArrowUpRightFromSquare, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getCategories as fetchCategoriesSvc, 
  addCategory as addCategorySvc,
  updateCategory as updateCategorySvc,
  deleteCategory as deleteCategorySvc 
} from '@/services/productService'; 
import type { Category, CategoryLevel } from '@/lib/types';
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
import { cn } from '@/lib/utils';

const DEFAULT_CATEGORY: Partial<Category> = { 
    name: '', 
    description: '', 
    isFeatured: false, 
    featuredImageUrl: '', 
    parentId: null,
    level: 1, // Default to 'Sección'
    isVisible: true,
    alias: '',
    showInNavbar: true,
};

const LEVEL_NAMES: Record<CategoryLevel, string> = {
    1: 'Sección',
    2: 'Línea',
    3: 'Serie'
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>(DEFAULT_CATEGORY);
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
    if (!currentCategory.name || !currentCategory.level) {
      toast({ variant: "destructive", title: "Error de Validación", description: "El nombre y el nivel de la categoría son obligatorios." });
      return;
    }
    if (currentCategory.level > 1 && !currentCategory.parentId) {
      toast({ variant: "destructive", title: "Error de Validación", description: `Una ${LEVEL_NAMES[currentCategory.level]} debe tener una categoría padre.` });
      return;
    }
    setIsSubmitting(true);
    
    const categoryPayload: Partial<Omit<Category, 'id'>> = {
        name: currentCategory.name,
        description: currentCategory.description || '',
        isFeatured: !!currentCategory.isFeatured,
        featuredImageUrl: currentCategory.featuredImageUrl || '',
        parentId: currentCategory.level === 1 ? null : currentCategory.parentId,
        level: currentCategory.level,
        isVisible: currentCategory.isVisible !== undefined ? currentCategory.isVisible : true,
        alias: currentCategory.alias || '',
        showInNavbar: currentCategory.showInNavbar !== undefined ? currentCategory.showInNavbar : true,
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
      setCurrentCategory(DEFAULT_CATEGORY);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo guardar la categoría." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEdit = (category: Category) => {
    setCurrentCategory(category);
    setShowForm(true);
    if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddNew = () => {
    setCurrentCategory(DEFAULT_CATEGORY);
    setShowForm(true);
    if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
  
  const getCategoryPath = (categoryId: string | null | undefined): string => {
    if (!categoryId) return 'N/A';
    
    const path: string[] = [];
    let currentId: string | null | undefined = categoryId;

    while (currentId) {
        const category = categories.find(c => c.id === currentId);
        if (category) {
            path.unshift(category.name);
            currentId = category.parentId;
        } else {
            break;
        }
    }
    return path.join(' / ');
  };

  const getParentCategoryOptions = (level: CategoryLevel): Category[] => {
    if (level === 1) return [];
    const parentLevel = (level - 1) as CategoryLevel;
    return categories.filter(cat => cat.level === parentLevel);
  };

  const handleLevelChange = (levelStr: string) => {
      const level = parseInt(levelStr, 10) as CategoryLevel;
      setCurrentCategory(prev => ({ ...prev!, level, parentId: null })); // Reset parentId when level changes
  };

  const sortedCategories = [...categories].sort((a,b) => getCategoryPath(a.id).localeCompare(getCategoryPath(b.id)));


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestionar Categorías</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nueva Categoría
        </Button>
      </div>

      {showForm && (
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoryLevel">Nivel</Label>
                   <Select value={String(currentCategory.level || 1)} onValueChange={handleLevelChange}>
                    <SelectTrigger id="categoryLevel">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1 - Sección</SelectItem>
                        <SelectItem value="2">2 - Línea</SelectItem>
                        <SelectItem value="3">3 - Serie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {currentCategory.level && currentCategory.level > 1 && (
                  <div>
                    <Label htmlFor="parentCategory">Categoría Padre</Label>
                    <Select
                      value={currentCategory.parentId || ''}
                      onValueChange={(value) => setCurrentCategory(prev => ({ ...prev!, parentId: value }))}
                      required={currentCategory.level! > 1}
                    >
                      <SelectTrigger id="parentCategory">
                        <SelectValue placeholder="-- Seleccionar Padre --" />
                      </SelectTrigger>
                      <SelectContent>
                        {getParentCategoryOptions(currentCategory.level!).map(cat => (
                           <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isVisible" className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      id="isVisible"
                      checked={currentCategory.isVisible !== false}
                      onCheckedChange={(checked) => setCurrentCategory(prev => ({ ...prev!, isVisible: !!checked }))}
                    />
                    Visible en la Tienda
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isFeatured" className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      id="isFeatured"
                      checked={!!currentCategory.isFeatured}
                      onCheckedChange={(checked) => setCurrentCategory(prev => ({ ...prev!, isFeatured: !!checked }))}
                    />
                    Marcar como Destacada
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="showInNavbar" className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      id="showInNavbar"
                      checked={currentCategory.showInNavbar !== false}
                      onCheckedChange={(checked) => setCurrentCategory(prev => ({ ...prev!, showInNavbar: !!checked }))}
                    />
                    Mostrar en Navbar (Menú Superior)
                  </Label>
                </div>
              </div>
              <div>
                <Label htmlFor="alias">Nombre para mostrar (Alias)</Label>
                <Input
                  id="alias"
                  value={currentCategory.alias || ''}
                  onChange={(e) => setCurrentCategory(prev => ({ ...prev!, alias: e.target.value }))}
                  placeholder="Ej. Cámaras de Seguridad"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Si dejas esto en blanco, se usará el nombre original ("{currentCategory.name || 'Categoría'}") en la tienda.</p>
              </div>
              <div>
                <Label htmlFor="featuredImageUrl">URL de Imagen Destacada</Label>
                <Input
                  id="featuredImageUrl"
                  value={currentCategory.featuredImageUrl || ''}
                  onChange={(e) => setCurrentCategory(prev => ({ ...prev!, featuredImageUrl: e.target.value }))}
                  placeholder="https://example.com/image.png"
                />
                {currentCategory.featuredImageUrl && (
                  <div className="mt-2 w-24 h-16 relative border rounded overflow-hidden">
                    <Image src={currentCategory.featuredImageUrl} alt="Vista previa destacada" layout="fill" objectFit="cover" data-ai-hint="category image"/>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentCategory.id ? 'Actualizar Categoría' : 'Añadir Categoría'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setCurrentCategory(DEFAULT_CATEGORY); }}>
                Cancelar
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Categorías Existentes</CardTitle>
          <CardDescription>Lista de todas las categorías, organizadas por jerarquía.</CardDescription>
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
                  <TableHead>Nombre / Jerarquía</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead className="text-center">Destacada</TableHead>
                  <TableHead className="text-center">Imagen</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCategories.length > 0 ? sortedCategories.map((category) => {
                   const paddingLeft = `${(category.level - 1) * 1.5}rem`;
                   return (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium" style={{ paddingLeft }}>
                      {category.level > 1 && <span className="text-muted-foreground mr-1">└</span>}
                      <span className={cn(!category.isVisible && "text-muted-foreground line-through opacity-60")}>
                        {category.alias || category.name}
                      </span>
                      {category.alias && (
                        <span className="ml-2 text-[10px] text-muted-foreground font-normal">
                          ({category.name})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col gap-0.5">
                          <span className="text-xs">{LEVEL_NAMES[category.level]}</span>
                          <div className="flex items-center gap-1.5">
                            {category.isVisible ? (
                               <span className="text-[9px] text-green-500 font-bold uppercase tracking-tighter">Visible</span>
                            ) : (
                               <span className="text-[9px] text-destructive font-bold uppercase tracking-tighter">Oculta</span>
                            )}
                            {category.showInNavbar !== false && (
                               <span className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter border-l border-border pl-1.5 ml-1">Navbar</span>
                            )}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {category.isFeatured ? 
                        <span className="text-green-600 font-semibold">Sí</span> : 
                        <span className="text-muted-foreground">No</span>
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      {category.featuredImageUrl ? (
                         <div className="w-16 h-10 relative border rounded overflow-hidden mx-auto group">
                            <Image src={category.featuredImageUrl} alt={category.name} layout="fill" objectFit="cover" data-ai-hint="category image" />
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
                                 Asegúrate de que ninguna otra categoría o producto dependa de esta.
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
                )}) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No se encontraron categorías. ¡Añade algunas para empezar!</TableCell>
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
