"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Menu, ChevronRight, ChevronDown, Video, Radio, Network, Sun, Shield, 
  KeyRound, Flame, Wrench, Cpu, Car, Layers, Speaker, Sparkles,
  ExternalLink, ArrowRight, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubCategoryItem {
  name: string;
  query?: string;
  categoryId?: string;
}

interface SubCategoryGroup {
  title: string;
  items: SubCategoryItem[];
}

interface MainCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  categoryId?: string;
  groups: SubCategoryGroup[];
}

const MEGA_MENU_DATA: MainCategory[] = [
  {
    id: 'audio-video',
    name: 'Audio y Video Profesional',
    icon: <Speaker className="w-4 h-4" />,
    categoryId: '66523',
    groups: [
      {
        title: 'Audio IP',
        items: [
          { name: 'Accesorios', query: 'audio ip accesorio' },
          { name: 'Amplificadores IP', query: 'amplificador ip' },
          { name: 'Bocinas IP', query: 'bocina ip' },
          { name: 'Interfaces', query: 'interfaz audio ip' }
        ]
      },
      {
        title: 'Audio Profesional / PA',
        items: [
          { name: 'Accesorios', query: 'audio profesional accesorios' },
          { name: 'Amplificadores', query: 'amplificador profesional audio' },
          { name: 'Bocinas Activas', query: 'bocina activa' },
          { name: 'Bocinas Pasivas', query: 'bocina pasiva' },
          { name: 'Consolas Análogas y Digitales', query: 'consola audio' },
          { name: 'Procesadores de Audio', query: 'procesador audio' }
        ]
      },
      {
        title: 'Audio Comercial',
        items: [
          { name: 'Amplificadores 70/100V', query: 'amplificador 70v 100v' },
          { name: 'Bocinas de Plafón', query: 'bocina plafon' },
          { name: 'Bocinas de Columna', query: 'bocina columna' },
          { name: 'Bocinas para Exterior', query: 'bocina intemperie exterior' },
          { name: 'Control de Volumen', query: 'atenuador volumen audio' }
        ]
      },
      {
        title: 'Distribución de Video',
        items: [
          { name: 'AV sobre IP', query: 'av sobre ip video' },
          { name: 'Extensores HDMI / USB / KVM', query: 'extensor hdmi kvm' },
          { name: 'Matrices y Splitters', query: 'matriz hdmi splitter' },
          { name: 'Switches de Video', query: 'switch conmutador hdmi' }
        ]
      },
      {
        title: 'Microfonía & Salas',
        items: [
          { name: 'Sistemas de Conferencia', query: 'conferencia microfono' },
          { name: 'Micrófonos Alámbricos e Inalámbricos', query: 'microfono inalambrico' },
          { name: 'Videoconferencia / Salas Inteligentes', query: 'videoconferencia sala' },
          { name: 'Pantallas y Videowall LED/LCD', query: 'videowall pantalla profesional' }
        ]
      }
    ]
  },
  {
    id: 'videovigilancia',
    name: 'Videovigilancia (CCTV)',
    icon: <Video className="w-4 h-4" />,
    categoryId: '22',
    groups: [
      {
        title: 'Cámaras IP',
        items: [
          { name: 'Cámaras Domo IP', query: 'camara ip domo' },
          { name: 'Cámaras Bala / Bullet IP', query: 'camara ip bala' },
          { name: 'Cámaras PTZ Motorizadas', query: 'camara ptz' },
          { name: 'Cámaras Térmicas y Bi-espectrales', query: 'camara termica' }
        ]
      },
      {
        title: 'Cámaras TurboHD / Análogas',
        items: [
          { name: 'Cámaras Domo TurboHD', query: 'camara domo turbohd' },
          { name: 'Cámaras Bala TurboHD', query: 'camara bala turbohd' },
          { name: 'Kits de Videovigilancia', query: 'kit camaras dvr' },
          { name: 'Cámaras con Disuasión Activa', query: 'camara colorvu disuasion' }
        ]
      },
      {
        title: 'Grabadores (NVR / DVR)',
        items: [
          { name: 'Grabadores NVR IP', query: 'grabador nvr' },
          { name: 'Grabadores DVR / XVR', query: 'grabador dvr xvr' },
          { name: 'Servidores de Almacenamiento', query: 'servidor almacenamiento video' },
          { name: 'Discos Duros Especializados (WD Purple)', query: 'disco duro purz' }
        ]
      },
      {
        title: 'Accesorios y Transmisión',
        items: [
          { name: 'Transceptores Pasivos (Baluns)', query: 'transceptor balun' },
          { name: 'Fuentes de Poder para Cámaras', query: 'fuente poder cctv' },
          { name: 'Gabinete y Montajes para Cámara', query: 'montaje soporte camara' },
          { name: 'Cables Coaxiales y Siameses', query: 'cable siames cctv' }
        ]
      }
    ]
  },
  {
    id: 'redes-it',
    name: 'Redes e IT',
    icon: <Network className="w-4 h-4" />,
    categoryId: '26',
    groups: [
      {
        title: 'Redes Inalámbricas (Wi-Fi)',
        items: [
          { name: 'Access Points Interiores', query: 'access point interior' },
          { name: 'Access Points Exteriores', query: 'access point exterior intemperie' },
          { name: 'Routers Wi-Fi Mesh', query: 'router mesh wifi' },
          { name: 'Controladores de Red', query: 'controlador cloud gateway' }
        ]
      },
      {
        title: 'Enlaces Inalámbricos',
        items: [
          { name: 'Antenas Punto a Punto (PtP)', query: 'antena enlace punto a punto' },
          { name: 'Estaciones Punto Multipunto (PtMP)', query: 'antena base ptmp' },
          { name: 'Radios y Platos de Alta Capacidad', query: 'radio enlace airfiber mimosa' },
          { name: 'Accesorios y Protectores ESD', query: 'protector sobretension ethernet' }
        ]
      },
      {
        title: 'Switches y Routing',
        items: [
          { name: 'Switches PoE / PoE+', query: 'switch poe' },
          { name: 'Switches Administrables L2/L3', query: 'switch administrable' },
          { name: 'Switches Industriales Riel DIN', query: 'switch industrial din' },
          { name: 'Routers Balanceadores de Carga', query: 'router balanceador vpn' }
        ]
      },
      {
        title: 'Fibra Óptica y Servidores',
        items: [
          { name: 'Transceptores SFP / SFP+', query: 'modulo sfp transceptor' },
          { name: 'Convertidores de Medio Fibra', query: 'convertidor medios fibra' },
          { name: 'Bobinas de Fibra Óptica', query: 'bobina fibra optica' },
          { name: 'Servidores y Almacenamiento NAS', query: 'servidor nas synology qnap' }
        ]
      }
    ]
  },
  {
    id: 'control-acceso',
    name: 'Control de Acceso',
    icon: <KeyRound className="w-4 h-4" />,
    categoryId: '37',
    groups: [
      {
        title: 'Biometría y Reconocimiento',
        items: [
          { name: 'Terminales de Reconocimiento Facial', query: 'biometrico facial' },
          { name: 'Lectores de Huella Digital', query: 'biometrico huella' },
          { name: 'Lectores de Venas y Palma', query: 'lector palma' },
          { name: 'Lectores de Código QR y Móvil', query: 'lector codigo qr acceso' }
        ]
      },
      {
        title: 'Control Vehicular',
        items: [
          { name: 'Barreras Vehiculares Automáticas', query: 'barrera vehicular' },
          { name: 'Motores para Puertas Corredizas y Abatibles', query: 'motor puerta automatica' },
          { name: 'Lectores TAG UHF de Largo Alcance', query: 'antena uhf tag vehicular' },
          { name: 'Loops y Detectores de Masa', query: 'detector masa loop' }
        ]
      },
      {
        title: 'Cerraduras y Torniquetes',
        items: [
          { name: 'Electroimanes y Cerraduras Magnéticas', query: 'electroiman cerradura magnetica' },
          { name: 'Contrachapas Eléctricas', query: 'contrachapa electrica' },
          { name: 'Torniquetes y Molinetes Peatonales', query: 'torniquete peaton' },
          { name: 'Botones Liberadores de Salida', query: 'boton liberador no touch' }
        ]
      },
      {
        title: 'Tarjetas y Accesorios',
        items: [
          { name: 'Tarjetas y Tags RFID 125kHz / 13.56MHz', query: 'tarjeta rfid mifare prox' },
          { name: 'Paneles de Control de Acceso', query: 'panel control acceso' },
          { name: 'Fuentes de Poder con Respaldo', query: 'fuente respaldo acceso' }
        ]
      }
    ]
  },
  {
    id: 'cableado-estructurado',
    name: 'Cableado Estructurado',
    icon: <Layers className="w-4 h-4" />,
    categoryId: '65811',
    groups: [
      {
        title: 'Bobinas de Cable',
        items: [
          { name: 'Cable UTP Cat 6 100% Cobre', query: 'bobina cable cat6 cobre' },
          { name: 'Cable UTP Cat 6A / Cat 7', query: 'bobina cable cat6a' },
          { name: 'Cable para Exterior e Intemperie', query: 'cable utp exterior' },
          { name: 'Cable Blindado FTP / STP', query: 'cable blindado stp' }
        ]
      },
      {
        title: 'Racks y Gabinetes',
        items: [
          { name: 'Gabinetes de Pared', query: 'gabinete pared rack' },
          { name: 'Racks de Piso Cerrados', query: 'rack piso cerrado' },
          { name: 'Racks Abiertos de 2 y 4 Postes', query: 'rack abierto postes' },
          { name: 'Bandejas y Organizadores Horizontales', query: 'organizador cables charola' }
        ]
      },
      {
        title: 'Conectividad y Patching',
        items: [
          { name: 'Patch Panels Cat 6 / 6A', query: 'patch panel' },
          { name: 'Patch Cords Certificados', query: 'patch cord cat6' },
          { name: 'Jacks RJ45 Keystone', query: 'jack keystone rj45' },
          { name: 'Faceplates y Placas de Pared', query: 'faceplate placa pared' }
        ]
      },
      {
        title: 'Canalización',
        items: [
          { name: 'Canaletas Plásticas y Ranuradas', query: 'canaleta ranurada' },
          { name: 'Tubería y Conectores Conduit', query: 'conduit tuberia conector' },
          { name: 'Mallas y Charolas Portacables', query: 'charola portacables malla' }
        ]
      }
    ]
  },
  {
    id: 'energia',
    name: 'Energía y Climatización',
    icon: <Sun className="w-4 h-4" />,
    categoryId: '30',
    groups: [
      {
        title: 'Sistemas Solares Fotovoltaicos',
        items: [
          { name: 'Paneles Solares Monocristalinos', query: 'panel solar fotovoltaico' },
          { name: 'Controladores de Carga MPPT', query: 'controlador solar mppt' },
          { name: 'Inversores Solares Off-Grid y On-Grid', query: 'inversor solar' },
          { name: 'Estructuras y Rieles de Montaje', query: 'estructura montaje panel solar' }
        ]
      },
      {
        title: 'Respaldo UPS y Baterías',
        items: [
          { name: 'Sistemas UPS / No-Breaks', query: 'ups no break regulador' },
          { name: 'Baterías de Respaldo AGM / Gel', query: 'bateria agm gel ciclo profundo' },
          { name: 'Baterías de Litio LiFePO4', query: 'bateria litio lifepo4' },
          { name: 'Gabinete para Baterías', query: 'gabinete exterior bateria' }
        ]
      },
      {
        title: 'Protección y Regulación',
        items: [
          { name: 'Supresores de Picos de Voltaje', query: 'supresor picos sobretension' },
          { name: 'Reguladores de Voltaje', query: 'regulador voltaje' },
          { name: 'Plantas Eléctricas y Generadores', query: 'generador planta electrica' }
        ]
      }
    ]
  },
  {
    id: 'alarmas-intrusion',
    name: 'Automatización e Intrusión',
    icon: <Shield className="w-4 h-4" />,
    categoryId: '32',
    groups: [
      {
        title: 'Paneles de Alarma',
        items: [
          { name: 'Paneles de Alarma Inalámbricos', query: 'panel alarma inalambrico ax pro' },
          { name: 'Paneles Híbridos y Cableados', query: 'panel alarma cableado' },
          { name: 'Teclados de Control', query: 'teclado alarma lcd touch' },
          { name: 'Comunicadores IP / 4G LTE', query: 'comunicador 4g alarma' }
        ]
      },
      {
        title: 'Sensores y Detectores',
        items: [
          { name: 'Detectores de Movimiento PIR', query: 'sensor movimiento pir' },
          { name: 'Contactos Magnéticos para Puerta/Ventana', query: 'contacto magnetico alarma' },
          { name: 'Sensores de Ruptura de Cristal', query: 'sensor ruptura cristal' },
          { name: 'Barreras Fotoeléctricas Perimetrales', query: 'barrera fotoelectrica haz' }
        ]
      },
      {
        title: 'Sirenas y Disuasión',
        items: [
          { name: 'Sirenas Estroboscópicas Exteriores', query: 'sirena exterior estrobo' },
          { name: 'Sirenas Vecinales de Alta Potencia', query: 'sirena vecinal 30w 50w' },
          { name: 'Botones de Pánico Inalámbricos', query: 'boton panico inalambrico' }
        ]
      }
    ]
  },
  {
    id: 'radiocomunicacion',
    name: 'Radiocomunicación',
    icon: <Radio className="w-4 h-4" />,
    categoryId: '25',
    groups: [
      {
        title: 'Radios Portátiles (Walkie Talkie)',
        items: [
          { name: 'Radios Digitales DMR', query: 'radio portatil dmr' },
          { name: 'Radios Análogos VHF / UHF', query: 'radio vhf uhf portatil' },
          { name: 'Radios PoC (Push-to-Talk Celular)', query: 'radio poc celular 4g' },
          { name: 'Radios Sumergibles IP67', query: 'radio sumergible ip67' }
        ]
      },
      {
        title: 'Radios Móviles y Repetidores',
        items: [
          { name: 'Radios Móviles para Vehículo', query: 'radio movil vehiculo' },
          { name: 'Repetidores de Radiofrecuencia', query: 'repetidor dmr kenwood icom' },
          { name: 'Fuentes de Poder para Repetidor', query: 'fuente poder radio astron' }
        ]
      },
      {
        title: 'Antenas y Torres',
        items: [
          { name: 'Torres Arriostradas y Tramos', query: 'tramo torre stz' },
          { name: 'Antenas Base y Móviles', query: 'antena base vhf uhf' },
          { name: 'Cables Coaxiales Heliax y Conectores', query: 'cable coaxial rg58 lmr400' }
        ]
      }
    ]
  },
  {
    id: 'fuego',
    name: 'Detección de Fuego',
    icon: <Flame className="w-4 h-4" />,
    categoryId: '38',
    groups: [
      {
        title: 'Paneles y Detectores',
        items: [
          { name: 'Paneles Centrales de Incendio', query: 'panel alarma incendio notifier silent' },
          { name: 'Detectores Fotoeléctricos de Humo', query: 'detector humo fotoelectrico' },
          { name: 'Detectores Térmicos y de Temperatura', query: 'detector termico calor' },
          { name: 'Detectores por Aspiración de Aire (VESDA)', query: 'detector aspiracion vesda' }
        ]
      },
      {
        title: 'Notificación y Accesorios',
        items: [
          { name: 'Estaciones Manuales de Alarma', query: 'estacion manual jaladera incendio' },
          { name: 'Sirenas con Luz Estroboscópica', query: 'luz estroboscopica sirena fuego' },
          { name: 'Módulos de Control y Monitoreo', query: 'modulo monitoreo control incendio' },
          { name: 'Cable FPLP / FPLR Antiflama', query: 'cable fuego fplp fplr' }
        ]
      }
    ]
  },
  {
    id: 'vehicular',
    name: 'GPS y Telemática Vehicular',
    icon: <Car className="w-4 h-4" />,
    categoryId: '65964',
    groups: [
      {
        title: 'Localización y Rastreo',
        items: [
          { name: 'Rastreadores GPS para Flotillas', query: 'gps rastreador flotillas 4g' },
          { name: 'GPS Portátiles con Imán', query: 'gps iman portatil bateria' },
          { name: 'Sensores de Nivel de Combustible', query: 'sensor combustible varilla gps' },
          { name: 'Sensores de Temperatura Bluetooth', query: 'sensor temperatura ble gps' }
        ]
      },
      {
        title: 'Video Vehicular (MDVR)',
        items: [
          { name: 'Grabadores Móviles MDVR 4G/GPS', query: 'mdvr grabador movil vehiculo' },
          { name: 'Cámaras Dashcam con IA / ADAS', query: 'dashcam adas dms inteligencia' },
          { name: 'Cámaras de Reversa y Conteo de Pasajeros', query: 'camara reversa conteo pasajeros' }
        ]
      }
    ]
  },
  {
    id: 'herramientas',
    name: 'Herramientas y Medición',
    icon: <Wrench className="w-4 h-4" />,
    categoryId: '42',
    groups: [
      {
        title: 'Herramientas de Red y Fibra',
        items: [
          { name: 'Ponchadoras y Pinzas Crimpeadoras RJ45', query: 'pinza ponchadora rj45' },
          { name: 'Fusionadoras de Fibra Óptica', query: 'fusionadora fibra optica' },
          { name: 'Cortadoras y Peladoras de Precisión', query: 'cortadora precision fibra' },
          { name: 'Probadores y Certificadores de Cable', query: 'certificador fluke probador red' }
        ]
      },
      {
        title: 'Equipo de Medición Eléctrica',
        items: [
          { name: 'Multímetros y Pinzas Amperimétricas', query: 'multimetro digital gancho amperimetro' },
          { name: 'Medidores de Potencia Óptica (OPM)', query: 'medidor potencia optica vfl' },
          { name: 'Localizadores Visuales de Fallas (VFL)', query: 'localizador visual fallas laser' }
        ]
      }
    ]
  },
  {
    id: 'industria',
    name: 'Industria / BMS / Robots',
    icon: <Cpu className="w-4 h-4" />,
    categoryId: '66630',
    groups: [
      {
        title: 'Automatización y Robots',
        items: [
          { name: 'Robots de Servicio y Entrega', query: 'robot servicio entrega' },
          { name: 'Switches y Fuentes Riel DIN Industriales', query: 'fuente riel din industrial meanwell' },
          { name: 'Convertidores Seriales RS485/RS232 a IP', query: 'convertidor serial rs485 ethernet' },
          { name: 'Sensores y Transmisores Industriales', query: 'sensor industrial transmisor' }
        ]
      }
    ]
  }
];

export function MegaMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(MEGA_MENU_DATA[0].id);
  // En móvil el menú funciona como acordeón: sólo una categoría abierta a la vez.
  const [expandedMobileId, setExpandedMobileId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeCategory = MEGA_MENU_DATA.find(c => c.id === activeCategoryId) || MEGA_MENU_DATA[0];

  const closeMenu = () => {
    setIsOpen(false);
    setExpandedMobileId(null);
  };

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Evitar scroll en el fondo si está abierto en móviles
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setExpandedMobileId(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={menuRef} className="relative">

      {/* BOTÓN DISPARADOR ☰ PRODUCTOS */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Abrir catálogo de productos"
        className={cn(
          "h-10 sm:h-11 px-3.5 sm:px-6 rounded-xl sm:rounded-2xl text-[12px] sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 sm:gap-2.5 transition-all select-none outline-none border shrink-0 shadow-sm",
          isOpen
            ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 ring-2 ring-blue-500/40"
            : "bg-blue-600 hover:bg-blue-500 text-white border-blue-500/80 shadow-md shadow-blue-600/20 hover:scale-[1.02] active:scale-95"
        )}
      >
        <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
        <span>Productos</span>
        <ChevronDown className={cn("w-4 h-4 text-blue-200 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
      </button>

      {/* MODAL / DESPLEGABLE MEGA MENÚ FLOTANTE */}
      {isOpen && (
        <>
          {/* Backdrop Blur oscuro */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={closeMenu}
          />

          {/* Contenedor del Mega Menú:
              — móvil: hoja a pantalla completa con acordeón
              — escritorio (sm+): panel flotante de dos columnas (sin cambios) */}
          <div className="fixed inset-0 sm:inset-auto sm:absolute sm:top-full sm:left-0 sm:mt-3 sm:w-[960px] md:w-[1100px] lg:w-[1240px] sm:max-h-[640px] bg-[#0c101c] text-white border-0 sm:border sm:border-white/15 rounded-none sm:rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in sm:zoom-in-95 duration-150">

            {/* Header del Mega Menú */}
            <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-white/10 bg-[#090d16] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Menu className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-black text-[13px] sm:text-sm uppercase tracking-wider text-white truncate">
                  <span className="sm:hidden">Catálogo de Productos</span>
                  <span className="hidden sm:inline">Catálogo Mayorista de Productos</span>
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/?category=all"
                  onClick={closeMenu}
                  className="hidden sm:flex text-xs font-bold text-blue-400 hover:text-blue-300 items-center gap-1 transition-colors"
                >
                  <span>Ver todo el catálogo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={closeMenu}
                  aria-label="Cerrar catálogo"
                  className="p-2 -mr-1 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* ══════════ VISTA MÓVIL: ACORDEÓN VERTICAL A PANTALLA COMPLETA ══════════ */}
            <div className="sm:hidden flex-1 overflow-y-auto overscroll-contain divide-y divide-white/5 pb-safe">
              <Link
                href="/?category=all"
                onClick={closeMenu}
                className="flex items-center justify-between gap-2 px-4 py-3.5 bg-blue-600/15 text-blue-300 font-black text-xs uppercase tracking-wider active:bg-blue-600/25"
              >
                <span>Ver todo el catálogo</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>

              {MEGA_MENU_DATA.map((cat) => {
                const isExpanded = expandedMobileId === cat.id;
                return (
                  <div key={cat.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedMobileId(isExpanded ? null : cat.id)}
                      aria-expanded={isExpanded}
                      className={cn(
                        "w-full px-4 py-4 flex items-center justify-between gap-3 text-left transition-colors",
                        isExpanded ? "bg-white/5 text-white" : "text-zinc-300 active:bg-white/5"
                      )}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className={cn("shrink-0", isExpanded ? "text-blue-400" : "text-zinc-500")}>
                          {cat.icon}
                        </span>
                        <span className="text-[13px] font-bold truncate">{cat.name}</span>
                      </span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 shrink-0 transition-transform duration-200",
                          isExpanded ? "rotate-180 text-blue-400" : "text-zinc-600"
                        )}
                      />
                    </button>

                    {isExpanded && (
                      <div className="bg-[#080b14] px-4 pt-1 pb-5 space-y-5 animate-in fade-in slide-in-from-top-1 duration-150">
                        {cat.categoryId && (
                          <Link
                            href={`/?category=${cat.categoryId}`}
                            onClick={closeMenu}
                            className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-blue-400 active:bg-white/10"
                          >
                            <span>Ver toda la categoría</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </Link>
                        )}

                        {cat.groups.map((group, gIdx) => (
                          <div key={gIdx} className="space-y-1">
                            <h4 className="text-[11px] font-black uppercase tracking-wider text-white/90 border-b border-white/10 pb-1.5 mb-1">
                              {group.title}
                            </h4>
                            <ul>
                              {group.items.map((item, iIdx) => {
                                const href = item.categoryId
                                  ? `/?category=${item.categoryId}`
                                  : `/?search=${encodeURIComponent(item.query || item.name)}`;

                                return (
                                  <li key={iIdx}>
                                    <Link
                                      href={href}
                                      onClick={closeMenu}
                                      className="flex items-center justify-between gap-2 py-2.5 text-[13px] text-zinc-400 active:text-blue-400 transition-colors"
                                    >
                                      <span>{item.name}</span>
                                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-zinc-700" />
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ══════════ VISTA ESCRITORIO: DOS COLUMNAS ══════════ */}
            <div className="hidden sm:flex flex-1 overflow-hidden">

              {/* 1. COLUMNA LATERAL IZQUIERDA: CATEGORÍAS PRINCIPALES */}
              <div className="w-[240px] sm:w-[280px] bg-[#080b14] border-r border-white/10 overflow-y-auto py-2 shrink-0">
                {MEGA_MENU_DATA.map((cat) => {
                  const isActive = cat.id === activeCategoryId;
                  return (
                    <button
                      key={cat.id}
                      onMouseEnter={() => setActiveCategoryId(cat.id)}
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={cn(
                        "w-full px-4 py-2.5 flex items-center justify-between text-left text-xs font-bold transition-all group",
                        isActive
                          ? "bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 font-black pl-3"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={cn("shrink-0 transition-colors", isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300")}>
                          {cat.icon}
                        </span>
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 opacity-40 transition-transform", isActive && "opacity-100 translate-x-0.5 text-blue-400")} />
                    </button>
                  );
                })}
              </div>

              {/* 2. PANEL DERECHO: SUBCATEGORÍAS EN GRID MULTI-COLUMNA (IDÉNTICO A LA CAPTURA) */}
              <div className="flex-1 p-6 sm:p-8 bg-[#0c101c] overflow-y-auto">

                {/* Título de la Categoría Activa */}
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
                      {activeCategory.icon}
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-white">{activeCategory.name}</h3>
                      <p className="text-xs text-zinc-400">Explora las líneas y familias de producto disponibles</p>
                    </div>
                  </div>
                  {activeCategory.categoryId && (
                    <Link
                      href={`/?category=${activeCategory.categoryId}`}
                      onClick={closeMenu}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Ver toda la categoría</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {/* Subcategorías organizadas en columnas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {activeCategory.groups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-2.5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/10 pb-1.5">
                        {group.title}
                      </h4>
                      <ul className="space-y-1.5">
                        {group.items.map((item, iIdx) => {
                          const href = item.categoryId
                            ? `/?category=${item.categoryId}`
                            : `/?search=${encodeURIComponent(item.query || item.name)}`;

                          return (
                            <li key={iIdx}>
                              <Link
                                href={href}
                                onClick={closeMenu}
                                className="text-xs text-zinc-400 hover:text-blue-400 transition-colors block py-0.5 hover:translate-x-1 duration-150"
                              >
                                {item.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>

              </div>

            </div>

            {/* Footer Informativo del Mega Menú */}
            <div className="hidden sm:flex px-6 py-2.5 bg-[#080b14] border-t border-white/10 items-center justify-between text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>¿Buscas un modelo específico? Escríbelo directamente en el buscador superior.</span>
              </div>
              <span className="font-bold text-zinc-300">Catálogo Oficial Syscom México</span>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
