
"use client";

import type { Product, Category } from '@/lib/types';
import { ProductList } from '@/components/products/ProductList';
import { SyscomFilterSidebar } from '@/components/products/SyscomFilterSidebar';

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
    <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
      <aside className="w-full md:w-60 lg:w-72 flex-shrink-0">
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
      <section className="flex-grow min-w-0">
        {currentSearch && !currentCategory && (
          <h2 className="text-2xl font-semibold mb-6">
            Resultados de búsqueda para: <span className="text-primary">{currentSearch}</span>
          </h2>
        )}
        {currentCategory && categories.find(c => c.id === currentCategory) && (
            <h2 className="text-2xl font-semibold mb-6">
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
