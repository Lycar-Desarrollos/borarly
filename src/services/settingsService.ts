/**
 * @fileOverview Service functions for managing app-wide settings in Firestore.
 */

import { db, storage, fetchFirestoreCollectionRest } from '@/lib/firebase';
import type { AppSettings } from '@/lib/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const SETTINGS_COLLECTION = 'settings';
const SHIPPING_DOC_ID = 'shipping';
const BRANDING_DOC_ID = 'branding';
const CURRENCY_DOC_ID = 'currency'; 
const TAX_DOC_ID = 'taxes';
const PROFIT_DOC_ID = 'profit_margin';

const DEFAULT_VAT_RATE = 0.16;      // 16% IVA México obligatorio por defecto
const DEFAULT_PROFIT_MARGIN = 0.25; // 25% Margen de ganancia comercial por defecto

// Caché en memoria (TTL 5 minutos) para evitar agotar la cuota gratuita de 50,000 lecturas diarias de Firestore
const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedVatRate: { value: number; expiresAt: number } | null = null;
let cachedProfitMargin: { value: number; expiresAt: number } | null = null;
let cachedShippingSettings: { value: { cost: number; freeShippingThreshold: number | null }; expiresAt: number } | null = null;


/**
 * Gets the current shipping settings from Firestore.
 * @returns An object with shippingCost and freeShippingThreshold.
 */
export async function getShippingSettings(): Promise<{ cost: number; freeShippingThreshold: number | null }> {
  if (cachedShippingSettings && Date.now() < cachedShippingSettings.expiresAt) {
    return cachedShippingSettings.value;
  }
  try {
    if (typeof window === 'undefined') {
      const docs = await fetchFirestoreCollectionRest(SETTINGS_COLLECTION);
      const data = docs[SHIPPING_DOC_ID] as AppSettings | undefined;
      if (data) {
        const result = {
          cost: data.shippingCost || 0,
          freeShippingThreshold: typeof data.freeShippingThreshold === 'number' ? data.freeShippingThreshold : null,
        };
        cachedShippingSettings = { value: result, expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS };
        return result;
      }
      return cachedShippingSettings?.value ?? { cost: 0, freeShippingThreshold: null };
    }
    const shippingDocRef = doc(db, SETTINGS_COLLECTION, SHIPPING_DOC_ID);
    const docSnap = await getDoc(shippingDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AppSettings;
      const result = {
        cost: data.shippingCost || 0,
        freeShippingThreshold: typeof data.freeShippingThreshold === 'number' ? data.freeShippingThreshold : null,
      };
      cachedShippingSettings = { value: result, expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS };
      return result;
    }
    return cachedShippingSettings?.value ?? { cost: 0, freeShippingThreshold: null };
  } catch (error) {
    console.error("Error fetching shipping settings:", error);
    return cachedShippingSettings?.value ?? { cost: 0, freeShippingThreshold: null };
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
    cachedShippingSettings = {
      value: { cost, freeShippingThreshold },
      expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS,
    };
  } catch (error) {
    console.error("Error updating shipping settings:", error);
    throw new Error("Failed to update shipping settings.");
  }
}

/**
 * Gets the URL for the quote logo from Firestore, defaulting to Borarly's official /logo.png.
 * Automatically ignores legacy Borartech logos stored under settings/quoteLogo/.
 */
export async function getQuoteLogoUrl(): Promise<string> {
  try {
    if (typeof window === 'undefined') {
      const docs = await fetchFirestoreCollectionRest(SETTINGS_COLLECTION);
      const data = docs[BRANDING_DOC_ID] as AppSettings | undefined;
      const savedUrl = data?.quoteLogoUrl || '';
      const isOfficialOrNewBorarlyLogo =
        savedUrl === '/logo.png' ||
        savedUrl.includes('settings%2FborarlyLogo') ||
        savedUrl.includes('settings/borarlyLogo');
      return isOfficialOrNewBorarlyLogo ? savedUrl : '/logo.png';
    }
    const brandingDocRef = doc(db, SETTINGS_COLLECTION, BRANDING_DOC_ID);
    const docSnap = await getDoc(brandingDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AppSettings;
      const savedUrl = data.quoteLogoUrl || '';
      const isOfficialOrNewBorarlyLogo =
        savedUrl === '/logo.png' ||
        savedUrl.includes('settings%2FborarlyLogo') ||
        savedUrl.includes('settings/borarlyLogo');

      if (!isOfficialOrNewBorarlyLogo) {
        // Auto-heal Firestore document to official Borarly logo
        setDoc(brandingDocRef, { quoteLogoUrl: '/logo.png' }, { merge: true }).catch(() => {});
        return '/logo.png';
      }
      return savedUrl;
    }
    return '/logo.png';
  } catch (error) {
    console.error("Error fetching quote logo URL:", error);
    return '/logo.png';
  }
}

/**
 * Uploads a new logo for quotes, saves it to Storage, and updates the URL in Firestore.
 * @param logoFile The new logo file to upload.
 * @returns The public URL of the newly uploaded logo.
 */
export async function updateQuoteLogo(logoFile: File): Promise<string> {
  try {
    // 1. Upload file to Firebase Storage under settings/borarlyLogo/
    const logoStorageRef = storageRef(storage, `settings/borarlyLogo/${logoFile.name}`);
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
    if (typeof window === 'undefined') {
      const docs = await fetchFirestoreCollectionRest(SETTINGS_COLLECTION);
      const data = docs[CURRENCY_DOC_ID] as AppSettings | undefined;
      return typeof data?.usdToMxnRate === 'number' && data.usdToMxnRate > 0 ? data.usdToMxnRate : 1;
    }
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
  if (cachedVatRate && Date.now() < cachedVatRate.expiresAt) {
    return cachedVatRate.value;
  }
  try {
    if (typeof window === 'undefined') {
      const docs = await fetchFirestoreCollectionRest(SETTINGS_COLLECTION);
      const data = docs[TAX_DOC_ID] as AppSettings | undefined;
      const rate = typeof data?.vatRate === 'number' && data.vatRate > 0 ? data.vatRate : DEFAULT_VAT_RATE;
      cachedVatRate = { value: rate, expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS };
      return rate;
    }
    const taxDocRef = doc(db, SETTINGS_COLLECTION, TAX_DOC_ID);
    const docSnap = await getDoc(taxDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AppSettings;
      const rate = typeof data.vatRate === 'number' && data.vatRate > 0 ? data.vatRate : DEFAULT_VAT_RATE;
      cachedVatRate = { value: rate, expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS };
      return rate;
    }
    cachedVatRate = { value: DEFAULT_VAT_RATE, expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS };
    return DEFAULT_VAT_RATE;
  } catch (error) {
    console.error("Error fetching VAT rate:", error);
    return cachedVatRate?.value ?? DEFAULT_VAT_RATE;
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
    cachedVatRate = { value: rate, expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS };
  } catch (error) {
    console.error("Error updating VAT rate:", error);
    throw new Error("Failed to update VAT rate.");
  }
}

/**
 * Gets the current general profit margin from Firestore.
 * @returns The profit margin as a decimal (e.g., 0.25 for 25%), or default 0.25.
 */
export async function getProfitMargin(): Promise<number> {
  if (cachedProfitMargin && Date.now() < cachedProfitMargin.expiresAt) {
    return cachedProfitMargin.value;
  }
  try {
    if (typeof window === 'undefined') {
      const docs = await fetchFirestoreCollectionRest(SETTINGS_COLLECTION);
      const data = docs[PROFIT_DOC_ID] as any;
      const margin = typeof data?.profitMargin === 'number' && data.profitMargin > 0 ? data.profitMargin : DEFAULT_PROFIT_MARGIN;
      cachedProfitMargin = { value: margin, expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS };
      return margin;
    }
    const profitDocRef = doc(db, SETTINGS_COLLECTION, PROFIT_DOC_ID);
    const docSnap = await getDoc(profitDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as any;
      const margin = typeof data.profitMargin === 'number' && data.profitMargin > 0 ? data.profitMargin : DEFAULT_PROFIT_MARGIN;
      cachedProfitMargin = { value: margin, expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS };
      return margin;
    }
    cachedProfitMargin = { value: DEFAULT_PROFIT_MARGIN, expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS };
    return DEFAULT_PROFIT_MARGIN;
  } catch (error) {
    console.error("Error fetching profit margin:", error);
    return cachedProfitMargin?.value ?? DEFAULT_PROFIT_MARGIN;
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
    cachedProfitMargin = { value: margin, expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS };
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
  companyName: 'BORARLY',
  email: 'ventas@borarly.com',
  phone: '+52 1 999 904 0931',
  beneficiary: 'BORARLY',
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
      const rawCompany = String(data.companyName || '');
      const rawEmail = String(data.email || '');
      const rawBeneficiary = String(data.beneficiary || '');

      const isLegacyCompany = !rawCompany || !rawCompany.toLowerCase().includes('borarly');
      const isLegacyEmail = !rawEmail || !rawEmail.toLowerCase().includes('borarly.com');
      const isLegacyBeneficiary = !rawBeneficiary || /borar\s*tech/i.test(rawBeneficiary);

      const companyName = isLegacyCompany ? BANK_DETAILS_DEFAULTS.companyName : rawCompany;
      const email = isLegacyEmail ? BANK_DETAILS_DEFAULTS.email : rawEmail;
      const beneficiary = isLegacyBeneficiary ? BANK_DETAILS_DEFAULTS.beneficiary : rawBeneficiary;

      const resolved: BankDetails = {
        companyName,
        email,
        phone: data.phone || BANK_DETAILS_DEFAULTS.phone,
        beneficiary,
        clabe: data.clabe || BANK_DETAILS_DEFAULTS.clabe,
        bank: data.bank || BANK_DETAILS_DEFAULTS.bank,
      };

      if (isLegacyCompany || isLegacyEmail || isLegacyBeneficiary) {
        setDoc(brandingDocRef, resolved, { merge: true }).catch(() => {});
      }

      return resolved;
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
