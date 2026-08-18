
"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import type { HeroSlide, Category, FeaturedBrand } from '@/lib/types';
import {
  getHeroSlides,
  addHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
} from '@/services/heroSlideService';
import { getCategories } from '@/services/productService';
import { getFeaturedBrands } from '@/services/featuredBrandService';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import { safeImageSrc } from '@/lib/imageUrl';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

type LinkType = 'url' | 'category' | 'brand';

const DEFAULT_SLIDE: Partial<HeroSlide> = {
  imageUrl: '',
  altText: '',
  order: 0,
  title: '',
  description: '',
  buttonText: '',
  buttonLink: '',
  isActive: true,
};

export default function AdminHeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<FeaturedBrand[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [currentSlide, setCurrentSlide] = useState<Partial<HeroSlide>>(DEFAULT_SLIDE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [linkType, setLinkType] = useState<LinkType>('url');
  const [linkValue, setLinkValue] = useState('');

  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedSlides, fetchedCategories, fetchedBrands] = await Promise.all([
        getHeroSlides(false),
        getCategories(),
        getFeaturedBrands(),
      ]);
      setSlides(fetchedSlides);
      setCategories(fetchedCategories);
      setBrands(fetchedBrands);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos iniciales." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetFormState = () => {
    setCurrentSlide(DEFAULT_SLIDE);
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
    setIsUploading(false);
    setLinkType('url');
    setLinkValue('');
  };
  
  const handleAddNew = () => {
    resetFormState();
    setShowForm(true);
  };

  const handleEdit = (slide: HeroSlide) => {
    resetFormState();
    setCurrentSlide(slide);
    setImagePreview(slide.imageUrl);

    // Deconstruct buttonLink to set form state
    const link = slide.buttonLink || '';
    if (link.startsWith('/?category=')) {
        setLinkType('category');
        setLinkValue(link.replace('/?category=', ''));
    } else if (link.startsWith('/?brand=')) {
        setLinkType('brand');
        setLinkValue(link.replace('/?brand=', ''));
    } else {
        setLinkType('url');
        setLinkValue(link);
    }
    setShowForm(true);
  };

  const handleDelete = async (slideId: string) => {
    try {
      await deleteHeroSlide(slideId);
      toast({ title: "Slide Eliminado", description: "El slide del carrusel ha sido eliminado." });
      loadData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo eliminar el slide." });
    }
  };
  
  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!imagePreview && !currentSlide.imageUrl && !imageFile) {
      toast({ variant: "destructive", title: "Error de Validación", description: "Debes subir una imagen o ingresar una URL de imagen." });
      return;
    }
    setIsSubmitting(true);

    let finalImageUrl = currentSlide.imageUrl || imagePreview || '';

    if (imageFile) {
        setIsUploading(true);
        try {
            const sRef = storageRef(storage, `hero-slides/${Date.now()}_${imageFile.name}`);
            const uploadTask = uploadBytesResumable(sRef, imageFile);
            
            finalImageUrl = await new Promise<string>((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                    (error) => reject(error),
                    async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
                );
            });
        } catch (error) {
            toast({ variant: "destructive", title: "Error al Subir Imagen", description: "No se pudo subir la nueva imagen." });
            setIsSubmitting(false);
            setIsUploading(false);
            return;
        }
        setIsUploading(false);
    }

    const constructedButtonLink = linkValue ? (linkType === 'url' ? linkValue : `/?${linkType}=${linkValue}`) : '';

    const slidePayload = {
      imageUrl: finalImageUrl,
      altText: currentSlide.altText?.trim() || currentSlide.title?.trim() || 'Banner promocional Borarly',
      order: Number(currentSlide.order) || 0,
      title: currentSlide.title?.trim() || '',
      description: currentSlide.description?.trim() || '',
      buttonText: currentSlide.buttonText?.trim() || '',
      buttonLink: constructedButtonLink,
      isActive: currentSlide.isActive !== undefined ? !!currentSlide.isActive : true,
    };

    try {
      if (currentSlide.id) {
        await updateHeroSlide(currentSlide.id, slidePayload);
        toast({ title: "Slide Actualizado", description: "El slide del carrusel ha sido actualizado." });
      } else {
        await addHeroSlide(slidePayload);
        toast({ title: "Slide Añadido", description: "Un nuevo slide ha sido añadido al carrusel." });
      }
      loadData();
      setShowForm(false);
      resetFormState();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo guardar el slide." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSlide(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestionar Carrusel (Banners / Hero)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sube y administra los banners promocionales principales de la tienda.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nuevo Slide
        </Button>
      </div>

      {/* Guía visual de medidas estándar */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Medida Estándar Recomendada
            </span>
            <span className="font-bold text-foreground text-sm">1200 × 600 px (Proporción 2:1)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            También compatible con formato panorámico <strong>1200 × 500 px (2.4:1)</strong> o Full HD <strong>1920 × 960 px</strong>. Formatos admitidos: JPG, PNG, WebP (menos de 1MB recomendado).
          </p>
        </div>
        <div className="text-xs text-muted-foreground bg-background px-3 py-1.5 rounded-lg border shrink-0">
          ✨ Todos los textos son 100% opcionales
        </div>
      </div>

      {showForm && (
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle>{currentSlide.id ? 'Editar Slide' : 'Añadir Nuevo Slide'}</CardTitle>
            <CardDescription>
              Solo la imagen es necesaria. Puedes dejar los títulos vacíos si tu banner ya incluye el diseño y texto integrado.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Image Handling */}
              <div>
                <Label htmlFor="imageUrl" className="font-semibold">Imagen del Banner / Slide (Requerido)</Label>
                <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-full sm:w-56 aspect-[2/1] relative border rounded-lg bg-muted flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                        {imagePreview ? (
                            <NextImage src={imagePreview} alt="Vista previa" layout="fill" objectFit="cover" />
                        ) : (
                            <div className="text-center p-2">
                              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-1"/>
                              <span className="text-[10px] text-muted-foreground">1200x600 (2:1)</span>
                            </div>
                        )}
                    </div>
                    <div className="w-full space-y-2">
                        <Input id="imageFile" type="file" accept="image/*" onChange={handleImageFileChange} />
                        <Input 
                            id="imageUrl" 
                            name="imageUrl" 
                            value={currentSlide.imageUrl || ''} 
                            onChange={handleInputChange} 
                            placeholder="O pega una URL de imagen externa aquí" 
                        />
                    </div>
                </div>
                {isUploading && <Progress value={uploadProgress} className="w-full h-2 mt-2" />}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="altText">Texto Alternativo (Opcional - para SEO)</Label>
                  <Input 
                    id="altText" 
                    name="altText" 
                    placeholder="Ej. Promoción Acceso Inteligente Ubiquiti" 
                    value={currentSlide.altText || ''} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div>
                  <Label htmlFor="order">Orden de aparición (Opcional)</Label>
                  <Input 
                    id="order" 
                    name="order" 
                    type="number" 
                    placeholder="1, 2, 3..." 
                    value={currentSlide.order || 0} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <Label htmlFor="title">Título Superpuesto (Opcional)</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="Dejar vacío si el banner ya tiene texto" 
                    value={currentSlide.title || ''} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción Superpuesta (Opcional)</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Dejar vacío si el banner ya tiene texto" 
                    value={currentSlide.description || ''} 
                    onChange={handleInputChange} 
                    rows={1} 
                  />
                </div>
              </div>
              
              {/* Link Handling */}
              <div className="border-t pt-4">
                 <Label className="font-semibold">Destino al hacer clic en el Banner (Opcional)</Label>
                 <p className="text-xs text-muted-foreground mb-2">
                    Si seleccionas una categoría, marca o URL, el banner completo será cliqueable.
                 </p>
                 <div className="grid md:grid-cols-3 gap-2">
                    <Input 
                      name="buttonText" 
                      placeholder="Texto botón (Opcional)" 
                      value={currentSlide.buttonText || ''} 
                      onChange={handleInputChange} 
                    />
                    <Select value={linkType} onValueChange={(v: LinkType) => setLinkType(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="url">URL Libre / Externa</SelectItem>
                            <SelectItem value="category">Filtrar por Categoría</SelectItem>
                            <SelectItem value="brand">Filtrar por Marca</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    {linkType === 'url' && <Input placeholder="https://borarly.com/... o enlace externo" value={linkValue} onChange={e => setLinkValue(e.target.value)} />}
                    {linkType === 'category' && (
                        <Select value={linkValue} onValueChange={setLinkValue}>
                            <SelectTrigger><SelectValue placeholder="Elige una categoría" /></SelectTrigger>
                            <SelectContent>
                                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.alias || c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    {linkType === 'brand' && (
                         <Select value={linkValue} onValueChange={setLinkValue}>
                            <SelectTrigger><SelectValue placeholder="Elige una marca" /></SelectTrigger>
                            <SelectContent>
                                {brands.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                 </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="isActive" name="isActive" checked={!!currentSlide.isActive} onCheckedChange={(checked) => setCurrentSlide(prev => ({...prev, isActive: !!checked}))} />
                <Label htmlFor="isActive" className="cursor-pointer">Mostrar este slide en la página de inicio</Label>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isUploading ? 'Subiendo...' : (currentSlide.id ? 'Actualizar Slide' : 'Añadir Slide')}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetFormState(); }}>
                Cancelar
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Slides Existentes</CardTitle>
          <CardDescription>Gestiona los slides para el carrusel de la página de inicio. Se ordenan por el campo 'Orden'.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Imagen</TableHead>
                  <TableHead>Título / Texto Alt</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides.length > 0 ? slides.map((slide) => (
                  <TableRow key={slide.id}>
                    <TableCell>
                      <div className="w-20 h-10 relative border rounded overflow-hidden">
                        <NextImage src={safeImageSrc(slide.imageUrl)} alt={slide.altText} layout="fill" objectFit="cover" data-ai-hint="slide admin table"/>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {slide.title || slide.altText}
                      {slide.title && <p className="text-xs text-muted-foreground">{slide.altText}</p>}
                    </TableCell>
                    <TableCell>{slide.order}</TableCell>
                    <TableCell>{slide.isActive ? <span className="text-green-600 font-semibold">Activo</span> : <span className="text-muted-foreground">Inactivo</span>}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(slide)} title="Editar Slide">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" title="Eliminar Slide">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el slide: "{slide.title || slide.altText}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(slide.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No se encontraron slides. ¡Añade algunos para empezar!</TableCell>
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

    