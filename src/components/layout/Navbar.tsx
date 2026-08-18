"use client";

import Link from 'next/link';
import { 
  ShoppingCart, User, Search, LogOut, LayoutDashboard, Heart, Loader2, 
  MessageCircle, Menu, Video, Network, Key, Zap, Server, ChevronRight, 
  ChevronDown, Shield, Flame, Cable, Speaker, Hammer, Camera, Mic, MicOff, 
  Sparkles, X, Check, Box, Tag, ArrowRight, Layers, HelpCircle
} from 'lucide-react'; 
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
import { FormEvent, useState, useEffect, useRef, ChangeEvent } from 'react';
import { getCategories } from '@/services/productService';
import type { Product, Category } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { MegaMenu } from './MegaMenu';
import { CartDropdown } from './CartDropdown';
import { BorarlyAIChatModal } from '@/components/ai/BorarlyAIChatModal';

export function Navbar() {
  const { cartCount } = useCart();
  const { currentUser, userProfile, signOut, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Search & AI Chat States
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const isCheckoutPhase = pathname === '/checkout';

  // Clear search on page navigation
  useEffect(() => {
    setIsSearchVisible(false);
    setSearchTerm('');
  }, [pathname]);

  // Fast live search via /api/search with debounce
  useEffect(() => {
    const fetchResults = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (error) {
        console.error("Error fetching live search results", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimeout = setTimeout(fetchResults, 250);
    return () => clearTimeout(debounceTimeout);
  }, [searchTerm]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setIsSearchVisible(false);
      router.push(`/?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleFocus = () => {
    if (searchTerm.length > 1) {
      setIsSearchVisible(true);
    }
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
       setTimeout(() => {
         setIsSearchVisible(false);
       }, 150);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lowerName.includes('video') || lowerName.includes('camara')) return <Video className="h-4 w-4 text-blue-500" />;
    if (lowerName.includes('red') || lowerName.includes('it') || lowerName.includes('datos') || lowerName.includes('computo') || lowerName.includes('servidor')) return <Network className="h-4 w-4 text-cyan-500" />;
    if (lowerName.includes('acceso') || lowerName.includes('biometrico') || lowerName.includes('llave') || lowerName.includes('cerradura')) return <Key className="h-4 w-4 text-amber-500" />;
    if (lowerName.includes('energia') || lowerName.includes('solar') || lowerName.includes('ups') || lowerName.includes('electrico') || lowerName.includes('bateria')) return <Zap className="h-4 w-4 text-yellow-500" />;
    if (lowerName.includes('radio') || lowerName.includes('comunicacion')) return <Server className="h-4 w-4 text-indigo-500" />;
    if (lowerName.includes('intrusion') || lowerName.includes('alarma') || lowerName.includes('automatizacion') || lowerName.includes('smart')) return <Shield className="h-4 w-4 text-emerald-500" />;
    if (lowerName.includes('fuego') || lowerName.includes('incendio') || lowerName.includes('humo')) return <Flame className="h-4 w-4 text-red-500" />;
    if (lowerName.includes('cable') || lowerName.includes('fibra') || lowerName.includes('estructurado')) return <Cable className="h-4 w-4 text-purple-500" />;
    if (lowerName.includes('audio') || lowerName.includes('voconeo') || lowerName.includes('sonido') || lowerName.includes('parlante')) return <Speaker className="h-4 w-4 text-teal-500" />;
    if (lowerName.includes('herramienta') || lowerName.includes('medicion') || lowerName.includes('tester')) return <Hammer className="h-4 w-4 text-orange-500" />;
    return <Box className="h-4 w-4 text-blue-400" />;
  };

  // Dropdown de Resultados Instantáneos
  const SearchResultsDropdown = () => (
    <div className="absolute top-full mt-2 w-full bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl z-50 max-h-[60vh] sm:max-h-[480px] overflow-y-auto overscroll-contain divide-y divide-border/40 animate-in fade-in-50 zoom-in-95">
      
      {/* Estado de carga */}
      {isSearching && (
        <div className="flex items-center justify-center p-6 gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Buscando en catálogo nacional...</span>
        </div>
      )}

      {/* Resultados Encontrados */}
      {!isSearching && searchResults.length > 0 && (
        <div className="p-2 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Coincidencias ({searchResults.length})</span>
          </div>
          <ul>
            {searchResults.map(product => {
              const rawImg = product.imageUrls?.[0] || 'https://placehold.co/100x100.png';
              const thumbUrl = rawImg.includes('syscom.mx') 
                ? `/api/image-proxy?url=${encodeURIComponent(rawImg)}` 
                : rawImg;

              return (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.id}`}
                    className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all group"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div className="relative h-12 w-12 flex-shrink-0 bg-white rounded-lg border border-border/60 overflow-hidden shadow-2xs">
                      <Image 
                        src={thumbUrl} 
                        alt={product.name} 
                        fill 
                        className="object-contain p-1 group-hover:scale-105 transition-transform" 
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        {product.line && (
                          <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {product.line}
                          </span>
                        )}
                        {product.brand && (
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                            {product.brand}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold truncate text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground mt-0.5">
                        <span className="text-primary">{formatCurrency(product.price)}</span>
                        {product.stock > 0 ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ {product.stock} en stock</span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-medium">Bajo Pedido</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Sugerencias Rápidas de Categorías */}
      <div className="p-3 bg-muted/30">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Búsquedas Rápidas</p>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={`/?search=${encodeURIComponent(searchTerm || 'videovigilancia')}&category=22`}
            className="text-xs bg-card hover:bg-primary/10 border border-border/60 hover:border-primary/40 px-2.5 py-1 rounded-lg text-foreground transition-all"
            onMouseDown={(e) => e.preventDefault()}
          >
            📹 En Videovigilancia
          </Link>
          <Link
            href={`/?search=${encodeURIComponent(searchTerm || 'redes')}&category=21`}
            className="text-xs bg-card hover:bg-primary/10 border border-border/60 hover:border-primary/40 px-2.5 py-1 rounded-lg text-foreground transition-all"
            onMouseDown={(e) => e.preventDefault()}
          >
            🌐 En Redes e IT
          </Link>
          <Link
            href={`/?search=${encodeURIComponent(searchTerm || 'acceso')}&category=23`}
            className="text-xs bg-card hover:bg-primary/10 border border-border/60 hover:border-primary/40 px-2.5 py-1 rounded-lg text-foreground transition-all"
            onMouseDown={(e) => e.preventDefault()}
          >
            🔒 En Control de Acceso
          </Link>
        </div>
      </div>

      {/* Botón Ver Todos */}
      {!isSearching && searchTerm.length > 1 && (
        <button
          onClick={handleSearchSubmit}
          className="w-full p-3 text-center text-xs font-bold text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5"
          onMouseDown={(e) => e.preventDefault()}
        >
          <span>Ver todos los resultados para &quot;{searchTerm}&quot;</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}

      {!isSearching && searchResults.length === 0 && (
        <div className="p-6 text-center text-sm text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">No encontramos coincidencias directas para &quot;{searchTerm}&quot;</p>
          <p className="text-xs">Intenta buscando por modelo (ej. WD11PURZ), marca o descripción general.</p>
        </div>
      )}
    </div>
  );

  // Voice Recognition Ref
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);

  // Web Speech API Voice Search
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'es-MX';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setSearchTerm(transcript);
            setIsSearchVisible(true);
            router.push(`/?search=${encodeURIComponent(transcript.trim())}`);
          }
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, [router]);

  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) {
      alert("El reconocimiento de voz no está disponible en este navegador.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Voice search already active", e);
      }
    }
  };

  const handleImageSearchClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ")
        .replace(/IMG|FOTO|PHOTO|PORTADA|DSC/gi, "")
        .trim();
      
      if (cleanName.length > 2) {
        setSearchTerm(cleanName);
        setIsSearchVisible(true);
        router.push(`/?search=${encodeURIComponent(cleanName)}`);
      } else {
        router.push(`/?search=${encodeURIComponent(file.name.substring(0, 15))}`);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090d16] text-white shadow-md">
      
      {/* 1. BARRA PRINCIPAL SUPERIOR (LOGO, BUSCADOR CENTRADO Y FLUIDO, CARRITO, AVATAR) */}
      {/* En móvil el buscador baja a una segunda línea a todo lo ancho (flex-wrap);
          desde `sm` vuelve a la fila única de escritorio. */}
      <div className="max-w-[1520px] mx-auto px-3 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 py-2.5 sm:flex-nowrap sm:py-0 sm:h-20 md:h-24 sm:gap-6 md:gap-8">

        {/* LOGO NATIVO ORIGINAL BORARLY */}
        <div className="flex items-center shrink-0">
          <Link href="/" className="flex items-center select-none group py-1">
            <Image
              src="/logo-white.png"
              alt="BORARLY"
              width={195}
              height={52}
              priority
              className="h-8 sm:h-10 md:h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
        </div>

        {/* BUSCADOR UNIVERSAL */}
        {!isCheckoutPhase && (
          <div
            ref={searchContainerRef}
            className="order-last w-full relative sm:order-none sm:w-auto sm:flex-1 sm:max-w-3xl sm:mx-4"
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            <form onSubmit={handleSearchSubmit} className="w-full flex items-center">
              <div className={cn(
                "relative flex items-center w-full h-11 sm:h-12 rounded-full bg-white text-zinc-900 border transition-all duration-200 shadow-sm overflow-hidden px-3 sm:px-4",
                isSearchVisible ? "ring-2 ring-blue-500 border-transparent shadow-md" : "border-zinc-300 hover:border-zinc-400"
              )}>
                {/* Icono de búsqueda */}
                <div className="pr-2 sm:pr-3 pointer-events-none text-zinc-400">
                  <Search className="h-5 w-5" />
                </div>

                {/* Input de texto: placeholder corto en móvil, completo en escritorio */}
                <input
                  type="text"
                  placeholder="Buscar productos, modelo o marca..."
                  className="w-full py-2.5 text-sm bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400 pr-2 font-medium"
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

                {/* Botón Borrar único si hay texto */}
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setIsSearchVisible(false);
                    }}
                    className="p-2 -mr-1 text-zinc-400 hover:text-zinc-700 rounded-full transition-colors shrink-0"
                    title="Borrar búsqueda"
                    aria-label="Borrar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Desplegable de Resultados en Vivo */}
            {isSearchVisible && searchTerm.length > 1 && <SearchResultsDropdown />}
          </div>
        )}

        {/* ACCIONES LATERALES: AVATAR / PERFIL Y CARRITO */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          
          {/* Avatar de Usuario Circular / Botón Iniciar Sesión */}
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  type="button" 
                  aria-label="Menú de Usuario" 
                  className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full ring-2 ring-blue-600 ring-offset-2 ring-offset-[#090d16] bg-white text-zinc-950 flex items-center justify-center font-bold text-sm shadow-sm hover:scale-105 transition-transform overflow-hidden select-none outline-none cursor-pointer shrink-0"
                >
                  <Avatar className="h-full w-full">
                    <AvatarImage src={userProfile?.photoURL || undefined} alt={userProfile?.displayName || 'Usuario'} />
                    <AvatarFallback className="bg-white text-zinc-950 font-black text-sm">
                      {userProfile?.displayName?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || 'E'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.displayName || 'Usuario'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userProfile?.email}</p>
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
                      <span>Panel Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" aria-label="Iniciar sesión">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs px-3 sm:px-3.5 h-10 cursor-pointer">
                <User className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Iniciar Sesión</span>
              </Button>
            </Link>
          )}

          {/* Botón Directo al Carrito */}
          <CartDropdown />
        </div>
      </div>

      {/* 2. SUB-BARRA DE NAVEGACIÓN CON ESPACIADO CÓMODO Y SEPARACIÓN */}
      {!isCheckoutPhase && (
        <div className="border-t border-white/10 bg-[#060910] text-xs font-semibold text-zinc-300 py-1.5 sm:py-2 relative z-40">
          {/* En pantallas muy angostas la fila se puede deslizar en lugar de romperse */}
          <div className="max-w-[1520px] mx-auto px-3 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between gap-2 sm:gap-6 overflow-x-auto no-scrollbar sm:overflow-x-visible">

            {/* Lado Izquierdo: Catálogo de Productos y Servicios */}
            <div className="flex items-center gap-2 sm:gap-6">
              {/* Botón Mega Menú ☰ Productos */}
              <MegaMenu />

              {/* Botón Servicios */}
              <Link
                href="/services"
                className="h-10 sm:h-11 px-3.5 sm:px-6 rounded-xl sm:rounded-2xl text-[12px] sm:text-sm font-bold uppercase tracking-wider text-zinc-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 hover:border-cyan-400/50 flex items-center gap-2 sm:gap-2.5 transition-all shadow-xs hover:scale-[1.02] active:scale-95 shrink-0 group select-none"
              >
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:rotate-6 transition-transform shrink-0" />
                <span>Servicios</span>
              </Link>
            </div>

            {/* Lado Derecho: Asesor WhatsApp */}
            <div className="flex items-center shrink-0">
              <a
                href="https://wa.me/5219999040931"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 sm:h-11 px-3.5 sm:px-6 rounded-xl sm:rounded-2xl text-[12px] sm:text-sm font-bold uppercase tracking-wider text-emerald-300 hover:text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 hover:border-emerald-400/60 flex items-center gap-2 sm:gap-2.5 transition-all shadow-xs hover:scale-[1.02] active:scale-95 select-none shrink-0"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 fill-green-400/20 shrink-0" />
                {/* Etiqueta corta en móvil para que quepa junto al resto */}
                <span className="sm:hidden">WhatsApp</span>
                <span className="hidden sm:inline">Asesor WhatsApp</span>
              </a>
            </div>

          </div>
        </div>
      )}

    </header>
  );
}
