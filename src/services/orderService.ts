
/**
 * @fileOverview Service functions for managing orders.
 *
 * - fetchUserOrders - Fetches orders for a specific user.
 * - fetchAllOrders - Fetches all orders for admin reporting.
 * - createOrderFromQuote - Creates a new order from an existing quote.
 */

import { db } from '@/lib/firebase';
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

  const orderItems: OrderItem[] = quote.items.map(item => ({
    productId: item.productId,
    sku: item.sku || item.productId,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    imageUrl: item.imageUrl || '',
  }));

  const paymentReference = Date.now().toString().slice(-8);
  const nowIso = new Date().toISOString();

  const newOrderData: Omit<Order, 'id'> = {
    userId: userId,
    items: orderItems,
    subtotal: quote.subtotal,
    shippingCost: quote.shippingCost || 0,
    vatAmount: quote.vatAmount,
    totalAmount: quote.totalAmount,
    status: 'pending',
    createdAt: nowIso,
    updatedAt: nowIso,
    shippingAddress: {
      street: 'Cotización Directa (' + (quote.customerName || 'Cliente') + ')', 
      city: 'Por definir',
      zip: '00000',
      country: 'México',
      phone: 'Pendiente',
      contactEmail: quote.customerEmail,
    },
    paymentDetails: {
      method: 'Transferencia Bancaria',
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

    return {
      id: docRef.id,
      ...newOrderData,
    };
  } catch (error) {
    console.error(`Error creating order from quote ${quote.id}:`, error);
    throw new Error('Hubo un problema al crear el pedido a partir de la cotización.');
  }
}
