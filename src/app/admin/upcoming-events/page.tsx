
"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import type { UpcomingEvent } from '@/lib/types';
import {
  getUpcomingEvents,
  addUpcomingEvent,
  updateUpcomingEvent,
  deleteUpcomingEvent,
} from '@/services/upcomingEventService';
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

const DEFAULT_EVENT: Partial<UpcomingEvent> = {
  title: '',
  subtitle: '',
  imageUrl: '',
  brandLogoUrl: '',
  buttonText: '',
  buttonLink: '#',
  order: 0,
  isActive: true,
};

export default function AdminUpcomingEventsPage() {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Partial<UpcomingEvent>>(DEFAULT_EVENT);
  const { toast } = useToast();

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const fetchedEvents = await getUpcomingEvents(false); // Get all events
      setEvents(fetchedEvents);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los eventos." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleAddNew = () => {
    setCurrentEvent(DEFAULT_EVENT);
    setShowForm(true);
  };

  const handleEdit = (event: UpcomingEvent) => {
    setCurrentEvent(event);
    setShowForm(true);
  };

  const handleDelete = async (eventId: string, eventTitle: string) => {
    try {
      await deleteUpcomingEvent(eventId);
      toast({ title: "Evento Eliminado", description: `El evento "${eventTitle}" ha sido eliminado.` });
      loadEvents();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo eliminar el evento." });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentEvent.title || !currentEvent.imageUrl || !currentEvent.buttonText) {
      toast({ variant: "destructive", title: "Error de Validación", description: "Título, URL de Imagen y Texto del Botón son obligatorios." });
      return;
    }
    setIsSubmitting(true);

    const eventPayload = {
      title: currentEvent.title,
      subtitle: currentEvent.subtitle || '',
      imageUrl: currentEvent.imageUrl,
      brandLogoUrl: currentEvent.brandLogoUrl || '',
      buttonText: currentEvent.buttonText,
      buttonLink: currentEvent.buttonLink || '#',
      order: Number(currentEvent.order) || 0,
      isActive: !!currentEvent.isActive,
    };

    try {
      if (currentEvent.id) {
        await updateUpcomingEvent(currentEvent.id, eventPayload);
        toast({ title: "Evento Actualizado", description: "El evento ha sido actualizado." });
      } else {
        await addUpcomingEvent(eventPayload);
        toast({ title: "Evento Añadido", description: "Un nuevo evento ha sido añadido." });
      }
      loadEvents();
      setShowForm(false);
      setCurrentEvent(DEFAULT_EVENT);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo guardar el evento." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentEvent(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      setCurrentEvent(prev => ({...prev, [name]: checked}));
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestionar Próximos Eventos</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nuevo Evento
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{currentEvent.id ? 'Editar Evento' : 'Añadir Nuevo Evento'}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input id="title" name="title" value={currentEvent.title || ''} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="subtitle">Subtítulo (ej. fecha)</Label>
                    <Input id="subtitle" name="subtitle" value={currentEvent.subtitle || ''} onChange={handleInputChange} />
                  </div>
              </div>
              <div>
                <Label htmlFor="imageUrl">URL de la Imagen Principal</Label>
                <Input id="imageUrl" name="imageUrl" value={currentEvent.imageUrl || ''} onChange={handleInputChange} required placeholder="https://example.com/event-banner.png" />
                {currentEvent.imageUrl && <NextImage src={currentEvent.imageUrl} alt="Vista previa" width={200} height={100} className="mt-2 rounded-md border" objectFit="cover" />}
              </div>
              <div>
                <Label htmlFor="brandLogoUrl">URL del Logo de la Marca (Opcional)</Label>
                <Input id="brandLogoUrl" name="brandLogoUrl" value={currentEvent.brandLogoUrl || ''} onChange={handleInputChange} placeholder="https://example.com/brand-logo.png" />
                {currentEvent.brandLogoUrl && <NextImage src={currentEvent.brandLogoUrl} alt="Vista previa de logo" width={100} height={50} className="mt-2 rounded-md border bg-muted" objectFit="contain" />}
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buttonText">Texto del Botón</Label>
                    <Input id="buttonText" name="buttonText" value={currentEvent.buttonText || ''} onChange={handleInputChange} required />
                  </div>
                   <div>
                    <Label htmlFor="buttonLink">Enlace del Botón</Label>
                    <Input id="buttonLink" name="buttonLink" value={currentEvent.buttonLink || ''} onChange={handleInputChange} />
                  </div>
              </div>
              <div>
                <Label htmlFor="order">Orden de Visualización (ej. 1, 2, 3)</Label>
                <Input id="order" name="order" type="number" value={currentEvent.order || 0} onChange={handleInputChange} />
              </div>
               <div className="flex items-center space-x-2">
                <Checkbox id="isActive" name="isActive" checked={!!currentEvent.isActive} onCheckedChange={(checked) => setCurrentEvent(prev => ({...prev, isActive: !!checked}))} />
                <Label htmlFor="isActive" className="cursor-pointer">Mostrar este evento en la página de inicio</Label>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentEvent.id ? 'Actualizar Evento' : 'Añadir Evento'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setCurrentEvent(DEFAULT_EVENT); }}>
                Cancelar
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Eventos Existentes</CardTitle>
          <CardDescription>Gestiona los eventos que aparecen en la sección "Próximos Eventos".</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Imagen</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Subtítulo</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length > 0 ? events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="w-24 h-12 relative border rounded overflow-hidden bg-muted">
                        <NextImage src={event.imageUrl} alt={event.title} layout="fill" objectFit="cover"/>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.subtitle}</TableCell>
                    <TableCell>{event.order}</TableCell>
                    <TableCell>{event.isActive ? <span className="text-green-600 font-semibold">Activo</span> : <span className="text-muted-foreground">Inactivo</span>}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(event)} title="Editar Evento">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" title="Eliminar Evento">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el evento: "{event.title}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(event.id, event.title)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No se encontraron eventos. ¡Añade algunos para empezar!</TableCell>
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
