// Contenido de los servicios de Borarly (una sola fuente para home, /services y cada página).

export type ServiceIconKey = 'web' | 'chatbots' | 'value-projects' | 'support';

export interface ServiceItem {
  title: string;
  text: string;
  icon?: string;
}
export interface ServiceFaq { q: string; a: string }
export interface ServicePlan { name: string; forWho: string; features: string[]; highlight?: boolean; waMessage: string }

export interface BorarlyService {
  slug: ServiceIconKey;
  href: string;
  number: string;
  shortLabel: string;    // etiqueta corta para pestañas de navegación
  name: string;          // nombre corto (tarjetas, breadcrumb)
  tagline: string;       // línea corta bajo el nombre
  cardText: string;      // texto de la tarjeta en home
  cardBullets: string[];
  heroTitle: string;
  heroText: string;
  heroFacts: { value: string; label: string }[];
  deliverablesTitle: string;
  deliverables: string[];
  includesTitle: string;
  includes: ServiceItem[];
  steps: ServiceItem[];
  idealFor: string[];
  plans?: ServicePlan[];
  faqs: ServiceFaq[];
  waMessage: string;
  metaTitle: string;
  metaDescription: string;
}

export const WHATSAPP_NUMBER = '5219999040931';
export const waLink = (msg: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

export const SERVICES: BorarlyService[] = [
  {
    slug: 'web',
    href: '/services/web',
    number: '01',
    shortLabel: 'Tiendas y Sitios Web',
    name: 'Tiendas en línea y sitios web',
    tagline: 'Desarrollo web y comercio electrónico',
    cardText: 'Diseñamos y programamos tu tienda en línea o sitio web empresarial, listo para vender, cobrar y administrar tus pedidos desde cualquier dispositivo.',
    cardBullets: ['Catálogo de productos e inventario', 'Pagos con tarjeta, SPEI y OXXO', 'Diseño rápido y adaptado a celular'],
    heroTitle: 'Tu tienda en línea o sitio web, listo para vender',
    heroText: 'Desarrollamos tiendas en línea y páginas empresariales a la medida de tu negocio. Administra tu catálogo, recibe pagos seguros y atiende pedidos desde un panel sencillo y rápido.',
    heroFacts: [
      { value: '24/7', label: 'tu negocio vendiendo en línea' },
      { value: 'CFDI 4.0', label: 'facturación y cobros integrados' },
      { value: '100%', label: 'adaptado a celular y computadora' },
    ],
    deliverablesTitle: 'Entregables de tu proyecto web',
    deliverables: [
      'Tienda o sitio publicado en tu propio dominio (.com o .com.mx) con certificado SSL activo',
      'Panel de administración para subir productos, cambiar precios, ver pedidos y clientes',
      'Pasarela de cobro configurada (Tarjeta, PayPal, transferencia SPEI y efectivo en OXXO)',
      'Notificaciones automáticas por correo en cada venta nueva',
      'Capacitación en vivo para ti y tu equipo + garantía técnica post-lanzamiento',
    ],
    includesTitle: 'Qué incluye tu plataforma',
    includes: [
      { icon: 'package', title: 'Catálogo e inventario', text: 'Sube tus productos con fotos, variantes, precios y existencias, o cárgalos de forma masiva desde Excel o tu sistema.' },
      { icon: 'percent', title: 'Precios y promociones', text: 'Configura precios de menudeo o mayoreo, descuentos, cupones y reglas de envío fácilmente.' },
      { icon: 'credit-card', title: 'Pagos seguros', text: 'Cobros con tarjeta de crédito y débito, PayPal, transferencia SPEI y pago en efectivo en OXXO.' },
      { icon: 'layout', title: 'Panel de administración', text: 'Controla pedidos, clientes, inventario, banners y productos destacados desde un solo lugar.' },
      { icon: 'bell', title: 'Avisos de venta al instante', text: 'Cada compra te llega directo a tu correo con los datos del cliente, productos y dirección de envío.' },
      { icon: 'search', title: 'Listo para Google y celular', text: 'Páginas rápidas, seguras (SSL) y optimizadas para buscadores y teléfonos desde el primer día.' },
    ],
    steps: [
      { title: 'Llamada inicial', text: 'Platicamos qué vendes, a quién te diriges y cómo operas hoy.' },
      { title: 'Propuesta clara', text: 'Te entregamos alcance, tiempos de entrega y costo fijo por escrito.' },
      { title: 'Diseño y desarrollo', text: 'Construimos tu tienda o sitio con la imagen de tu marca y lo revisas antes de salir.' },
      { title: 'Lanzamiento', text: 'Publicamos en tu dominio, te capacitamos para usar el panel y te damos soporte.' },
    ],
    idealFor: [
      'Comercios y distribuidoras que quieren vender en todo México',
      'Negocios que venden por WhatsApp o redes y buscan automatizar pedidos',
      'Empresas que necesitan renovar su sitio web o catálogo digital',
    ],
    faqs: [
      { q: '¿Puedo administrar mis productos yo mismo?', a: 'Sí. Te entregamos un panel muy fácil de usar para agregar o editar productos, cambiar precios, subir fotos y revisar tus ventas, o cargar catálogos desde Excel.' },
      { q: '¿Se puede conectar con mi sistema o proveedor?', a: 'Sí. Si manejas un ERP, inventario externo o proveedor con API, podemos cotizar la sincronización automática de stock y precios.' },
      { q: '¿Cuánto tiempo tarda en estar lista?', a: 'Un sitio web o tienda en línea estándar queda lista entre 2 y 4 semanas, dependiendo de las funciones que necesites.' },
    ],
    waMessage: 'Hola, me interesa cotizar una tienda en línea o sitio web para mi negocio.',
    metaTitle: 'Desarrollo de tiendas en línea y sitios web | Borarly',
    metaDescription: 'Creamos tiendas en línea y sitios web a la medida de tu negocio: catálogo administrable, pagos con tarjeta, SPEI y OXXO, panel de pedidos y diseño optimizado para celular.',
  },
  {
    slug: 'chatbots',
    href: '/services/chatbots',
    number: '02',
    shortLabel: 'Asistente WhatsApp IA',
    name: 'Asistente de ventas por WhatsApp',
    tagline: 'Chatbots y atención automática 24/7',
    cardText: 'Un asistente que contesta a tus clientes por WhatsApp y tu página, cotiza con tu catálogo y te pasa los prospectos listos.',
    cardBullets: ['WhatsApp, Telegram y chat web', 'Cotiza con tus precios en segundos', 'Transfiere a un asesor cuando hace falta'],
    heroTitle: 'Un asistente que atiende y cotiza cuando tú no puedes',
    heroText: 'Responde dudas, consulta existencias, arma cotizaciones con tu catálogo y te avisa cuando hay un cliente listo para comprar. Funciona día y noche en tu WhatsApp Business y en tu página.',
    heroFacts: [
      { value: '< 5 seg', label: 'tiempo de respuesta promedio' },
      { value: 'WhatsApp', label: 'Telegram y chat en tu web' },
      { value: '24/7', label: 'atención sin interrupciones' },
    ],
    deliverablesTitle: 'Lo que dejamos funcionando en tu negocio',
    deliverables: [
      'Asistente conectado a tu número de WhatsApp Business, Telegram o burbuja en tu sitio web',
      'Entrenamiento con tu catálogo de productos, lista de precios, ubicación y políticas de venta',
      'Reglas para capturar datos del cliente (nombre, teléfono, empresa y pedido) y avisarte al instante',
      'Transferencia limpia a un vendedor humano cuando el cliente pide atención personal',
      'Hospedaje, mantenimiento y ajustes mensuales incluidos sin que administres servidores',
    ],
    includesTitle: 'Qué hace tu asistente por ti',
    includes: [
      { icon: 'message', title: 'Contesta preguntas al instante', text: 'Horarios, envíos, formas de pago, garantías y especificaciones de tus productos o servicios.' },
      { icon: 'file-text', title: 'Cotiza en el momento', text: 'Consulta tu catálogo actualizado con precios y existencias y envía la cotización en el chat.' },
      { icon: 'users', title: 'Califica y captura prospectos', text: 'Pide nombre, contacto y lo que necesita el cliente, y te manda el resumen listo para cerrar.' },
      { icon: 'phone-forwarded', title: 'Pasa la conversación a tu equipo', text: 'Cuando el cliente lo pide o es un proyecto especial, transfiere el chat a un asesor.' },
      { icon: 'book-open', title: 'Entrenado con tus reglas', text: 'Responde únicamente con la información oficial de tu negocio y con el tono de tu marca.' },
      { icon: 'shield', title: 'Nosotros lo mantenemos', text: 'Servidores, seguridad, respaldos y mejoras corren por cuenta de Borarly.' },
    ],
    steps: [
      { title: 'Demostración en vivo', text: 'Te mostramos el asistente respondiendo y cotizando en tiempo real.' },
      { title: 'Carga de información', text: 'Entrenamos al asistente con tu catálogo, precios, políticas y preguntas frecuentes.' },
      { title: 'Conexión a tus canales', text: 'Lo vinculamos a tu WhatsApp Business, Telegram o página web.' },
      { title: 'Afinación continua', text: 'Revisamos conversaciones reales contigo y ajustamos respuestas.' },
    ],
    idealFor: [
      'Negocios que reciben decenas de mensajes diarios por WhatsApp',
      'Comercios que pierden ventas por tardar en responder o fuera de horario',
      'Equipos de ventas que quieren recibir prospectos ya filtrados y cotizados',
    ],
    plans: [
      {
        name: 'Chat para Sitio Web',
        forWho: 'Para atender visitantes y capturar prospectos en tu página.',
        features: [
          'Burbuja de chat con los colores y logo de tu marca',
          'Entrenado con la información y servicios de tu empresa',
          'Captura de datos de contacto y envío a tu correo/WhatsApp',
          'Hospedaje y mantenimiento incluidos',
        ],
        waMessage: 'Hola, me interesa el asistente de chat para mi página web.',
      },
      {
        name: 'WhatsApp Ventas & Cotizador',
        forWho: 'Para cotizar productos y atender clientes 24/7 por WhatsApp.',
        features: [
          'Conexión directa a tu WhatsApp Business o Telegram',
          'Consulta de catálogo, precios y existencias en vivo',
          'Generación de cotizaciones automáticas en el chat',
          'Aviso inmediato cuando un cliente está listo para comprar',
          'Soporte y ajustes prioritarios',
        ],
        highlight: true,
        waMessage: 'Hola, me interesa el asistente de ventas por WhatsApp con cotizador.',
      },
      {
        name: 'Empresarial a la Medida',
        forWho: 'Para empresas con ERP, CRM o varios departamentos.',
        features: [
          'Atención simultánea en WhatsApp, Web y redes',
          'Integración por API con tu ERP, CRM o inventario',
          'Consulta de estatus de pedidos y facturación',
          'Ingeniero de cuenta asignado',
        ],
        waMessage: 'Hola, necesito una propuesta de asistente con IA a la medida para mi empresa.',
      },
    ],
    faqs: [
      { q: '¿Necesito saber de programación o tener servidores?', a: 'No. Nuestro equipo configura todo y lo mantiene operando; tú solo nos compartes la información de tu negocio y tu catálogo.' },
      { q: '¿Qué pasa si un cliente pregunta algo muy específico?', a: 'El asistente solo responde con información autorizada de tu negocio. Si el caso requiere criterio humano, avisa a tu asesor y transfiere la conversación.' },
      { q: '¿Sigo pudiendo usar mi WhatsApp normalmente?', a: 'Sí. Puedes ver las conversaciones e intervenir desde tu celular o computadora en cualquier momento.' },
    ],
    waMessage: 'Hola, me interesa un asistente de ventas por WhatsApp para mi negocio.',
    metaTitle: 'Asistente de ventas por WhatsApp 24/7 | Borarly',
    metaDescription: 'Asistente inteligente que atiende a tus clientes por WhatsApp y tu página web, cotiza con tu catálogo y captura prospectos las 24 horas.',
  },
  {
    slug: 'value-projects',
    href: '/services/value-projects',
    number: '03',
    shortLabel: 'Ingeniería de Proyectos',
    name: 'Ingeniería de proyectos',
    tagline: 'Diseño, cálculo y listas de materiales',
    cardText: 'Te apoyamos a dimensionar y cotizar proyectos de videovigilancia, redes, enlaces inalámbricos y energía solar, desde el plano hasta el material.',
    cardBullets: ['Diseño de CCTV, redes y acceso', 'Estudios de enlaces inalámbricos', 'Listas de materiales y licitaciones'],
    heroTitle: 'Proyectos de seguridad, redes y energía bien calculados',
    heroText: 'Nuestros ingenieros te respaldan para dimensionar tu proyecto, seleccionar los equipos compatibles y armar la propuesta técnica y económica con precios especiales de volumen.',
    heroFacts: [
      { value: 'Planos', label: 'sembrado y memorias técnicas' },
      { value: 'BOM', label: 'lista de materiales completa' },
      { value: 'Mayoreo', label: 'precios especiales por proyecto' },
    ],
    deliverablesTitle: 'Qué te entregamos para ganar tu proyecto',
    deliverables: [
      'Revisión de planos o levantamiento para ubicar cámaras, antenas, switches y puntos de acceso',
      'Lista de materiales (BOM) revisada al 100%: sin piezas faltantes ni equipos incompatibles',
      'Cálculo de almacenamiento de video, ancho de banda, respaldos de energía (UPS) o generación solar',
      'Estudios de línea de vista y cobertura para enlaces inalámbricos punto a punto y multipunto',
      'Fichas técnicas en español y cartas de respaldo para licitaciones públicas o privadas',
    ],
    includesTitle: 'Especialidades en las que te apoyamos',
    includes: [
      { icon: 'camera', title: 'Videovigilancia (CCTV)', text: 'Ubicación de cámaras IP/analógicas, analíticas de video, cálculo de días de grabación y monitoreo.' },
      { icon: 'network', title: 'Redes y cableado estructurado', text: 'Diseño de red empresarial, switches PoE, fibra óptica, racks, Wi-Fi de alta densidad y ruteo.' },
      { icon: 'radio', title: 'Enlaces inalámbricos (RF)', text: 'Estudios de línea de vista, perfil de elevación y cálculo de enlaces de larga distancia.' },
      { icon: 'sun', title: 'Energía solar y respaldo', text: 'Dimensionamiento de sistemas fotovoltaicos, bancos de baterías e inversores para sitios remotos.' },
      { icon: 'lock', title: 'Control de acceso e intrusión', text: 'Biométricos, torniquetes, barreras vehiculares, cercas electrificadas y paneles de alarma.' },
      { icon: 'file-check', title: 'Carpetas para licitaciones', text: 'Especificaciones técnicas, comparativas de equipos y precios protegidos por proyecto.' },
    ],
    steps: [
      { title: 'Planteamiento', text: 'Nos compartes tu plano, requerimiento del cliente o bases de licitación.' },
      { title: 'Ingeniería y diseño', text: 'Calculamos la solución óptima y validamos compatibilidad pieza por pieza.' },
      { title: 'Cotización de proyecto', text: 'Recibes la lista de materiales completa con precio preferencial de mayoreo.' },
      { title: 'Suministro y apoyo', text: 'Coordinamos la entrega del equipo y te acompañamos en la puesta en marcha.' },
    ],
    idealFor: [
      'Integradores e instaladores que cotizan proyectos medianos y grandes',
      'Empresas que participan en licitaciones de gobierno o sector privado',
      'Corporativos, bodegas, hoteles y fraccionamientos que planean su infraestructura',
    ],
    faqs: [
      { q: '¿El diseño e ingeniería tiene costo?', a: 'Cuando suministramos el equipamiento del proyecto con Borarly, la ingeniería de preventa y el armado de la lista de materiales van incluidos sin costo.' },
      { q: '¿Hacen envíos de proyectos a toda la República?', a: 'Sí. Despachamos desde más de 14 almacenes en el país directo a tu obra o tus oficinas con envío asegurado.' },
      { q: '¿Respetan precios especiales por volumen?', a: 'Sí. Registramos tu proyecto para darte descuentos por volumen y proteger tu cotización.' },
    ],
    waMessage: 'Hola, necesito apoyo de ingeniería para cotizar un proyecto.',
    metaTitle: 'Ingeniería de proyectos de CCTV, redes y energía solar | Borarly',
    metaDescription: 'Diseño, cálculo y listas de materiales (BOM) para proyectos de videovigilancia, redes, enlaces inalámbricos, control de acceso y energía solar en México.',
  },
  {
    slug: 'support',
    href: '/services/support',
    number: '04',
    shortLabel: 'Soporte Técnico',
    name: 'Soporte técnico y garantías',
    tagline: 'Ingenieros en vivo, configuración y RMA',
    cardText: 'Atención directa de ingenieros para configurar tus equipos, diagnosticar fallas en campo y tramitar garantías oficiales con el fabricante.',
    cardBullets: ['Atención por WhatsApp y teléfono', 'Sesiones de configuración remota', 'Trámite ágil de garantías (RMA)'],
    heroTitle: 'Soporte directo con ingenieros, sin robots ni filas de espera',
    heroText: 'Te acompañamos antes, durante y después de tu instalación. Si tienes una duda en campo o un equipo requiere configuración o garantía, hablas directo con nuestro equipo técnico.',
    heroFacts: [
      { value: 'Directo', label: 'trato con ingenieros de soporte' },
      { value: 'Remoto', label: 'asistencia por AnyDesk / teléfono' },
      { value: '100%', label: 'garantía oficial de fabricante' },
    ],
    deliverablesTitle: 'Cobertura de nuestro centro de soporte',
    deliverables: [
      'Asesoría previa a la compra para confirmar que todas las piezas de tu pedido sean compatibles',
      'Guía por WhatsApp o llamada mientras estás instalando en el sitio del cliente',
      'Conexión remota programada para configurar NVR/DVR, VLANs, enlaces, VMS o control de acceso',
      'Acceso a firmwares oficiales, herramientas de fabricante, diagramas de conexión y manuales',
      'Recepción, diagnóstico en laboratorio y trámite directo de garantías (RMA) con la marca',
    ],
    includesTitle: 'Cómo te respaldamos en cada compra',
    includes: [
      { icon: 'compass', title: 'Asesoría antes de comprar', text: 'Validamos modelos, fuentes de poder, accesorios y licencias antes de que hagas tu pedido.' },
      { icon: 'monitor', title: 'Configuración remota', text: 'Nos conectamos a tu equipo para apoyar en la puesta a punto de grabadores, redes y radios.' },
      { icon: 'wrench', title: 'Diagnóstico paso a paso', text: 'Te ayudamos a aislar fallas físicas, de red o de configuración para resolver rápido en sitio.' },
      { icon: 'shield-check', title: 'Gestión de garantías (RMA)', text: 'Tramitamos garantías de equipos adquiridos en Borarly directamente con los centros autorizados.' },
      { icon: 'download', title: 'Firmware y documentación', text: 'Te compartimos las versiones estables de firmware, software de gestión y guías rápidas.' },
      { icon: 'graduation-cap', title: 'Capacitación técnica', text: 'Orientamos a tu personal técnico en las marcas y soluciones que comercializamos.' },
    ],
    steps: [
      { title: 'Contáctanos', text: 'Escríbenos por WhatsApp con tu número de pedido o el modelo del equipo.' },
      { title: 'Revisión técnica', text: 'Un ingeniero toma tu caso al momento y revisa la configuración o el síntoma.' },
      { title: 'Resolución remota', text: 'Te guiamos por llamada o nos conectamos por escritorio remoto para dejarlo operando.' },
      { title: 'Garantía si aplica', text: 'Si el equipo presenta defecto de fábrica, iniciamos tu folio de garantía y le damos seguimiento.' },
    ],
    idealFor: [
      'Instaladores y técnicos que necesitan respaldo rápido estando en obra',
      'Clientes que compraron su equipamiento en Borarly y requieren ayuda al configurar',
      'Empresas que buscan un proveedor que sí responda después de la venta',
    ],
    faqs: [
      { q: '¿El soporte técnico tiene costo?', a: 'Para todos los equipos comprados en Borarly, la asesoría técnica y el apoyo en configuración básica son totalmente gratuitos.' },
      { q: '¿Qué necesito para tramitar una garantía?', a: 'Solo tu número de pedido o factura de Borarly, el número de serie del equipo y una breve descripción de la falla para abrir tu folio RMA.' },
      { q: '¿También dan pólizas para empresas?', a: 'Sí. Si requieres soporte dedicado o mantenimiento preventivo para infraestructura existente, te cotizamos una póliza a medida.' },
    ],
    waMessage: 'Hola, necesito apoyo de soporte técnico con un equipo.',
    metaTitle: 'Soporte técnico e ingeniería post-venta | Borarly',
    metaDescription: 'Soporte técnico directo con ingenieros para configurar cámaras, NVR, DVR, switches, enlaces y control de acceso, más trámite de garantías oficiales.',
  },
];

export const getService = (slug: ServiceIconKey) => SERVICES.find((s) => s.slug === slug)!;
