
"use client";

import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import React, { useMemo } from 'react';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  
  const { secciones, lineasBySeccion, seriesByLinea, parentMap } = useMemo(() => {
    const secciones = categories.filter(cat => cat.level === 1).sort((a,b) => a.name.localeCompare(b.name));
    const lineas = categories.filter(cat => cat.level === 2).sort((a,b) => a.name.localeCompare(b.name));
    const series = categories.filter(cat => cat.level === 3).sort((a,b) => a.name.localeCompare(b.name));

    const lineasBySeccion: Record<string, Category[]> = {};
    lineas.forEach(linea => {
        if (linea.parentId) {
            if (!lineasBySeccion[linea.parentId]) lineasBySeccion[linea.parentId] = [];
            lineasBySeccion[linea.parentId].push(linea);
        }
    });

    const seriesByLinea: Record<string, Category[]> = {};
    series.forEach(serie => {
        if (serie.parentId) {
            if (!seriesByLinea[serie.parentId]) seriesByLinea[serie.parentId] = [];
            seriesByLinea[serie.parentId].push(serie);
        }
    });
    
    // Create a map to quickly find parent IDs
    const parentMap: Record<string, string | null> = {};
    categories.forEach(c => parentMap[c.id] = c.parentId || null);

    return { secciones, lineasBySeccion, seriesByLinea, parentMap };
  }, [categories]);


  const getOpenAccordionItems = () => {
    if (!selectedCategory) return [];
    
    const openItems = new Set<string>();
    let currentId: string | null = selectedCategory;

    while(currentId) {
        const parentId = parentMap[currentId];
        if(parentId) {
            openItems.add(parentId);
        }
        currentId = parentId;
    }
    return Array.from(openItems);
  };
  
  const openAccordionItems = getOpenAccordionItems();
  
  const handleTriggerClick = (e: React.MouseEvent<HTMLButtonElement>, categoryId: string) => {
    // Check if the click was on the chevron icon's container, not the text itself
    if ((e.target as HTMLElement).closest('svg')) {
      return; 
    }
    e.preventDefault(); 
    onSelectCategory(categoryId);
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-3">Categorías</h3>
      <Button
        variant={selectedCategory === null || selectedCategory === "all" ? 'default' : 'outline'}
        onClick={() => onSelectCategory(null)}
        className="w-full justify-start mb-2 text-left py-2.5"
      >
        Todos los Productos
      </Button>
      <Accordion 
        type="multiple" 
        className="w-full space-y-1"
        defaultValue={openAccordionItems}
      >
        {secciones.map((seccion) => (
          <AccordionItem value={seccion.id} key={seccion.id} className="border-b-0">
            <AccordionTrigger
              onClick={(e) => handleTriggerClick(e as any, seccion.id)}
              className={cn(
                "hover:no-underline py-2.5 px-3 text-sm font-medium rounded-md w-full",
                "data-[state=closed]:hover:bg-accent/50 data-[state=open]:bg-accent/70 data-[state=open]:text-accent-foreground",
                selectedCategory === seccion.id ? 
                  "bg-primary text-primary-foreground hover:bg-primary/90 data-[state=open]:bg-primary data-[state=open]:text-primary-foreground [&>svg]:text-primary-foreground" :
                  "hover:bg-accent/50"
              )}
            >
             <span className="flex-grow text-left">{seccion.name}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2 space-y-1 pl-4">
                {(lineasBySeccion[seccion.id] || []).map((linea) => {
                  const hasSeries = (seriesByLinea[linea.id] || []).length > 0;
                  if (hasSeries) {
                    return (
                        <Accordion type="single" collapsible key={linea.id} className="w-full" defaultValue={openAccordionItems.includes(linea.id) ? linea.id : undefined}>
                            <AccordionItem value={linea.id} className="border-b-0">
                                <AccordionTrigger
                                    onClick={(e) => handleTriggerClick(e as any, linea.id)}
                                    className={cn(
                                        "hover:no-underline p-1.5 text-sm rounded-md w-full",
                                        selectedCategory === linea.id ? 
                                          "bg-secondary text-secondary-foreground" : 
                                          "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                  <span className="flex-grow text-left">{linea.name}</span>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pt-1 space-y-1 pl-4">
                                        {(seriesByLinea[linea.id] || []).map((serie) => (
                                            <Button
                                                key={serie.id}
                                                variant={selectedCategory === serie.id ? 'secondary' : 'ghost'}
                                                size="sm"
                                                onClick={() => onSelectCategory(serie.id)}
                                                className={cn(
                                                    "w-full justify-start text-left text-xs h-auto py-1 px-2",
                                                     selectedCategory === serie.id ?
                                                        "font-semibold text-primary" :
                                                        "text-muted-foreground"
                                                )}
                                            >
                                                {serie.name}
                                            </Button>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    );
                  }
                  return (
                     <Button
                        key={linea.id}
                        variant={selectedCategory === linea.id ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => onSelectCategory(linea.id)}
                        className="w-full justify-start text-left text-sm"
                    >
                        {linea.name}
                    </Button>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
