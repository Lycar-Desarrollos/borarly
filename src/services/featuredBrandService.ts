
'use server';
/**
 * @fileOverview Service functions for managing featured brands in Firestore.
 */

import { db } from '@/lib/firebase';
import type { FeaturedBrand } from '@/lib/types';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

const FEATURED_BRANDS_COLLECTION = 'featuredBrands';

// Helper to convert Firestore doc data to FeaturedBrand type
function docToFeaturedBrand(docSnapshot: any): FeaturedBrand {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    name: data.name || '',
    logoUrl: data.logoUrl || '',
    order: typeof data.order === 'number' ? data.order : 0,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date(0).toISOString()),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date(0).toISOString()),
  };
}

export async function getFeaturedBrands(): Promise<FeaturedBrand[]> {
  try {
    const brandsRef = collection(db, FEATURED_BRANDS_COLLECTION);
    const q = query(brandsRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToFeaturedBrand);
  } catch (error) {
    console.error("Error fetching featured brands:", error);
    if (error instanceof Error && error.message.includes('firestore/failed-precondition') && error.message.includes('index')) {
        console.error("Firestore Precondition Failed for Featured Brands: This query requires an index. Please create it in your Firestore console. Index needed: featuredBrands collection, 'order' (ASC).");
    }
    return [];
  }
}

export async function addFeaturedBrand(brandData: Omit<FeaturedBrand, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeaturedBrand> {
  try {
    const newBrandData = {
      ...brandData,
      order: Number(brandData.order) || 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, FEATURED_BRANDS_COLLECTION), newBrandData);
    const newDoc = await getDoc(docRef);
    return docToFeaturedBrand(newDoc);
  } catch (error) {
    console.error("Error adding featured brand:", error);
    throw error;
  }
}

export async function updateFeaturedBrand(id: string, brandData: Partial<Omit<FeaturedBrand, 'id' | 'createdAt' | 'updatedAt'>>): Promise<FeaturedBrand | null> {
  try {
    const brandDocRef = doc(db, FEATURED_BRANDS_COLLECTION, id);
    const updateData = {
      ...brandData,
      ...(brandData.order !== undefined && { order: Number(brandData.order) }),
      updatedAt: Timestamp.now(),
    };
    await updateDoc(brandDocRef, updateData);
    const updatedDoc = await getDoc(brandDocRef);
    return updatedDoc.exists() ? docToFeaturedBrand(updatedDoc) : null;
  } catch (error) {
    console.error("Error updating featured brand:", id, error);
    throw error;
  }
}

export async function deleteFeaturedBrand(id: string): Promise<void> {
  try {
    const brandDocRef = doc(db, FEATURED_BRANDS_COLLECTION, id);
    await deleteDoc(brandDocRef);
  } catch (error) {
    console.error("Error deleting featured brand:", id, error);
    throw error;
  }
}

export async function getFeaturedBrandById(id: string): Promise<FeaturedBrand | null> {
    try {
      const brandDocRef = doc(db, FEATURED_BRANDS_COLLECTION, id);
      const docSnap = await getDoc(brandDocRef);
      if (docSnap.exists()) {
        return docToFeaturedBrand(docSnap);
      }
      return null;
    } catch (error) {
      console.error("Error fetching featured brand by ID:", id, error);
      return null;
    }
  }
