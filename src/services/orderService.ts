
/**
 * @fileOverview Service functions for managing orders.
 *
 * - fetchUserOrders - Fetches orders for a specific user.
 * - fetchAllOrders - Fetches all orders for admin reporting.
 * - createOrderFromQuote - Creates a new order from an existing quote.
 */

import { db, auth } from '@/lib/firebase';
import type { Order, OrderItem, Quote } from '@/lib/types';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
} from 'firebase/firestore';

const ORDERS_COLLECTION = 'orders';

export interface OrderFinancialBreakdown {
  subtotalSinIva: number;
  subtotalConIva: number;
  vatAmount: number;
  shippingCost: number;
  totalAmount: number;
  itemsAreVatInclusive: boolean;
}

/**
 * Calcula de forma exacta y uniforme el desglose fiscal de cualquier pedido (Checkout o Cotización):
 * - Subtotal (sin IVA)
 * - IVA (16%)
 * - Envío
 * - Total (MXN, IVA incluido)
 */
export function getOrderFinancials(order: Order): OrderFinancialBreakdown {
  const shippingCost = Number(order.shippingCost) || 0;
  const totalAmount = Number(order.totalAmount) || 0;
  const rawSubtotal = Number(order.subtotal) || 0;
  const rawVat = Number(order.vatAmount) || 0;

  // Detectar si rawSubtotal fue guardado SIN IVA (ej. cotización donde subtotal + vat + shipping ≈ total)
  const sumAsNet = rawSubtotal + rawVat + shippingCost;
  const sumAsGross = rawSubtotal + shippingCost;

  if (rawVat > 0 && Math.abs(sumAsNet - totalAmount) < 0.5 && Math.abs(sumAsGross - totalAmount) >= 0.5) {
    // El pedido guardó subtotal SIN IVA
    const subtotalSinIva = parseFloat(rawSubtotal.toFixed(2));
    const vatAmount = parseFloat(rawVat.toFixed(2));
    const subtotalConIva = parseFloat((subtotalSinIva + vatAmount).toFixed(2));
    const itemsSum = (order.items || []).reduce((acc, i) => acc + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
    const itemsAreVatInclusive = Math.abs(itemsSum - subtotalConIva) < Math.abs(itemsSum - subtotalSinIva);
    return {
      subtotalSinIva,
      subtotalConIva,
      vatAmount,
      shippingCost,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      itemsAreVatInclusive,
    };
  }

  // Caso estándar (Checkout): totalAmount - shippingCost ya incluye el 16% de IVA
  const grossProducts = Math.max(0, totalAmount > 0 ? totalAmount - shippingCost : rawSubtotal);
  const subtotalSinIva = parseFloat((grossProducts / 1.16).toFixed(2));
  const vatAmount = parseFloat((grossProducts - subtotalSinIva).toFixed(2));
  const subtotalConIva = parseFloat(grossProducts.toFixed(2));

  return {
    subtotalSinIva,
    subtotalConIva,
    vatAmount,
    shippingCost,
    totalAmount: parseFloat((subtotalConIva + shippingCost).toFixed(2)),
    itemsAreVatInclusive: true,
  };
}

/**
 * Helper to convert a Firestore document to an Order object.
 * @param docSnapshot The Firestore document snapshot.
 * @returns An Order object.
 */
function docToOrder(docSnapshot: any): Order {
  const data = docSnapshot.data();
  // Serialize Timestamps to ISO strings for client components
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : String(data.createdAt || new Date(0).toISOString());
  const updatedAt = data.updatedAt && data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt ? String(data.updatedAt) : undefined;
  
  return {
    id: docSnapshot.id,
    userId: data.userId || '',
    items: Array.isArray(data.items) ? data.items : [],
    subtotal: typeof data.subtotal === 'number' ? data.subtotal : 0,
    shippingCost: typeof data.shippingCost === 'number' ? data.shippingCost : 0,
    vatAmount: typeof data.vatAmount === 'number' ? data.vatAmount : 0,
    totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
    status: data.status || 'pending',
    shippingAddress: data.shippingAddress || { street: '', city: '', zip: '', country: '', phone: '', contactEmail: '' },
    paymentDetails: data.paymentDetails || { method: 'N/A' },
    paymentReference: data.paymentReference || undefined,
    requiresBilling: data.requiresBilling || false,
    billingDetails: data.billingDetails || undefined,
    shippingProvider: data.shippingProvider || undefined,
    trackingNumber: data.trackingNumber || undefined,
    trackingDocumentUrl: data.trackingDocumentUrl || undefined,
    trackingUrl: data.trackingUrl || undefined,
    createdAt,
    updatedAt,
  } as Order;
}


/**
 * Fetches orders for a specific user from Firestore.
 * @param userId The ID of the user whose orders are to be fetched.
 * @returns A promise that resolves to an array of Order objects.
 * 
 * IMPORTANT: This query requires a composite index in Firestore on the 'orders' collection
 * for fields 'userId' (ascending) and 'createdAt' (descending).
 * If the index is missing, Firestore might return an empty result or an error in the Firebase console.
 * You can create this index in the Firebase console under Firestore Database > Indexes.
 */
export async function fetchUserOrders(userId: string): Promise<Order[]> {
  if (!userId) {
    console.warn("fetchUserOrders called with no userId");
    return [];
  }
  
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(
      ordersRef,
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(docToOrder);
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return orders;

  } catch (error) {
    console.error(`[OrderService] Error fetching user orders for userId: ${userId}`, error);
    return []; 
  }
}

/**
 * Fetches all orders from Firestore, intended for admin use.
 * @returns A promise that resolves to an array of all Order objects.
 */
export async function fetchAllOrders(): Promise<Order[]> {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToOrder);
  } catch (error) {
    try {
      const ordersRef = collection(db, ORDERS_COLLECTION);
      const querySnapshot = await getDocs(ordersRef);
      const orders = querySnapshot.docs.map(docToOrder);
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return orders;
    } catch (fallbackErr) {
      console.error(`[OrderService] Error fetching all orders:`, fallbackErr);
      return [];
    }
  }
}


/**
 * Creates a new order from an existing quote.
 * @param quote The quote object to convert into an order.
 * @returns A promise that resolves to the newly created Order object.
 */
export async function createOrderFromQuote(quote: Quote): Promise<Order> {
  if (!quote) {
    throw new Error('No se proporcionó una cotización para crear el pedido.');
  }

  const userId = quote.userId || quote.customerEmail; 

  // En las cotizaciones, item.price se almacena SIN IVA.
  // Detectamos si item.price ya tiene IVA o si está sin IVA comparando con quote.subtotal y quote.totalAmount.
  const rawItemsSum = quote.items.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  const discountVal = Number(quote.discountValue) || 0;
  const discountAmt = quote.discountType === 'percentage'
    ? Math.min(rawItemsSum, rawItemsSum * (discountVal / 100))
    : Math.min(rawItemsSum, discountVal);
  const subAfterDiscountSinIva = Math.max(0, rawItemsSum - discountAmt);

  // Garantizar SIEMPRE que el IVA (16%) esté calculado y sumado al crear un pedido desde cotización
  const vatRate = 0.16;
  const calculatedVat = parseFloat((subAfterDiscountSinIva * vatRate).toFixed(2));
  const effectiveVatAmount = quote.vatAmount && quote.vatAmount > 0 ? parseFloat(quote.vatAmount.toFixed(2)) : calculatedVat;
  const shipping = Number(quote.shippingCost) || 0;
  const grossSubtotalWithVat = parseFloat((subAfterDiscountSinIva + effectiveVatAmount).toFixed(2));
  const finalTotalWithVat = parseFloat((grossSubtotalWithVat + shipping).toFixed(2));

  // Guardamos el precio unitario CON IVA en los ítems del pedido (igual que en el Checkout normal)
  const orderItems: OrderItem[] = quote.items.map(item => ({
    productId: item.productId,
    sku: item.sku || item.productId,
    name: item.name,
    quantity: item.quantity,
    price: parseFloat((item.price * (1 + vatRate)).toFixed(2)),
    imageUrl: item.imageUrl || '',
  }));

  const paymentReference = `SPEI-${Date.now().toString().slice(-8)}`;
  const nowIso = new Date().toISOString();

  const newOrderData: Omit<Order, 'id'> = {
    userId: userId,
    items: orderItems,
    subtotal: grossSubtotalWithVat,
    shippingCost: shipping,
    vatAmount: effectiveVatAmount,
    totalAmount: finalTotalWithVat,
    status: 'pending',
    createdAt: nowIso,
    updatedAt: nowIso,
    shippingAddress: {
      street: 'Cotización Directa (' + (quote.customerName || 'Cliente') + ')', 
      city: 'Por definir',
      zip: '00000',
      country: 'México',
      phone: quote.customerPhone || 'Pendiente',
      contactEmail: quote.customerEmail,
    },
    paymentDetails: {
      method: 'spei',
      instructions: `Pedido generado desde Cotización ${quote.quoteNumber}.`,
    },
    paymentReference: paymentReference,
  };

  try {
    const ordersCollectionRef = collection(db, 'orders');
    const firestoreOrderData = {
      ...newOrderData,
      createdAt: Timestamp.fromDate(new Date(nowIso)),
      updatedAt: Timestamp.fromDate(new Date(nowIso)),
    };
    const docRef = await addDoc(ordersCollectionRef, firestoreOrderData);

    // Notificar conversión de cotización a pedido en ventas@borarly.com
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token && typeof window !== 'undefined') {
        await fetch('/api/orders/notify', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            orderId: docRef.id,
            reference: paymentReference,
            createdAt: nowIso,
            status: 'pending',
            paymentMethod: 'spei',
            customer: {
              name: quote.customerName || 'Cliente',
              email: quote.customerEmail || '',
              phone: quote.customerPhone || '',
            },
            shipping: {
              street: newOrderData.shippingAddress.street,
              city: newOrderData.shippingAddress.city,
              zip: newOrderData.shippingAddress.zip,
              country: newOrderData.shippingAddress.country,
            },
            items: orderItems.map(({ name, sku, quantity, price, imageUrl }) => ({ name, sku, quantity, price, imageUrl })),
            subtotal: parseFloat(subAfterDiscountSinIva.toFixed(2)),
            vatAmount: effectiveVatAmount,
            shippingCost: shipping,
            total: finalTotalWithVat,
            billing: null,
          }),
        });
      }
    } catch (notifyErr) {
      console.warn('[OrderService] No se pudo enviar notificación de correo:', notifyErr);
    }

    return {
      id: docRef.id,
      ...newOrderData,
    };
  } catch (error) {
    console.error(`Error creating order from quote ${quote.id}:`, error);
    throw new Error('Hubo un problema al crear el pedido a partir de la cotización.');
  }
}
