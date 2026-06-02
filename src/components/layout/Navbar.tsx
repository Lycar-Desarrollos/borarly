
"use client";

import Link from 'next/link';
import { ShoppingCart, User, Search, LogOut, LayoutDashboard, Heart, Loader2, MessageCircle, Menu, Video, Network, Key, Zap, Server, ChevronLeft, ChevronRight, ChevronDown, Shield, Flame, Cable, Speaker, Hammer } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormEvent, useState, useEffect, useRef, useCallback } from 'react';
import { getProducts, getCategories } from '@/services/productService';
import type { Product, Category } from '@/lib/types';
import Image from 'next/image';

export function Navbar() {
  const { cartCount } = useCart();
  const { currentUser, userProfile, signOut, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const isCheckoutPhase = pathname === '/checkout';


  // Effect to clear search when main navigation happens
  useEffect(() => {
    setIsSearchVisible(false);
    setSearchTerm('');
  }, [pathname]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const allCats = await getCategories();
        // Solo categorías de nivel 1 que sean visibles Y marcadas para el Navbar
        const level1Visible = allCats.filter(c => c.level === 1 && c.isVisible !== false && c.showInNavbar !== false);
        setCategories(level1Visible);
      } catch (error) {
        console.error("Error loading navbar categories", error);
      }
    }
    loadCategories();
  }, []);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setIsSearchVisible(false);
      router.push(`/?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      const products = await getProducts(undefined, searchTerm, 5);
      setSearchResults(products);
      setIsSearching(false);
    };

    const debounceTimeout = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchTerm]);


  const handleFocus = () => {
    if (searchTerm.length > 1) {
      setIsSearchVisible(true);
    }
  };
  
  // Use onBlur on the container to detect when focus leaves the search area
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // We use a short timeout to allow click events on the results to register before hiding.
    // `relatedTarget` is the new element gaining focus. If it's outside the search container, we hide.
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
       setTimeout(() => {
         setIsSearchVisible(false);
       }, 100);
    }
  };


  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const SearchResultsDropdown = () => (
    <div className="absolute top-full mt-2 w-full bg-card border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {isSearching ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
        </div>
      ) : searchResults.length > 0 ? (
        <ul>
          {searchResults.map(product => (
            <li key={product.id}>
              {/* This link structure is now the standard and recommended way */}
              <Link
                href={`/products/${product.id}`}
                className="flex items-center gap-4 p-3 hover:bg-accent transition-colors"
                // Prevent blur when clicking a link, allowing navigation to happen
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="relative h-12 w-12 flex-shrink-0 bg-white rounded border">
                   <Image src={product.imageUrls[0]} alt={product.name} layout="fill" objectFit="contain" className="p-1"/>
                </div>
                <div className="flex-grow overflow-hidden">
                  <p className="font-medium truncate text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(product.price)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-4 text-center text-sm text-muted-foreground">No se encontraron resultados.</p>
      )}
    </div>
  );

  const getCategoryIcon = (name: string) => {
    // Normalizar para ignorar acentos y mayúsculas
    const lowerName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (lowerName.includes('video') || lowerName.includes('camara')) return <Video className="h-4 w-4" />;
    if (lowerName.includes('red') || lowerName.includes('it') || lowerName.includes('datos') || lowerName.includes('computo') || lowerName.includes('servidor')) return <Network className="h-4 w-4" />;
    if (lowerName.includes('acceso') || lowerName.includes('biometrico') || lowerName.includes('llave') || lowerName.includes('cerradura')) return <Key className="h-4 w-4" />;
    if (lowerName.includes('energia') || lowerName.includes('solar') || lowerName.includes('ups') || lowerName.includes('electrico') || lowerName.includes('bateria')) return <Zap className="h-4 w-4" />;
    if (lowerName.includes('radio') || lowerName.includes('comunicacion')) return <Server className="h-4 w-4" />;
    if (lowerName.includes('intrusion') || lowerName.includes('alarma') || lowerName.includes('automatizacion') || lowerName.includes('smart')) return <Shield className="h-4 w-4" />;
    if (lowerName.includes('fuego') || lowerName.includes('incendio') || lowerName.includes('humo')) return <Flame className="h-4 w-4" />;
    if (lowerName.includes('cable') || lowerName.includes('fibra') || lowerName.includes('estructurado')) return <Cable className="h-4 w-4" />;
    if (lowerName.includes('audio') || lowerName.includes('voconeo') || lowerName.includes('sonido') || lowerName.includes('parlante')) return <Speaker className="h-4 w-4" />;
    if (lowerName.includes('herramienta') || lowerName.includes('medicion') || lowerName.includes('tester')) return <Hammer className="h-4 w-4" />;
    
    return <ChevronDown className="h-3 w-3" />;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Logo */}
        <div className="flex items-center md:flex-1 shrink-0 group">
          <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-foreground select-none">
            <Image
              src="/icon-192.png"
              alt="BORARLY Logo"
              width={32}
              height={32}
              priority
              className="h-8 w-8 object-contain transition-transform group-hover:scale-105"
            />
            <span className="leading-none hidden sm:block font-black text-2xl tracking-tighter bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400">
              BORARLY
            </span>
          </Link>
        </div>
        
        {/* Center: Search (Perfectly Centered) */}
        {!isCheckoutPhase && (
        <div 
          ref={searchContainerRef} 
          className="hidden md:flex relative w-full max-w-md lg:max-w-2xl px-2 shrink"
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="flex items-center gap-2 w-full">
                <Input
                type="search"
                placeholder="Buscar productos..."
                className="w-full"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value.length > 1) {
                        setIsSearchVisible(true);
                    } else {
                        setIsSearchVisible(false);
                    }
                }}
                />
                <Button type="submit" variant="outline" size="icon" className="shrink-0 group hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Search className="h-5 w-5 transition-transform group-hover:scale-110" />
                </Button>
            </div>
          </form>
          {isSearchVisible && searchTerm.length > 1 && <SearchResultsDropdown />}
        </div>
        )}

        {/* Right: Icons */}
        <div className="flex items-center justify-end md:flex-1 shrink-0">
          {isCheckoutPhase ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-bold bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
                <Shield className="w-5 h-5"/>
                <span className="hidden sm:inline">Checkout Seguro 100%</span>
            </div>
          ) : (
            <nav className="flex items-center gap-1 sm:gap-2 lg:gap-4">
              <ThemeToggle />
              <a href="https://wa.me/529993101452" target="_blank" rel="noopener noreferrer" className="hidden lg:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-green-500 transition-colors">
                <MessageCircle className="h-5 w-5 text-green-500" />
                <span>WhatsApp</span>
              </a>

              <Link href="/cart">
                <Button variant="ghost" size="icon" aria-label="Carrito de Compras" className="relative">
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={userProfile?.photoURL || undefined} alt={userProfile?.displayName || 'Usuario'} />
                        <AvatarFallback>{userProfile?.displayName?.charAt(0)?.toUpperCase() || <User className="h-5 w-5"/>}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userProfile?.displayName || 'Usuario'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {userProfile?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Mi Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/orders">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>Mis Pedidos</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/wishlist">
                        <Heart className="mr-2 h-4 w-4" />
                        <span>Mi Lista de Deseos</span>
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Panel de Admin</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button variant="outline" className="px-2 sm:px-4">
                    <User className="h-5 w-5 sm:mr-2" /> 
                    <span className="hidden sm:inline">Iniciar Sesión</span>
                  </Button>
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>

      {!isCheckoutPhase && (
        <div 
         className="md:hidden p-2 border-t relative"
         onFocus={handleFocus}
         onBlur={handleBlur}
        >
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full">
            <Input
              type="search"
              placeholder="Buscar productos..."
              className="flex-grow"
              value={searchTerm}
              onChange={(e) => {
                  setSearchTerm(e.target.value);
                   if (e.target.value.length > 1) {
                        setIsSearchVisible(true);
                    } else {
                        setIsSearchVisible(false);
                    }
                }}
            />
            <Button type="submit" variant="outline" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </form>
          {isSearchVisible && searchTerm.length > 1 && <SearchResultsDropdown />}
        </div>
      )}

      {/* Menú Secundario de Categorías (Submenu Dinámico) */}
      {!isCheckoutPhase && (
      <div className="hidden md:block border-t bg-muted w-full relative group/nav">
        {/* Fades para bordes */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-muted to-transparent z-10 pointer-events-none opacity-0 group-hover/nav:opacity-100 transition-opacity" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-muted to-transparent z-10 pointer-events-none opacity-0 group-hover/nav:opacity-100 transition-opacity" />
        
        {/* Botones de Navegación (Solo visibles en hover y si hay overflow) */}
        <button 
          onClick={() => {
            const container = document.getElementById('navbar-category-scroll');
            if (container) container.scrollBy({ left: -250, behavior: 'smooth' });
          }}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border rounded-full p-1 shadow-md opacity-0 group-hover/nav:opacity-100 transition-opacity hover:scale-110 active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button 
          onClick={() => {
            const container = document.getElementById('navbar-category-scroll');
            if (container) container.scrollBy({ left: 250, behavior: 'smooth' });
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border rounded-full p-1 shadow-md opacity-0 group-hover/nav:opacity-100 transition-opacity hover:scale-110 active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div 
          id="navbar-category-scroll"
          className="max-w-7xl mx-auto px-10 h-12 w-full flex items-center justify-start lg:justify-center gap-4 lg:gap-8 text-sm text-muted-foreground font-medium whitespace-nowrap overflow-x-auto no-scrollbar scroll-smooth"
        >
          {categories.length > 0 ? (
            <>
              {categories.slice(0, 8).map((cat) => (
                <Link 
                  key={cat.id} 
                  href={`/?category=${cat.id}`} 
                  className="flex items-center gap-2 hover:text-primary transition-colors shrink-0"
                >
                  {getCategoryIcon(cat.alias || cat.name)}
                  <span>{cat.alias || cat.name}</span>
                </Link>
              ))}
              <Link 
                href="/?category=all" 
                className="flex items-center gap-2 bg-primary/5 hover:bg-primary hover:text-primary-foreground text-primary font-bold px-4 py-1.5 rounded-full transition-all shadow-sm shrink-0 ml-4 border border-primary/20"
              >
                <span>VER TODAS</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/?search=videovigilancia" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Video className="h-4 w-4" />
                <span>Videovigilancia</span>
              </Link>
              <Link href="/?search=redes" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Network className="h-4 w-4" />
                <span>Redes e IT</span>
              </Link>
              <Link href="/?search=acceso+intrusion" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Key className="h-4 w-4" />
                <span>Control de Acceso</span>
              </Link>
            </>
          )}
        </div>
      </div>
      )}
    </header>
  );
}
