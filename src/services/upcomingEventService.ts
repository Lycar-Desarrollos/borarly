
'use server';
/**
 * @fileOverview Service functions for managing upcoming events in Firestore.
 */

import { db } from '@/lib/firebase';
import type { UpcomingEvent } from '@/lib/types';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

const EVENTS_COLLECTION = 'upcomingEvents';

// Helper to convert Firestore doc data to UpcomingEvent type
function docToUpcomingEvent(docSnapshot: any): UpcomingEvent {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    title: data.title || '',
    subtitle: data.subtitle || '',
    imageUrl: data.imageUrl || '',
    brandLogoUrl: data.brandLogoUrl || undefined,
    buttonText: data.buttonText || '',
    buttonLink: data.buttonLink || '#',
    order: typeof data.order === 'number' ? data.order : 0,
    isActive: typeof data.isActive === 'boolean' ? data.isActive : false,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date(0).toISOString()),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date(0).toISOString()),
  };
}

export async function getUpcomingEvents(activeOnly = true): Promise<UpcomingEvent[]> {
  try {
    const eventsRef = collection(db, EVENTS_COLLECTION);
    const queryConstraints = [orderBy('order', 'asc')];
    if (activeOnly) {
      queryConstraints.unshift(where('isActive', '==', true));
    }
    const q = query(eventsRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToUpcomingEvent);
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    if (error instanceof Error && error.message.includes('firestore/failed-precondition') && error.message.includes('index')) {
        console.error("Firestore Precondition Failed for Upcoming Events: This query may require a custom index. For active events, check for: upcomingEvents collection, 'isActive' (ASC), 'order' (ASC).");
    }
    return [];
  }
}

export async function addUpcomingEvent(eventData: Omit<UpcomingEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<UpcomingEvent> {
  try {
    const newEventData = {
      ...eventData,
      order: Number(eventData.order) || 0,
      isActive: !!eventData.isActive,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), newEventData);
    const newDoc = await getDoc(docRef);
    return docToUpcomingEvent(newDoc);
  } catch (error) {
    console.error("Error adding upcoming event:", error);
    throw error;
  }
}

export async function updateUpcomingEvent(id: string, eventData: Partial<Omit<UpcomingEvent, 'id' | 'createdAt' | 'updatedAt'>>): Promise<UpcomingEvent | null> {
  try {
    const eventDocRef = doc(db, EVENTS_COLLECTION, id);
    const updateData = {
      ...eventData,
      ...(eventData.order !== undefined && { order: Number(eventData.order) }),
      ...(eventData.isActive !== undefined && { isActive: !!eventData.isActive }),
      updatedAt: Timestamp.now(),
    };
    await updateDoc(eventDocRef, updateData);
    const updatedDoc = await getDoc(eventDocRef);
    return updatedDoc.exists() ? docToUpcomingEvent(updatedDoc) : null;
  } catch (error) {
    console.error("Error updating upcoming event:", id, error);
    throw error;
  }
}

export async function deleteUpcomingEvent(id: string): Promise<void> {
  try {
    const eventDocRef = doc(db, EVENTS_COLLECTION, id);
    await deleteDoc(eventDocRef);
  } catch (error) {
    console.error("Error deleting upcoming event:", id, error);
    throw error;
  }
}
