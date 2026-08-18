
"use client";

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { Product, Category } from '@/lib/types';
import { ProductList } from '@/components/products/ProductList';
import { SyscomFilterSidebar } from '@/components/products/SyscomFilterSidebar';
import { cn } from '@/lib/utils';

interface ProductDisplayProps {
  initialProducts: Product[];
  categories: Category[];
  currentCategory: string | null;
  currentSearch?: string;
  currentMarca?: string;
  currentOrden?: string;
  currentSucursal?: string;
  currentNuevo?: boolean;
  currentCajaAbierta?: boolean;
  currentEnExistencia?: boolean;
  currentOferta?: boolean;
  currentOutlet?: boolean;
  sucursales: {id: string, nombre: string}[];
}

export function ProductDisplay({ 
  initialProducts, 
  categories, 
  currentCategory, 
  currentSearch,
  currentMarca,
  currentOrden,
  currentSucursal,
  currentNuevo,
  currentCajaAbierta,
  currentEnExistencia,
  currentOferta,
  currentOutlet,
  sucursales
}: ProductDisplayProps) {

  // En móvil los filtros arrancan plegados para que los productos se vean primero.
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeFilterCount = [
    currentCategory,
    currentMarca,
    currentSucursal,
    currentNuevo,
    currentCajaAbierta,
    currentEnExistencia,
    currentOferta,
    currentOutlet,
  ].filter(Boolean).length;

  const handleFilterChange = (key: string, value: string | null) => {
    const params = new URLSearchParams(window.location.search);
    
    if (value === null || value === undefined || value === '' || value === 'false') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    // Si cambiamos de categoría o marca, solemos querer resetear la búsqueda
    // pero el usuario dijo "ir filtrando dependiendo a todos los filtros aplicados"
    // Mantendremos los parámetros previos.

    const newPath = params.toString() ? `/?${params.toString()}` : '/';
    window.location.href = newPath; 
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8">
      {/* Botón de filtros solo para móvil/tablet pequeña */}
      <button
        type="button"
        onClick={() => setMobileFiltersOpen(o => !o)}
        aria-expanded={mobileFiltersOpen}
        className="md:hidden w-full h-12 flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 font-bold text-sm text-foreground shadow-sm active:scale-[0.99] transition-transform"
      >
        <span className="flex items-center gap-2.5">
          {mobileFiltersOpen ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
          {mobileFiltersOpen ? 'Ocultar filtros' : 'Filtrar y ordenar'}
        </span>
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-black">
            {activeFilterCount}
          </span>
        )}
      </button>

      <aside
        className={cn(
          'w-full md:w-60 lg:w-72 flex-shrink-0',
          mobileFiltersOpen ? 'block' : 'hidden md:block'
        )}
      >
          <SyscomFilterSidebar
            categories={categories}
            selectedCategory={currentCategory}
            selectedMarca={currentMarca}
            selectedOrden={currentOrden}
            selectedSucursal={currentSucursal}
            selectedNuevo={currentNuevo}
            selectedCajaAbierta={currentCajaAbierta}
            selectedEnExistencia={currentEnExistencia}
            selectedOferta={currentOferta}
            selectedOutlet={currentOutlet}
            sucursales={sucursales}
            onFilterChange={handleFilterChange}
          />
      </aside>
      <section className="flex-grow min-w-0 space-y-6">
        {/* Banner de Nuevos */}
        {currentNuevo && !currentCategory && !currentSearch && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-amber-500/10 border border-amber-500/30 p-3.5 sm:p-4 rounded-2xl">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-2">
                ⚡ Nuevos Lanzamientos de Catálogo
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Últimas tecnologías e innovaciones añadidas al catálogo</p>
            </div>
            <span className="self-start sm:self-auto shrink-0 text-xs font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full">{initialProducts.length} productos</span>
          </div>
        )}

        {/* Banner de Ofertas */}
        {currentOferta && !currentCategory && !currentSearch && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-red-500/10 border border-red-500/30 p-3.5 sm:p-4 rounded-2xl">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-2">
                🔥 Ofertas y Precios Especiales
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Descuentos mayoristas y promociones activas por tiempo limitado</p>
            </div>
            <span className="self-start sm:self-auto shrink-0 text-xs font-bold text-red-600 bg-red-500/10 px-3 py-1 rounded-full">{initialProducts.length} productos</span>
          </div>
        )}

        {/* Banner de En Existencia */}
        {currentEnExistencia && !currentCategory && !currentSearch && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-emerald-500/10 border border-emerald-500/30 p-3.5 sm:p-4 rounded-2xl">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-2">
                📦 Inventario en Existencia Inmediata
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Productos con stock disponible para envío nacional inmediato</p>
            </div>
            <span className="self-start sm:self-auto shrink-0 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">{initialProducts.length} productos</span>
          </div>
        )}

        {currentSearch && !currentCategory && (
          <h2 className="text-lg sm:text-2xl font-semibold break-words">
            Resultados de búsqueda para: <span className="text-primary">{currentSearch}</span>
          </h2>
        )}
        {currentCategory && categories.find(c => c.id === currentCategory) && (
            <h2 className="text-lg sm:text-2xl font-semibold break-words">
                Productos en: <span className="text-primary">
                    {(() => {
                        const cat = categories.find(c => c.id === currentCategory);
                        return cat ? (cat.alias || cat.name) : '';
                    })()}
                </span>
                {currentSearch && ` (que coinciden con "${currentSearch}")`}
            </h2>
        )}
        <ProductList products={initialProducts} />
      </section>
    </div>
  );
}
