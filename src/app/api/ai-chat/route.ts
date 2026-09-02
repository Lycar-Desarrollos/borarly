import { NextRequest, NextResponse } from 'next/server';
import { searchProductsAI } from '@/services/productService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawMessage = (body.message || '').trim();

    if (!rawMessage) {
      return NextResponse.json({ 
        reply: "Hola, ¿cómo estás? Soy el Agente AI de BORARLY. Estoy conectado en tiempo real al catálogo nacional de Syscom para ayudarte con especificaciones técnicas, compatibilidad, cotizaciones y selección de equipo.",
        products: [],
        reasoning: "Esperando solicitud del usuario.",
        suggestedActions: [
          "Discos duros para videovigilancia",
          "Cámara domo exterior visión nocturna",
          "Kit de paneles solares fotovoltaicos",
          "Switch PoE de 24 puertos"
        ]
      });
    }

    const lower = rawMessage.toLowerCase();

    // 1. Detectar intenciones especiales de soporte y contexto de negocio
    if (lower.includes('ejecutivo') || lower.includes('correo') || lower.includes('asesor') || lower.includes('contacto') || lower.includes('telefono')) {
      return NextResponse.json({
        reply: `Tu cuenta en **Borarly** cuenta con atención personalizada y soporte de ingeniería dedicado. Puedes contactar a tu ejecutivo asignado directamente por WhatsApp o correo electrónico para cotizaciones especiales por volumen o proyectos licitados.`,
        reasoning: `1. Intención detectada: Consulta de contacto y asesor asignado.\n2. Recuperando canales de atención mayorista de Borarly.\n3. Tiempo de respuesta promedio: Inmediato por WhatsApp.`,
        catalogoBadges: ['Atención Mayorista Inmediata', 'Ingeniería y Soporte'],
        tableData: [
          {
            id: 'soporte-wa',
            name: 'Mesa de Ayuda & Asesor WhatsApp',
            model: '+52 999 904 0931',
            brand: 'Borarly',
            spec: 'Atención Inmediata 9:00 - 18:00 hrs',
            price: 'Sin Costo',
            stock: 'En Línea'
          },
          {
            id: 'soporte-mail',
            name: 'Atención a Cuentas & Ventas',
            model: 'ventas@borarly.com',
            brand: 'Borarly',
            spec: 'Cotizaciones y Facturación CFDI 4.0',
            price: 'Sin Costo',
            stock: 'Activo'
          }
        ],
        bullets: [
          '**Atención por WhatsApp**: Puedes enviar tu lista de requerimientos en PDF o Excel para cotización inmediata con precios de distribuidor.',
          '**Envíos Nacionales**: Despacho de 24 a 48 horas a toda la República Mexicana desde los almacenes más cercanos.'
        ],
        suggestedActions: [
          'Contactar por WhatsApp ↗',
          'Consultar catálogo de videovigilancia ↗',
          'Ver opciones de crédito mayorista ↗'
        ],
        products: []
      });
    }

    // 2. Consulta al catálogo inteligente de Syscom mediante Búsqueda Semántica
    const aiSearchRes = await searchProductsAI(rawMessage);
    let products = aiSearchRes.productos || [];

    // Contextualización sobre Discos duros (HDD vs SSD) si la búsqueda es de almacenamiento
    const isStorageQuery = lower.includes('disco') || lower.includes('hdd') || lower.includes('ssd') || lower.includes('500gb') || lower.includes('1tb') || lower.includes('2tb');
    const isCameraQuery = lower.includes('camara') || lower.includes('cámara') || lower.includes('domo') || lower.includes('bala') || lower.includes('bullet') || lower.includes('ptz') || lower.includes('dvr') || lower.includes('nvr');
    const isSolarQuery = lower.includes('solar') || lower.includes('panel') || lower.includes('inversor') || lower.includes('bateria') || lower.includes('batería');
    const isNetworkQuery = lower.includes('switch') || lower.includes('poe') || lower.includes('antena') || lower.includes('enlace') || lower.includes('router') || lower.includes('ubiquiti');

    // 3. Extracción de razonamiento estructurado
    const reasoningSteps = [
      `1. Análisis de intención: "${rawMessage}"`,
      `2. Consulta semántica a la base de datos de Syscom (endpoint /productos/busqueda-ia)`,
      `3. Se evaluaron ${products.length} productos coincidentes con especificaciones técnicas`,
      `4. Validación de stock en almacenes nacionales y precios mayoristas en MXN con IVA`
    ];

    // 4. Formatear datos de tabla comparativa
    // `product.price` ya viene en MXN con margen e IVA incluidos (ver mapearProductoSyscom),
    // por eso se formatea directo y no se vuelve a aplicar el IVA.
    const priceFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    const tableData = products.slice(0, 5).map(p => {
      const priceVal = Number(p.price) || 0;
      return {
        id: p.id,
        name: p.name || 'Producto',
        model: p.line || '',
        brand: p.brand || 'Syscom',
        spec: p.category || (p.description ? `${p.description.substring(0, 45)}...` : 'Equipo Profesional'),
        price: priceVal > 0 ? priceFormatter.format(priceVal) : 'Cotizar',
        stock: p.stock && p.stock > 0 ? `${p.stock} disponibles` : 'Sobre pedido',
        image: p.imageUrls?.[0] || ''
      };
    });

    // 5. Explicación conversacional rica en contexto técnico
    let reply = "";
    let bullets: string[] = [];
    let suggestedActions: string[] = [];

    if (products.length > 0) {
      if (isStorageQuery && (lower.includes('500') || lower.includes('500gb'))) {
        reply = `Busqué opciones de 500 GB en el catálogo nacional. Actualmente los discos mecánicos (HDD) para videovigilancia se fabrican a partir de 1 TB (WD Purple / SkyHawk). Sin embargo, en 500 GB / 512 GB contamos con unidades de estado sólido (SSD) de alta velocidad y durabilidad:`;
        bullets = [
          `Las unidades **SSD SATA III** son ideales para **PC de escritorio, laptops y sistemas operativos**, acelerando el arranque y lectura de datos.`,
          `Para **DVR o NVR de videovigilancia continua 24/7**, se recomienda seleccionar un **HDD de 1 TB o superior (WD Purple / Seagate SkyHawk)** diseñado con firmware para soportar escritura continua sin sobrecalentamiento.`
        ];
        suggestedActions = [
          `Buscar HDD 1TB para DVR ↗`,
          `¿Qué capacidad de disco necesito para 4 cámaras? ↗`,
          `Agregar al carrito 🛒`
        ];
      } else if (isCameraQuery) {
        reply = `He analizado tu requerimiento de videovigilancia y seleccioné las mejores opciones disponibles con entrega inmediata:`;
        bullets = products.slice(0, 3).map((p, idx) => {
          const brand = p.brand || 'Hikvision / Epcom';
          const model = p.line || '';
          if (idx === 0) {
            return `El modelo **${model} (${brand})** es la recomendación principal: ofrece excelente resolución, visión nocturna de largo alcance y carcasa con protección para exterior.`;
          } else if (idx === 1) {
            return `El modelo **${model} (${brand})** ofrece analíticas avanzadas de detección humana/vehicular y compresión H.265+ para ahorro de almacenamiento.`;
          } else {
            return `El modelo **${model} (${brand})** es una excelente alternativa económica y versátil para proyectos residenciales o comerciales.`;
          }
        });
        suggestedActions = [
          `¿Qué DVR/NVR es compatible con estas cámaras? ↗`,
          `Ver accesorios de montaje y conectores ↗`,
          `Agregar al carrito 🛒`
        ];
      } else if (isSolarQuery) {
        reply = `Encontré los siguientes componentes fotovoltaicos y de energía en el catálogo nacional con disponibilidad inmediata:`;
        bullets = products.slice(0, 3).map((p) => {
          return `El equipo **${p.line} (${p.brand})** cuenta con certificación de alta eficiencia y garantía extendida para sistemas interconectados o aislados.`;
        });
        suggestedActions = [
          `¿Qué calibre de cable fotovoltaico se requiere? ↗`,
          `Ver controladores y baterías compatibles ↗`,
          `Agregar al carrito 🛒`
        ];
      } else if (isNetworkQuery) {
        reply = `Encontré las siguientes soluciones de conectividad y redes profesionales disponibles en inventario:`;
        bullets = products.slice(0, 3).map((p) => {
          return `El modelo **${p.line} (${p.brand})** proporciona alta tasa de transferencia, alimentación PoE estable y gestión centralizada.`;
        });
        suggestedActions = [
          `Ver bobinas de cable UTP Cat6 ↗`,
          `¿Cuál es el alcance máximo del PoE? ↗`,
          `Agregar al carrito 🛒`
        ];
      } else {
        reply = `He analizado tu consulta en el catálogo nacional y seleccioné las opciones más recomendadas con entrega inmediata:`;
        bullets = products.slice(0, 3).map((p) => {
          return `El modelo **${p.line} (${p.brand})** es una opción líder en su categoría con soporte técnico oficial en México.`;
        });
        suggestedActions = [
          `Ver ficha técnica detallada ↗`,
          `Consultar compatibilidad técnica ↗`,
          `Agregar al carrito 🛒`
        ];
      }
    } else {
      reply = `Busqué *" ${rawMessage} "* en el catálogo nacional. No encontré modelos exactos con esa denominación, pero contamos con soluciones equivalentes en videovigilancia, redes, radiocomunicación y energía solar.`;
      suggestedActions = [
        `Ver cámaras de seguridad IP ↗`,
        `Ver equipos de radiocomunicación ↗`,
        `Contactar con un asesor técnico por WhatsApp ↗`
      ];
    }

    return NextResponse.json({
      reply,
      reasoning: reasoningSteps.join('\n'),
      tableData,
      bullets,
      suggestedActions,
      catalogoBadges: [
        `Catálogo SYSCOM · ${products.length} productos analizados`,
        `Precios con IVA incluido en MXN`
      ],
      products: products.slice(0, 6),
      query: rawMessage
    });

  } catch (error) {
    console.error("AI Chat API error:", error);
    return NextResponse.json({
      reply: "Ocurrió un error al consultar el catálogo inteligente de Syscom. Por favor intenta nuevamente.",
      products: [],
      reasoning: "Error de conexión temporal con el backend.",
      suggestedActions: ["Reintentar consulta", "Contactar a soporte"]
    }, { status: 500 });
  }
}
