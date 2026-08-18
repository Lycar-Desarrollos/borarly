"use client";

import type { Category } from '@/lib/types';
import React, { useMemo, useState } from 'react';
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

// Shadcn UI (We assume these were installed properly)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SelectGroup, SelectLabel } from "@/components/ui/select";
import { SUCURSALES_POR_ESTADO } from '@/services/syscom';

interface SyscomFilterSidebarProps {
  categories: Category[];
  selectedCategory: string | null;
  selectedMarca?: string;
  selectedOrden?: string;
  selectedSucursal?: string;
  selectedNuevo?: boolean;
  selectedCajaAbierta?: boolean;
  selectedEnExistencia?: boolean;
  selectedOferta?: boolean;
  selectedOutlet?: boolean;
  sucursales: {id: string, nombre: string}[];
  onFilterChange: (key: string, value: string | null) => void;
}

// Sort options. Only 'precio' (asc) is handled by Syscom API.
// 'titulo_asc', 'titulo_desc', 'precio_desc' are applied client-side.
const ORDEN_OPTIONS = [
    { value: "default",     label: "Relevancia" },
    { value: "precio",      label: "Precio: Menor a Mayor" },
    { value: "precio_desc", label: "Precio: Mayor a Menor" },
    { value: "titulo_asc",  label: "Nombre: A → Z" },
    { value: "titulo_desc", label: "Nombre: Z → A" },
];

const POPULAR_BRANDS = [
    "2GIG", "3CX", "3M", "ABLOY", "ALTRONIX", "APC", "AXIS", "BELDEN", "BOSCH", 
    "CISCO", "COMMSCOPE", "CP-PLUS", "DAHUA", "DELL", "DIGI", "D-LINK", "EATON", 
    "ENGENIUS", "EPCOM", "EPCOM POWER LINE", "EZVIZ", "FANVIL", "FLUKE", "GIGABYTE", 
    "GRANDSTREAM", "HANWHA VISION", "HIKVISION", "HILOOK", "HONEYWELL", "HP", "HUAWEI", 
    "ICOM", "IDIS", "INTEL", "JABRA", "KASPERSKY", "KENWOOD", "KINGSTON", "LENOVO", 
    "LG", "LINKEDPRO", "LINKSYS", "LOGITECH", "MIKROTIK", "MIMOSA", "MOTOROLA", 
    "NETGEAR", "NEXXT", "NVIDIA", "PANDUIT", "PANASONIC", "PELCO", "PHILIPS", 
    "POLY", "PRECISION", "QNAP", "RESIDEO", "ROSSLARE", "SEAGATE", "SENNHEISER", 
    "SONY", "STARLINK", "SUPREMA", "SYNOLOGY", "SYSCOM", "TP-LINK", "TRIPP LITE", 
    "UBIQUITI", "VIGI", "VIVOTEK", "WATCHGUARD", "WESTERN DIGITAL", "YEALINK", "ZKTECO"
].sort();

// Helper to render lists with "Mostrar más" functionality
function ExpandableFilterList({
  items,
  selectedItemId,
  onSelect,
  initialVisibleCount = 3,
  type = "checkbox"
}: {
  items: { id: string, name: string }[];
  selectedItemId: string | null;
  onSelect: (id: string, checked: boolean) => void;
  initialVisibleCount?: number;
  type?: "checkbox";
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, initialVisibleCount);

  return (
    <div className="space-y-3 mt-3">
      {visibleItems.map(item => (
        <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
          <Checkbox 
            className="border-slate-500 mt-0.5 data-[state=checked]:bg-white data-[state=checked]:text-[#0a0f1d] shrink-0" 
            checked={selectedItemId === item.id}
            onCheckedChange={(checked) => onSelect(item.id, !!checked)}
          />
          <span className="text-[13px] text-muted-foreground group-hover:text-foreground dark:text-zinc-100 dark:group-hover:text-white leading-tight mt-[1px]">
            {item.name}
          </span>
        </label>
      ))}
      {items.length > initialVisibleCount && (
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-[#4185f4] text-xs font-semibold hover:underline w-full text-center mt-4 transition-colors"
        >
          {expanded ? "Mostrar menos" : "Mostrar más"}
        </button>
      )}
    </div>
  );
}

export function SyscomFilterSidebar({ 
    categories, 
    selectedCategory, 
    selectedMarca, 
    selectedOrden, 
    selectedSucursal,
    selectedNuevo,
    selectedCajaAbierta,
    selectedEnExistencia,
    selectedOferta,
    selectedOutlet,
    sucursales,
    onFilterChange 
}: SyscomFilterSidebarProps) {
  
  const { secciones, lineas } = useMemo(() => {
    const visibleCats = categories.filter(cat => cat.isVisible !== false);
    const secciones = visibleCats
        .filter(cat => cat.level === 1)
        .sort((a,b) => (a.alias || a.name).localeCompare(b.alias || b.name));
    const lineas = visibleCats
        .filter(cat => cat.level === 2)
        .sort((a,b) => (a.alias || a.name).localeCompare(b.alias || b.name));
    return { secciones, lineas };
  }, [categories]);

  // States for search inputs
  const [searchCat, setSearchCat] = useState("");
  const [searchMarca, setSearchMarca] = useState("");

  const filteredLineas = useMemo(() => {
    let base = lineas;
    // Si hay una categoría nivel 1 seleccionada, mostramos solo sus hijas nivel 2
    if (selectedCategory) {
        const isLevel1 = secciones.some(s => s.id === selectedCategory);
        if (isLevel1) {
            base = lineas.filter(l => l.parentId === selectedCategory);
        }
    }
    
    if (!searchCat) return base;
    return base.filter(l => (l.alias || l.name).toLowerCase().includes(searchCat.toLowerCase()));
  }, [lineas, secciones, selectedCategory, searchCat]);

  const filteredBrands = useMemo(() => {
    if (!searchMarca) return POPULAR_BRANDS;
    return POPULAR_BRANDS.filter(b => b.toLowerCase().includes(searchMarca.toLowerCase()));
  }, [searchMarca]);

  const handleSelectMarca = (brand: string, checked: boolean) => {
    onFilterChange('marca', checked ? brand.toLowerCase() : null);
  };

  const handleSelectCategory = (categoryId: string, checked: boolean) => {
    // If clicking the already-selected category, deselect it
    if (!checked || selectedCategory === categoryId) {
      onFilterChange('category', null);
    } else {
      onFilterChange('category', categoryId);
    }
  };

  // Determine if we are on a level-1 parent (to show subcategories)
  const selectedIsLevel1 = selectedCategory ? secciones.some(s => s.id === selectedCategory) : false;
  const hasSubcategories = selectedIsLevel1 && filteredLineas.length > 0;

  // Count active filters for the badge
  const activeFilterCount = [
    selectedCategory, selectedMarca, selectedNuevo, selectedCajaAbierta,
    selectedEnExistencia, selectedOferta, selectedOutlet,
    selectedSucursal && selectedSucursal !== 'sucursales' ? selectedSucursal : null,
    selectedOrden ? selectedOrden : null,
  ].filter(Boolean).length;

  const handleClearAll = () => {
    // Navigate to plain catalog with no filters
    window.location.href = '/?category=22';
  };

  // Reusable Divider
  const Divider = () => <div className="border-b border-border dark:border-[#1c2331] my-5" />;
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-bold text-foreground dark:text-white mb-3">{children}</h3>
  );

  return (
    <div className="w-full bg-card dark:bg-[#0a0f1d] rounded-2xl md:rounded-sm text-card-foreground dark:text-white p-4 sm:p-5 border border-border dark:border-[#1c2331] shadow-lg md:shadow-xl">
      
      {/* Header with active filter count + clear button */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-foreground dark:text-white">
          Filtros
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-[#4185f4] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{activeFilterCount}</span>
          )}
        </span>
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearAll}
            className="text-[11px] text-[#4185f4] hover:underline font-semibold"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* 1. Ordenar por */}
      <div className="mb-0">
        <SectionTitle>Ordenar por</SectionTitle>
        <Select 
            value={selectedOrden || "default"} 
            onValueChange={(val) => onFilterChange('orden', val === 'default' ? null : val)}
        >
            <SelectTrigger className="w-full bg-transparent border-input dark:border-[#2a344a] text-foreground dark:text-white h-10 text-sm focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Relevancia" />
            </SelectTrigger>
            <SelectContent className="bg-popover dark:bg-[#0a0f1d] border-border dark:border-[#2a344a] text-popover-foreground dark:text-white">
                {ORDEN_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="focus:bg-accent dark:focus:bg-[#1c2331] focus:text-accent-foreground dark:focus:text-white cursor-pointer">
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      <Divider />

      {/* 2. Sucursal */}
      <div>
        <SectionTitle>Sucursal</SectionTitle>
        <Select 
            value={selectedSucursal || "sucursales"} 
            onValueChange={(val) => onFilterChange('sucursal', val === 'sucursales' ? null : val)}
        >
            <SelectTrigger className="w-full bg-transparent border-input dark:border-[#2a344a] text-foreground dark:text-white h-10 text-sm focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Sucursales" />
            </SelectTrigger>
            <SelectContent className="bg-popover dark:bg-[#0a0f1d] border-border dark:border-[#2a344a] text-popover-foreground dark:text-white overflow-y-auto max-h-[400px]">
                <SelectItem value="sucursales" className="focus:bg-accent dark:focus:bg-[#1c2331] focus:text-accent-foreground dark:focus:text-white cursor-pointer font-bold">Sucursales (Todas)</SelectItem>
                {Object.entries(SUCURSALES_POR_ESTADO).map(([estado, sucs]) => (
                    <SelectGroup key={estado}>
                        <SelectLabel className="text-muted-foreground dark:text-[#8b9aca] px-2 py-1.5 text-xs font-black uppercase tracking-widest bg-muted dark:bg-[#1c2331]/30">{estado}</SelectLabel>
                        {sucs.map(s => (
                            <SelectItem key={s.id} value={s.id} className="focus:bg-accent dark:focus:bg-[#1c2331] focus:text-accent-foreground dark:focus:text-white cursor-pointer pl-6">
                                {s.nombre}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                ))}
            </SelectContent>
        </Select>
      </div>

      <Divider />

      {/* 3. Promociones */}
      <div>
        <SectionTitle>Promociones</SectionTitle>
        <div className="space-y-4 mt-4">
            <label className="flex items-center gap-3 cursor-pointer group">
                <Switch 
                    className="data-[state=checked]:bg-[#4185f4] data-[state=unchecked]:bg-muted dark:data-[state=unchecked]:bg-[#2a344a]" 
                    checked={selectedNuevo}
                    onCheckedChange={(checked) => onFilterChange('nuevo', checked ? 'true' : null)}
                />
                <span className="text-[13px] text-muted-foreground group-hover:text-foreground dark:text-zinc-100 dark:group-hover:text-white flex items-center gap-2">
                    Producto Nuevo 
                    <span className="bg-[#4185f4] text-white text-[10px] px-1.5 py-0.5 rounded flex items-center h-4 font-semibold uppercase tracking-wider">Nuevo</span>
                </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
                <Switch 
                    className="data-[state=checked]:bg-[#4185f4] data-[state=unchecked]:bg-muted dark:data-[state=unchecked]:bg-[#2a344a]" 
                    checked={selectedCajaAbierta}
                    onCheckedChange={(checked) => onFilterChange('caja_abierta', checked ? 'true' : null)}
                />
                <span className="text-[13px] text-muted-foreground group-hover:text-foreground dark:text-zinc-100 dark:group-hover:text-white">Caja abierta</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
                <Switch 
                    className="data-[state=checked]:bg-[#4185f4] data-[state=unchecked]:bg-muted dark:data-[state=unchecked]:bg-[#2a344a]" 
                    checked={selectedEnExistencia}
                    onCheckedChange={(checked) => onFilterChange('en_existencia', checked ? 'true' : null)}
                />
                <span className="text-[13px] text-muted-foreground group-hover:text-foreground dark:text-zinc-100 dark:group-hover:text-white">En existencia</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
                <Switch 
                    className="data-[state=checked]:bg-[#eab308] data-[state=unchecked]:bg-muted dark:data-[state=unchecked]:bg-[#2a344a]" 
                    checked={selectedOferta}
                    onCheckedChange={(checked) => onFilterChange('oferta', checked ? 'true' : null)}
                />
                <span className="text-[13px] text-muted-foreground group-hover:text-foreground dark:text-zinc-100 dark:group-hover:text-white">En oferta</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
                <Switch 
                    className="data-[state=checked]:bg-[#ef4444] data-[state=unchecked]:bg-muted dark:data-[state=unchecked]:bg-[#2a344a]" 
                    checked={selectedOutlet}
                    onCheckedChange={(checked) => onFilterChange('outlet', checked ? 'true' : null)}
                />
                <span className="text-[13px] text-muted-foreground group-hover:text-foreground dark:text-zinc-100 dark:group-hover:text-white uppercase font-bold text-[11px]">Outlet</span>
            </label>
        </div>
      </div>

      <Divider />

      {/* 4. Categorías Principales (Level 1) */}
      <div>
        <SectionTitle>Categorías</SectionTitle>
        <ExpandableFilterList 
          items={secciones.map(c => ({id: c.id, name: c.alias || c.name}))}
          selectedItemId={selectedCategory}
          onSelect={handleSelectCategory}
          initialVisibleCount={15}
        />
      </div>

      {/* 5. Subcategorías — Only visible when a level-1 category is selected */}
      {hasSubcategories && (
        <>
          <Divider />
          <div>
            <SectionTitle>
              Subcategorías de {(() => {
                const parent = secciones.find(s => s.id === selectedCategory);
                return parent ? (parent.alias || parent.name) : '';
              })()}
            </SectionTitle>
            <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b9aca]" />
                <Input 
                    placeholder="Buscar subcategorías" 
                    value={searchCat}
                    onChange={(e) => setSearchCat(e.target.value)}
                    className="pl-9 h-10 w-full bg-white text-zinc-900 border-none rounded-sm placeholder:text-[#6c7693] focus-visible:ring-2 focus-visible:ring-[#4185f4]"
                />
            </div>
            <div className="mt-4">
                <ExpandableFilterList 
                items={filteredLineas.map(c => ({id: c.id, name: c.alias || c.name}))}
                selectedItemId={selectedCategory}
                onSelect={handleSelectCategory}
                initialVisibleCount={12}
                />
            </div>
          </div>
        </>
      )}

      <Divider />

      {/* 6. Marcas */}
      <div>
        <SectionTitle>Marcas</SectionTitle>
        <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b9aca]" />
            <Input 
                placeholder="Buscar marcas" 
                value={searchMarca}
                onChange={(e) => setSearchMarca(e.target.value)}
                className="pl-9 h-10 w-full bg-white text-zinc-900 border-none rounded-sm placeholder:text-[#6c7693] focus-visible:ring-2 focus-visible:ring-[#4185f4]"
            />
        </div>
        <div className="mt-4">
            <ExpandableFilterList 
            items={filteredBrands.map(b => ({id: b.toLowerCase(), name: b}))}
            selectedItemId={selectedMarca || null}
            onSelect={(id, checked) => onFilterChange('marca', checked ? id : null)}
            initialVisibleCount={8}
            />
        </div>
      </div>

    </div>
  );
}
