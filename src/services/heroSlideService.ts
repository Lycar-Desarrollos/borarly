
'use server';
/**
 * @fileOverview Service functions for managing hero slides in Firestore.
 */

import { db } from '@/lib/firebase';
import type { HeroSlide } from '@/lib/types';
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

const HERO_SLIDES_COLLECTION = 'heroSlides';

// Helper to convert Firestore doc data to HeroSlide type
function docToHeroSlide(docSnapshot: any): HeroSlide {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    imageUrl: data.imageUrl || '',
    altText: data.altText || '',
    order: typeof data.order === 'number' ? data.order : 0,
    title: data.title || undefined,
    description: data.description || undefined,
    buttonText: data.buttonText || undefined,
    buttonLink: data.buttonLink || undefined,
    isActive: typeof data.isActive === 'boolean' ? data.isActive : false,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date(0).toISOString()),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date(0).toISOString()),
  };
}

export async function getHeroSlides(activeOnly = true): Promise<HeroSlide[]> {
  try {
    const slidesRef = collection(db, HERO_SLIDES_COLLECTION);
    const queryConstraints = [orderBy('order', 'asc')];
    if (activeOnly) {
      queryConstraints.unshift(where('isActive', '==', true));
    }
    
    const q = query(slidesRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToHeroSlide);
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    if (error instanceof Error && error.message.includes('firestore/failed-precondition') && error.message.includes('index')) {
        console.error("Firestore Precondition Failed for Hero Slides: This query may require a custom index. For active slides, check for: heroSlides collection, 'isActive' (ASC), 'order' (ASC).");
    }
    return [];
  }
}

export async function addHeroSlide(slideData: Omit<HeroSlide, 'id' | 'createdAt' | 'updatedAt'>): Promise<HeroSlide> {
  try {
    const newSlideData = {
      ...slideData,
      order: Number(slideData.order),
      isActive: !!slideData.isActive,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, HERO_SLIDES_COLLECTION), newSlideData);
    const newDoc = await getDoc(docRef);
    return docToHeroSlide(newDoc);
  } catch (error) {
    console.error("Error adding hero slide:", error);
    throw error;
  }
}

export async function updateHeroSlide(id: string, slideData: Partial<Omit<HeroSlide, 'id' | 'createdAt' | 'updatedAt'>>): Promise<HeroSlide | null> {
  try {
    const slideDocRef = doc(db, HERO_SLIDES_COLLECTION, id);
    const updateData = {
      ...slideData,
      ...(slideData.order !== undefined && { order: Number(slideData.order) }),
      ...(slideData.isActive !== undefined && { isActive: !!slideData.isActive }),
      updatedAt: Timestamp.now(),
    };
    await updateDoc(slideDocRef, updateData);
    const updatedDoc = await getDoc(slideDocRef);
    return updatedDoc.exists() ? docToHeroSlide(updatedDoc) : null;
  } catch (error) {
    console.error("Error updating hero slide:", id, error);
    throw error;
  }
}

export async function deleteHeroSlide(id: string): Promise<void> {
  try {
    const slideDocRef = doc(db, HERO_SLIDES_COLLECTION, id);
    await deleteDoc(slideDocRef);
  } catch (error) {
    console.error("Error deleting hero slide:", id, error);
    throw error;
  }
}

export async function getHeroSlideById(id: string): Promise<HeroSlide | null> {
    try {
      const slideDocRef = doc(db, HERO_SLIDES_COLLECTION, id);
      const docSnap = await getDoc(slideDocRef);
      if (docSnap.exists()) {
        return docToHeroSlide(docSnap);
      }
      return null;
    } catch (error) {
      console.error("Error fetching hero slide by ID:", id, error);
      return null;
    }
  }

    