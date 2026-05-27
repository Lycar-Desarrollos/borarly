

import type { Timestamp as FirestoreTimestamp } from 'firebase/firestore'; // Keep for Firestore specific operations if needed elsewhere

export type CategoryLevel = 1 | 2 | 3;

export interface Category {
  id: string;
  name: string;
  description?: string;
  isFeatured?: boolean;
  featuredImageUrl?: string;
  parentId?: string | null;
  level: CategoryLevel; // 1: Sección, 2: Línea, 3: Serie
  isVisible?: boolean;
  alias?: string;
  showInNavbar?: boolean;
}

export interface Product {
  id:string; // This 'id' is now the SKU
  name: string;
  description: string;
  price: number; // Final selling price in MXN (calculated from cost and margin)
  currency: 'MXN' | 'USD'; // The currency of costPrice
  costPrice: number; // Price from the provider. Only for admin use.
  profitMargin: number; // Profit percentage. Only for admin use.
  imageUrls: string[];
  category: string; // Category ID (will point to the 'Serie' level category)
  categoryId?: string;
  stock: number;
  brand?: string;
  line?: string;
  series?: string;
  isFeatured?: boolean; // Added for featured products
  createdAt?: string;
  updatedAt?: string;
  // Syscom specific details for Enhanced View
  puntos_clave?: string[];
  marca_logo?: string;
  precio_lista?: number;
  precio_especial?: number;
  precio_descuento?: number;
  categorias_adicionales?: { id: string, nombre: string, nivel: number }[];
  sat_code?: string;
  sap_code?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface UserAddress {
  id: string;
  alias: string; // ej. "Mi Casa", "Oficina"
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface BillingData {
  id: string;
  alias: string; // ej. "Empresa Principal"
  rfc: string;
  razonSocial: string;
  regimenFiscal: string; // e.g., "601 - General de Ley Personas Morales"
  usoCFDI: string;       // e.g., "G03 - Gastos en general"
  zip: string;           // Código Postal fiscal
  email: string;         // Correo para mandar la factura
  isDefault: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
  address?: {
    street: string;
    city: string;
    zip: string;
    country: string;
    phone?: string;
  };
  savedAddresses?: UserAddress[]; // Libreta de direcciones
  savedBilling?: BillingData[];   // Libreta de datos de facturación
  role?: 'customer' | 'admin';
  wishlist?: string[]; // Array of product SKUs (product.id)
}

export interface OrderItem {
  productId: string; // This will be the product SKU (product.id)
  name: string;
  sku?: string; // SKU at the time of order, for historical record if SKUs could change (though now they are doc IDs)
  quantity: number;
  price: number; // Price per unit at the time of order
  imageUrl: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number; // Added shipping cost
  vatAmount: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string; 
  updatedAt?: string; 
  shippingAddress: {
    street: string;
    city: string;
    zip: string;
    country: string;
    phone: string;
    contactEmail: string;
  };
  requiresBilling?: boolean;
  billingDetails?: BillingData; // Datos capturados de facturación
  paymentDetails?: {
    method: string;
    transactionId?: string;
    instructions?: string;
  };
  paymentReference?: string; // Numeric reference for payment
  // --- Nivel de Logística ---
  shippingProvider?: string;
  trackingNumber?: string;
  trackingDocumentUrl?: string; // Documento anexo subido desde Admin Panel
  trackingUrl?: string;          // Link directo al rastreo de la paquetería
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  altText: string;
  order: number; 
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string; 
  isActive?: boolean; 
  createdAt?: string;
  updatedAt?: string;
}

export interface AppSettings {
    shippingCost?: number;
    freeShippingThreshold?: number;
    quoteLogoUrl?: string;
    usdToMxnRate?: number;
    vatRate?: number; // As a decimal, e.g., 0.16 for 16%
}

export interface FeaturedBrand {
  id: string;
  name: string;
  logoUrl: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  brandLogoUrl?: string;
  buttonText: string;
  buttonLink: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}


// --- Quote Management ---
export interface QuoteItem {
  productId: string; // Internal ID
  sku?: string;      // Human-readable SKU (True SKU / Model)
  name: string;
  quantity: number;
  price: number; // The quoted price per unit
  stockAtTimeOfQuote?: number;
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'expired' | 'cancelled';
export type DiscountType = 'percentage' | 'fixed';

export interface Quote {
  id: string; // Firestore document ID
  quoteNumber: string; // Human-readable, sequential number
  customerName: string;
  customerEmail: string;
  items: QuoteItem[];
  subtotal: number;
  discountType?: DiscountType; // 'percentage' or 'fixed'
  discountValue?: number; // The value of the discount
  shippingCost: number;
  vatAmount: number;
  totalAmount: number;
  status: QuoteStatus;
  notes?: string;
  createdAt: string; // ISO string
  expiresAt: string; // ISO string
  updatedAt: string; // ISO string
  showBankDetails: boolean;
}
