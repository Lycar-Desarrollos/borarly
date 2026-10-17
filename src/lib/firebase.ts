
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

// IMPORTANT: The values are read from environment variables with safe fallbacks for public Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAilCeIBVIg-v1pZvaxA7i4RS-skrQFpl8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ecommercepesca-305ce.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://ecommercepesca-305ce-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ecommercepesca-305ce",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ecommercepesca-305ce.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "829522450550",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:829522450550:web:824aeac67a2b259f8ee757",
};


let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

function parseFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    return Array.isArray(val.arrayValue?.values)
      ? val.arrayValue.values.map(parseFirestoreValue)
      : [];
  }
  if ('mapValue' in val) {
    return parseFirestoreFields(val.mapValue?.fields || {});
  }
  return val;
}

export function parseFirestoreFields(fields: Record<string, any> = {}): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    result[k] = parseFirestoreValue(v);
  }
  return result;
}

const restCache: Record<string, { data: Record<string, Record<string, any>>; expiresAt: number }> = {};

/**
 * Fetches an entire Firestore collection via the lightweight REST API (server-safe for Cloudflare Workers,
 * avoiding @grpc/grpc-js / node:http2 crashes in workerd). Cached in memory for 5 minutes.
 */
export async function fetchFirestoreCollectionRest(
  collectionName: string,
  ttlMs = 300000
): Promise<Record<string, Record<string, any>>> {
  const cached = restCache[collectionName];
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  try {
    const projectId = firebaseConfig.projectId || 'ecommercepesca-305ce';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}?pageSize=300`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return cached?.data || {};
    const json = await res.json();
    const docs: Record<string, Record<string, any>> = {};
    if (Array.isArray(json.documents)) {
      for (const docItem of json.documents) {
        const nameParts = String(docItem.name || '').split('/');
        const id = nameParts[nameParts.length - 1];
        if (id) {
          docs[id] = parseFirestoreFields(docItem.fields || {});
        }
      }
    }
    restCache[collectionName] = { data: docs, expiresAt: Date.now() + ttlMs };
    return docs;
  } catch (error) {
    console.warn(`Firestore REST fallback error for ${collectionName}:`, error);
    return cached?.data || {};
  }
}

export { app, auth, db, storage };

