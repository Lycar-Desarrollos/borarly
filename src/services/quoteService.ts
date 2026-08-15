

'use server';
/**
 * @fileOverview Service functions for managing quotes in Firestore.
 */

import { db } from '@/lib/firebase';
import type { Quote, QuoteItem } from '@/lib/types';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { getQuoteLogoUrl as getLogoUrlFromSettings } from './settingsService';


const QUOTES_COLLECTION = 'quotes';
const COUNTERS_COLLECTION = 'counters';
const QUOTE_COUNTER_DOC = 'quoteCounter';

// Helper to convert Firestore doc data to Quote type
function docToQuote(docSnapshot: any): Quote {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    quoteNumber: data.quoteNumber || `QUOTE-${docSnapshot.id.substring(0,5)}`,
    customerName: data.customerName || '',
    customerEmail: data.customerEmail || '',
    items: data.items || [],
    subtotal: data.subtotal || 0,
    discountType: data.discountType,
    discountValue: data.discountValue,
    shippingCost: data.shippingCost || 0,
    vatAmount: data.vatAmount || 0,
    totalAmount: data.totalAmount || 0,
    status: data.status || 'draft',
    notes: data.notes || '',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date(0).toISOString(),
    expiresAt: data.expiresAt instanceof Timestamp ? data.expiresAt.toDate().toISOString() : new Date(0).toISOString(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date(0).toISOString(),
    showBankDetails: typeof data.showBankDetails === 'boolean' ? data.showBankDetails : true, // Default to true
  };
}

// Function to get the next sequential quote number
async function getNextQuoteNumber(): Promise<string> {
    const counterRef = doc(db, COUNTERS_COLLECTION, QUOTE_COUNTER_DOC);
    try {
        const newQuoteNumber = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            if (!counterDoc.exists()) {
                transaction.set(counterRef, { currentNumber: 1001 });
                return "COT-1001";
            }
            const newNumber = counterDoc.data().currentNumber + 1;
            transaction.update(counterRef, { currentNumber: newNumber });
            return `COT-${newNumber}`;
        });
        return newQuoteNumber;
    } catch (error) {
        console.error("Error getting next quote number, falling back to random.", error);
        // Fallback in case transaction fails
        return `COT-${Date.now().toString().slice(-6)}`;
    }
}


// Helper to sanitize objects for Firestore (removes undefined values recursively)
function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date || (obj as any).constructor?.name === 'Timestamp' || typeof (obj as any).toMillis === 'function') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    if (value !== undefined) {
      sanitized[key] = sanitizeForFirestore(value);
    }
  }
  return sanitized as T;
}

// Create a new quote
export async function addQuote(quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'quoteNumber'>): Promise<Quote> {
  try {
    const quoteNumber = await getNextQuoteNumber();
    const newQuoteData = sanitizeForFirestore({
      ...quoteData,
      quoteNumber,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(quoteData.expiresAt)),
      showBankDetails: typeof quoteData.showBankDetails === 'boolean' ? quoteData.showBankDetails : true,
    });
    const docRef = await addDoc(collection(db, QUOTES_COLLECTION), newQuoteData);
    const newDoc = await getDoc(docRef);
    return docToQuote(newDoc);
  } catch (error) {
    console.error("Error adding quote:", error);
    throw error;
  }
}

// Get all quotes
export async function getQuotes(): Promise<Quote[]> {
  try {
    const quotesRef = collection(db, QUOTES_COLLECTION);
    const q = query(quotesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToQuote);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return [];
  }
}

// Get a single quote by ID
export async function getQuoteById(id: string): Promise<Quote | null> {
  try {
    const quoteDocRef = doc(db, QUOTES_COLLECTION, id);
    const docSnap = await getDoc(quoteDocRef);
    if (docSnap.exists()) {
      return docToQuote(docSnap);
    }
    return null;
  } catch (error) {
    console.error("Error fetching quote by ID:", id, error);
    return null;
  }
}

// Update a quote
export async function updateQuote(id: string, quoteData: Partial<Omit<Quote, 'id' | 'createdAt'>>): Promise<Quote | null> {
  try {
    const quoteDocRef = doc(db, QUOTES_COLLECTION, id);
    const rawUpdateData: Record<string, any> = {
      ...quoteData,
      updatedAt: Timestamp.now(),
    };

    if (quoteData.expiresAt) {
      rawUpdateData.expiresAt = Timestamp.fromDate(new Date(quoteData.expiresAt));
    }

    if (typeof quoteData.showBankDetails === 'boolean') {
      rawUpdateData.showBankDetails = quoteData.showBankDetails;
    }

    const updateData = sanitizeForFirestore(rawUpdateData);

    await updateDoc(quoteDocRef, updateData);
    const updatedDoc = await getDoc(quoteDocRef);
    return updatedDoc.exists() ? docToQuote(updatedDoc) : null;
  } catch (error) {
    console.error("Error updating quote:", id, error);
    throw error;
  }
}

// Delete a quote
export async function deleteQuote(id: string): Promise<void> {
  try {
    const quoteDocRef = doc(db, QUOTES_COLLECTION, id);
    await deleteDoc(quoteDocRef);
  } catch (error) {
    console.error("Error deleting quote:", id, error);
    throw error;
  }
}

// Export the function to be used in the PDF generation
export async function getQuoteLogoUrl(): Promise<string | null> {
    return getLogoUrlFromSettings();
}
