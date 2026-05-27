
/**
 * @fileOverview Service functions for managing app-wide settings in Firestore.
 */

import { db, storage } from '@/lib/firebase';
import type { AppSettings } from '@/lib/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const SETTINGS_COLLECTION = 'settings';
const SHIPPING_DOC_ID = 'shipping';
const BRANDING_DOC_ID = 'branding';
const CURRENCY_DOC_ID = 'currency'; 
const TAX_DOC_ID = 'taxes';
const PROFIT_DOC_ID = 'profit_margin';


/**
 * Gets the current shipping settings from Firestore.
 * @returns An object with shippingCost and freeShippingThreshold.
 */
export async function getShippingSettings(): Promise<{ cost: number; freeShippingThreshold: number | null }> {
  try {
    const shippingDocRef = doc(db, SETTINGS_COLLECTION, SHIPPING_DOC_ID);
    const docSnap = await getDoc(shippingDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AppSettings;
      return {
        cost: data.shippingCost || 0,
        freeShippingThreshold: typeof data.freeShippingThreshold === 'number' ? data.freeShippingThreshold : null,
      };
    }
    return { cost: 0, freeShippingThreshold: null };
  } catch (error) {
    console.error("Error fetching shipping settings:", error);
    return { cost: 0, freeShippingThreshold: null };
  }
}

/**
 * Updates the shipping settings in Firestore.
 * @param cost The new shipping cost.
 * @param freeShippingThreshold The new threshold for free shipping.
 */
export async function updateShippingSettings(cost: number, freeShippingThreshold: number): Promise<void> {
  try {
    const shippingDocRef = doc(db, SETTINGS_COLLECTION, SHIPPING_DOC_ID);
    await setDoc(shippingDocRef, { 
        shippingCost: cost,
        freeShippingThreshold: freeShippingThreshold 
    }, { merge: true });
  } catch (error) {
    console.error("Error updating shipping settings:", error);
    throw new Error("Failed to update shipping settings.");
  }
}

/**
 * Gets the URL for the quote logo from Firestore.
 * @returns The URL of the logo, or null if not set.
 */
export async function getQuoteLogoUrl(): Promise<string | null> {
  try {
    const brandingDocRef = doc(db, SETTINGS_COLLECTION, BRANDING_DOC_ID);
    const docSnap = await getDoc(brandingDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AppSettings;
      return data.quoteLogoUrl || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching quote logo URL:", error);
    return null;
  }
}

/**
 * Uploads a new logo for quotes, saves it to Storage, and updates the URL in Firestore.
 * @param logoFile The new logo file to upload.
 * @returns The public URL of the newly uploaded logo.
 */
export async function updateQuoteLogo(logoFile: File): Promise<string> {
  try {
    // 1. Upload file to Firebase Storage
    const logoStorageRef = storageRef(storage, `settings/quoteLogo/${logoFile.name}`);
    const uploadResult = await uploadBytes(logoStorageRef, logoFile);
    
    // 2. Get the public URL of the uploaded file
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // 3. Save the URL to Firestore
    const brandingDocRef = doc(db, SETTINGS_COLLECTION, BRANDING_DOC_ID);
    await setDoc(brandingDocRef, { quoteLogoUrl: downloadURL }, { merge: true });
    
    return downloadURL;
  } catch (error) {
    console.error("Error updating quote logo:", error);
    throw new Error("Failed to update quote logo.");
  }
}

/**
 * Gets the current currency exchange rate from Firestore.
 * @returns The USD to MXN rate, or a default value if not set.
 */
export async function getExchangeRate(): Promise<number> {
  try {
    const currencyDocRef = doc(db, SETTINGS_COLLECTION, CURRENCY_DOC_ID);
    const docSnap = await getDoc(currencyDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AppSettings;
      // Default to 1 if not set or invalid
      return typeof data.usdToMxnRate === 'number' && data.usdToMxnRate > 0 ? data.usdToMxnRate : 1; 
    }
    return 1; // Default rate
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return 1; // Default rate on error
  }
}

/**
 * Updates the USD to MXN exchange rate in Firestore.
 * @param rate The new exchange rate.
 */
export async function updateExchangeRate(rate: number): Promise<void> {
  try {
    const currencyDocRef = doc(db, SETTINGS_COLLECTION, CURRENCY_DOC_ID);
    await setDoc(currencyDocRef, { usdToMxnRate: rate }, { merge: true });
  } catch (error) {
    console.error("Error updating exchange rate:", error);
    throw new Error("Failed to update exchange rate.");
  }
}

/**
 * Gets the current VAT rate from Firestore.
 * @returns The VAT rate as a decimal (e.g., 0.16 for 16%), or a default value.
 */
export async function getVatRate(): Promise<number> {
  try {
    const taxDocRef = doc(db, SETTINGS_COLLECTION, TAX_DOC_ID);
    const docSnap = await getDoc(taxDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AppSettings;
      // Default to 0.16 if not set or invalid
      return typeof data.vatRate === 'number' && data.vatRate >= 0 ? data.vatRate : 0.16;
    }
    return 0.16; // Default rate
  } catch (error) {
    console.error("Error fetching VAT rate:", error);
    return 0.16; // Default rate on error
  }
}

/**
 * Updates the VAT rate in Firestore.
 * @param rate The new VAT rate as a decimal (e.g., 0.16 for 16%).
 */
export async function updateVatRate(rate: number): Promise<void> {
  try {
    const taxDocRef = doc(db, SETTINGS_COLLECTION, TAX_DOC_ID);
    await setDoc(taxDocRef, { vatRate: rate }, { merge: true });
  } catch (error) {
    console.error("Error updating VAT rate:", error);
    throw new Error("Failed to update VAT rate.");
  }
}

/**
 * Gets the current general profit margin from Firestore.
 * @returns The profit margin as a decimal (e.g., 0.30 for 30%), or default 0.0.
 */
export async function getProfitMargin(): Promise<number> {
  try {
    const profitDocRef = doc(db, SETTINGS_COLLECTION, PROFIT_DOC_ID);
    const docSnap = await getDoc(profitDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as any;
      return typeof data.profitMargin === 'number' && data.profitMargin >= 0 ? data.profitMargin : 0.0;
    }
    return 0.0; // Ganancia por defecto
  } catch (error) {
    console.error("Error fetching profit margin:", error);
    return 0.0; 
  }
}

/**
 * Updates the general profit margin in Firestore.
 * @param margin The new profit margin as a decimal (e.g., 0.30 for 30%).
 */
export async function updateProfitMargin(margin: number): Promise<void> {
  try {
    const profitDocRef = doc(db, SETTINGS_COLLECTION, PROFIT_DOC_ID);
    await setDoc(profitDocRef, { profitMargin: margin }, { merge: true });
  } catch (error) {
    console.error("Error updating profit margin:", error);
    throw new Error("Failed to update profit margin.");
  }
}

export interface BankDetails {
  beneficiary: string;
  clabe: string;
  bank: string;
  companyName: string;
  email: string;
  phone: string;
}

const BANK_DETAILS_DEFAULTS: BankDetails = {
  companyName: 'Borarly',
  email: 'contacto@borarly.com',
  phone: '+52 999 310 1452',
  beneficiary: 'Borarly',
  clabe: '012 180 01576278534 6',
  bank: 'BBVA',
};

/**
 * Gets the bank/payment details from Firestore (stored in branding doc).
 */
export async function getBankDetails(): Promise<BankDetails> {
  try {
    const brandingDocRef = doc(db, SETTINGS_COLLECTION, BRANDING_DOC_ID);
    const docSnap = await getDoc(brandingDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        companyName: data.companyName || BANK_DETAILS_DEFAULTS.companyName,
        email: data.email || BANK_DETAILS_DEFAULTS.email,
        phone: data.phone || BANK_DETAILS_DEFAULTS.phone,
        beneficiary: data.beneficiary || BANK_DETAILS_DEFAULTS.beneficiary,
        clabe: data.clabe || BANK_DETAILS_DEFAULTS.clabe,
        bank: data.bank || BANK_DETAILS_DEFAULTS.bank,
      };
    }
    return BANK_DETAILS_DEFAULTS;
  } catch (error) {
    console.error("Error fetching bank details:", error);
    return BANK_DETAILS_DEFAULTS;
  }
}

/**
 * Updates the bank/payment details in Firestore (stored in branding doc).
 */
export async function updateBankDetails(details: BankDetails): Promise<void> {
  try {
    const brandingDocRef = doc(db, SETTINGS_COLLECTION, BRANDING_DOC_ID);
    await setDoc(brandingDocRef, details, { merge: true });
  } catch (error) {
    console.error("Error updating bank details:", error);
    throw new Error("Failed to update bank details.");
  }
}
