
"use client";

import type { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React, { createContext, useContext, useEffect, useState, ReactNode, Dispatch, SetStateAction, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  setUserProfile: Dispatch<SetStateAction<UserProfile | null>>; 
  loading: boolean;
  isAdmin: boolean;
  wishlist: string[];
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isProductInWishlist: (productId: string) => boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const profileData = userDocSnap.data() as UserProfile;
          if (!profileData.address) {
            profileData.address = { street: '', city: '', zip: '', country: '', phone: '' };
          } else if (profileData.address.phone === undefined) {
             profileData.address.phone = '';
          }
          profileData.wishlist = profileData.wishlist || [];
          setUserProfile(profileData);
          setWishlist(profileData.wishlist);
          setIsAdmin(profileData.role === 'admin');
        } else {
          const newUserProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'customer', 
            address: { street: '', city: '', zip: '', country: '', phone: '' },
            wishlist: [],
          };
          await setDoc(userDocRef, newUserProfile);
          setUserProfile(newUserProfile);
          setWishlist([]);
          setIsAdmin(false);
        }
      } else {
        setUserProfile(null);
        setWishlist([]);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addToWishlist = useCallback(async (productId: string) => {
    if (!currentUser || !userProfile) {
      toast({ variant: "destructive", title: "No has iniciado sesión", description: "Por favor, inicia sesión para añadir artículos a tu lista de deseos." });
      return;
    }
    if (wishlist.includes(productId)) return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        wishlist: arrayUnion(productId)
      });
      setWishlist(prev => [...prev, productId]);
      setUserProfile(prev => prev ? { ...prev, wishlist: [...(prev.wishlist || []), productId] } : null);
      toast({ title: "Añadido a Lista de Deseos", description: "El producto ha sido añadido a tu lista de deseos." });
    } catch (error) {
      console.error("Error al añadir a la lista de deseos:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo añadir a la lista de deseos." });
    }
  }, [currentUser, userProfile, wishlist, toast]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (!currentUser || !userProfile) return;
    if (!wishlist.includes(productId)) return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        wishlist: arrayRemove(productId)
      });
      setWishlist(prev => prev.filter(id => id !== productId));
      setUserProfile(prev => prev ? { ...prev, wishlist: (prev.wishlist || []).filter(id => id !== productId) } : null);
      toast({ title: "Eliminado de Lista de Deseos", description: "El producto ha sido eliminado de tu lista de deseos." });
    } catch (error) {
      console.error("Error al eliminar de la lista de deseos:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar de la lista de deseos." });
    }
  }, [currentUser, userProfile, wishlist, toast]);

  const isProductInWishlist = useCallback((productId: string) => {
    return wishlist.includes(productId);
  }, [wishlist]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error al iniciar sesión con Google: ", error);
      toast({ variant: "destructive", title: "Fallo al Iniciar Sesión con Google" });
    }
  };
  
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/login'); 
    } catch (error) {
      console.error("Error al cerrar sesión: ", error);
      toast({ variant: "destructive", title: "Fallo al Cerrar Sesión" });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      userProfile, 
      setUserProfile, 
      loading, 
      isAdmin, 
      wishlist, 
      addToWishlist, 
      removeFromWishlist,
      isProductInWishlist,
      signInWithGoogle, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
