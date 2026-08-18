import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const IDENTITY_TOOLKIT_LOOKUP = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';

interface VerifiedUser {
  uid: string;
  email: string | null;
}

function adminEmailAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Valida el ID token de Firebase contra Identity Toolkit. Se usa la API REST para no
 * añadir la dependencia de firebase-admin: si el token es invalido o expiro, Google responde error.
 */
async function verifyIdToken(idToken: string): Promise<VerifiedUser | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    console.error('No se puede verificar el token: falta NEXT_PUBLIC_FIREBASE_API_KEY.');
    return null;
  }

  try {
    const res = await fetch(`${IDENTITY_TOOLKIT_LOOKUP}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = await res.json();
    const user = data?.users?.[0];
    if (!user?.localId) return null;

    return { uid: String(user.localId), email: user.email ? String(user.email).toLowerCase() : null };
  } catch (error) {
    console.error('Fallo la verificacion del ID token de Firebase:', error);
    return null;
  }
}

async function hasAdminRole(user: VerifiedUser): Promise<boolean> {
  const allowlist = adminEmailAllowlist();
  if (user.email && allowlist.includes(user.email)) {
    return true;
  }

  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    return snap.exists() && (snap.data() as { role?: string }).role === 'admin';
  } catch (error) {
    console.error('No se pudo leer el rol del usuario para autorizar la peticion:', error);
    return false;
  }
}

/**
 * Protege endpoints de administracion. Devuelve `null` cuando la peticion esta autorizada,
 * o la respuesta de error que debe retornarse al cliente.
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization') || '';
  const idToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';

  if (!idToken) {
    return NextResponse.json({ error: 'Sesion requerida. Inicia sesion como administrador.' }, { status: 401 });
  }

  const user = await verifyIdToken(idToken);
  if (!user) {
    return NextResponse.json({ error: 'Sesion invalida o expirada. Vuelve a iniciar sesion.' }, { status: 401 });
  }

  if (!(await hasAdminRole(user))) {
    return NextResponse.json({ error: 'No tienes permisos de administrador para esta operacion.' }, { status: 403 });
  }

  return null;
}
