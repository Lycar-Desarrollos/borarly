
"use client";

import type { Product, Category } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { Edit, Trash2, Eye, FilterX } from 'lucide-react';
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
import { deleteProduct, deleteProducts } from '@/services/productService';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface ProductDataTableProps {
  products: Product[];
  categories: Category[];
}

export function ProductDataTable({ products: initialProducts, categories: initialCategories }: ProductDataTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [nameOrSkuFilter, setNameOrSkuFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const [columnVisibility, setColumnVisibility] = useState({
    image: true,
    sku: true,
    description: true,
    brand: true,
    category: true, // This will now represent 'Sección'
    line: true,
    series: true,
    totalStock: true,
    price: true,
  });
  
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    setCategories(initialCategories || []);
  }, [initialCategories]);

  const handleDelete = async (productId: string, productName: string) => {
    try {
      await deleteProduct(productId);
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      toast({ title: "Producto Eliminado", description: `"${productName}" (SKU: ${productId}) ha sido eliminado.` });
      router.refresh();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el producto." });
    }
  };
  
  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    try {
        await deleteProducts(selectedIds);
        setProducts(prevProducts => prevProducts.filter(p => !selectedIds.includes(p.id)));
        toast({ title: "Productos Eliminados", description: `${selectedIds.length} productos han sido eliminados.` });
        setRowSelection({}); // Clear selection
        router.refresh();
    } catch(error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudieron eliminar los productos seleccionados." });
    }
  }

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  const getCategoryHierarchy = (serieId: string): { seccion: string; linea: string; serie: string } => {
    const serie = categoryMap.get(serieId);
    if (!serie) return { seccion: 'N/A', linea: 'N/A', serie: 'N/A' };
    
    const linea = categoryMap.get(serie.parentId || '');
    if (!linea) return { seccion: 'N/A', linea: 'N/A', serie: serie.name };

    const seccion = categoryMap.get(linea.parentId || '');
    if (!seccion) return { seccion: 'N/A', linea: linea.name, serie: serie.name };
    
    return {
        seccion: seccion.name,
        linea: linea.name,
        serie: serie.name
    };
};

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const nameOrSkuMatch = nameOrSkuFilter === '' ||
                             product.name.toLowerCase().includes(nameOrSkuFilter.toLowerCase()) ||
                             product.id.toLowerCase().includes(nameOrSkuFilter.toLowerCase());
      const categoryMatch = categoryFilter === 'all' || product.category === categoryFilter;
      return nameOrSkuMatch && categoryMatch;
    });
  }, [products, nameOrSkuFilter, categoryFilter]);
  
  useEffect(() => {
    setRowSelection({});
  }, [nameOrSkuFilter, categoryFilter]);


  const clearFilters = () => {
    setNameOrSkuFilter('');
    setCategoryFilter('all');
  };
  
  const selectedRowCount = Object.values(rowSelection).filter(Boolean).length;

  const tableHeaderCells: ReactNode[] = [
    <TableHead key="th-select" className="w-[40px]">
        <Checkbox
          checked={selectedRowCount > 0 && selectedRowCount === filteredProducts.length}
          onCheckedChange={(checked) => {
            const newSelection: Record<string, boolean> = {};
            if (checked) {
              filteredProducts.forEach(p => newSelection[p.id] = true);
            }
            setRowSelection(newSelection);
          }}
          aria-label="Seleccionar todas las filas"
        />
    </TableHead>
  ];
  if (columnVisibility.image) tableHeaderCells.push(<TableHead key="th-image">Imagen</TableHead>);
  if (columnVisibility.sku) tableHeaderCells.push(<TableHead key="th-sku">Código de producto</TableHead>);
  if (columnVisibility.description) tableHeaderCells.push(<TableHead key="th-desc">Descripción</TableHead>);
  if (columnVisibility.brand) tableHeaderCells.push(<TableHead key="th-brand">Marca</TableHead>);
  if (columnVisibility.category) tableHeaderCells.push(<TableHead key="th-category">Sección</TableHead>);
  if (columnVisibility.line) tableHeaderCells.push(<TableHead key="th-line">Línea</TableHead>);
  if (columnVisibility.series) tableHeaderCells.push(<TableHead key="th-series">Serie</TableHead>);
  if (columnVisibility.totalStock) tableHeaderCells.push(<TableHead key="th-total-stock" className="text-center font-bold">Total Piezas</TableHead>);
  if (columnVisibility.price) tableHeaderCells.push(<TableHead key="th-price" className="text-right">Precio Final (IVA Incluido)</TableHead>);
  tableHeaderCells.push(<TableHead key="th-actions" className="text-right w-[100px] sm:w-[120px]">Acciones</TableHead>);


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-lg bg-card">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Filtrar por nombre o SKU..."
            value={nameOrSkuFilter}
            onChange={(e) => setNameOrSkuFilter(e.target.value)}
            className="max-w-xs flex-grow sm:flex-grow-0"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={!categories || categories.length === 0}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Categorías</SelectItem>
              {categories && categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={clearFilters} size="icon" className="hidden sm:inline-flex" title="Limpiar Filtros">
            <FilterX className="h-5 w-5" />
          </Button>
        </div>
         <Button variant="ghost" onClick={clearFilters} className="w-full sm:hidden">
            <FilterX className="mr-2 h-5 w-5" /> Limpiar Filtros
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Columnas</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Alternar columnas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.keys(columnVisibility).map((key) => {
              const labelMap: Record<string, string> = {
                image: "Imagen",
                sku: "Código de producto",
                description: "Descripción",
                brand: "Marca",
                category: "Sección",
                line: "Línea",
                series: "Serie",
                totalStock: "Total Piezas",
                price: "Precio Final (IVA Incluido)"
              };
              return (
              <DropdownMenuCheckboxItem
                key={key}
                className="capitalize"
                checked={columnVisibility[key as keyof typeof columnVisibility]}
                onCheckedChange={(value) =>
                  setColumnVisibility(prev => ({...prev, [key]: !!value}))
                }
              >
                {labelMap[key] || key}
              </DropdownMenuCheckboxItem>
            )})}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {tableHeaderCells}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const totalStock = product.stock || 0;
                const { seccion, linea, serie } = getCategoryHierarchy(product.category);

                const rowCells: ReactNode[] = [
                    <TableCell key={`select-${product.id}`}>
                        <Checkbox
                            checked={rowSelection[product.id] || false}
                            onCheckedChange={(checked) => {
                                setRowSelection(prev => ({ ...prev, [product.id]: !!checked }));
                            }}
                            aria-label={`Seleccionar fila para ${product.name}`}
                        />
                    </TableCell>
                ];
                
                if (columnVisibility.image) rowCells.push(
                  <TableCell key={`image-${product.id}`}>
                    <div className="w-16 h-16 relative bg-white border rounded-md overflow-hidden">
                        <Image 
                            src={product.imageUrls[0] || 'https://placehold.co/100x100.png'} 
                            alt={product.name} 
                            layout="fill" 
                            objectFit="contain" 
                            className="p-1"
                        />
                    </div>
                  </TableCell>
                );
                if (columnVisibility.sku) rowCells.push(<TableCell key={`sku-${product.id}`} className="font-medium">{product.id}</TableCell>);
                if (columnVisibility.description) rowCells.push(<TableCell key={`desc-${product.id}`} className="text-sm">{product.name}</TableCell>);
                if (columnVisibility.brand) rowCells.push(<TableCell key={`brand-${product.id}`}>{product.brand}</TableCell>);
                if (columnVisibility.category) rowCells.push(<TableCell key={`cat-${product.id}`}>{seccion}</TableCell>);
                if (columnVisibility.line) rowCells.push(<TableCell key={`line-${product.id}`}>{linea}</TableCell>);
                if (columnVisibility.series) rowCells.push(<TableCell key={`series-${product.id}`}>{serie}</TableCell>);
                if (columnVisibility.totalStock) rowCells.push(<TableCell key={`total-stock-${product.id}`} className="text-center font-bold">{totalStock}</TableCell>);
                if (columnVisibility.price) rowCells.push(<TableCell key={`price-${product.id}`} className="text-right font-semibold">{formatCurrency(product.price)}</TableCell>);
                
                rowCells.push(
                  <TableCell key={`actions-${product.id}`} className="text-right">
                    <div className="flex gap-1 sm:gap-2 justify-end">
                      <Link href={`/products/${product.id}`} title="Ver Producto">
                        <Button variant="outline" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/products/edit/${product.id}`} title="Editar Producto">
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" title="Eliminar Producto">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto "{product.name}" (SKU: {product.id}).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(product.id, product.name)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                );

                return (
                  <TableRow key={product.id} data-state={rowSelection[product.id] && "selected"}>
                    {rowCells}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={tableHeaderCells.length} className="h-24 text-center">
                  No se encontraron productos con tus filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {selectedRowCount > 0 && (
            <div className="flex items-center justify-between p-4 border-t sticky bottom-0 bg-background/95">
                <div className="text-sm text-muted-foreground">
                    {selectedRowCount} de {filteredProducts.length} fila(s) seleccionada(s).
                </div>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar ({selectedRowCount})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Eliminación Masiva</AlertDialogTitle>
                            <AlertDialogDescription>
                                ¿Estás seguro de que quieres eliminar los {selectedRowCount} productos seleccionados? Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkDelete}>
                                Sí, eliminar {selectedRowCount} productos
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )}
      </Card>
    </div>
  );
}
