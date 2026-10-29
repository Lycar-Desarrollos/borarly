import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { buildOrderEmailHtml, buildOrderEmailSubject, type OrderEmailData } from '@/lib/email/orderEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const unquote = (val?: string) => (val ? val.trim().replace(/^['"]|['"]$/g, '') : '');

// Verifica el ID token de Firebase con la API REST (no requiere firebase-admin).
async function verifyFirebaseUser(idToken: string): Promise<{ uid: string; email?: string } | null> {
  const apiKey = unquote(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || 'AIzaSyAilCeIBVIg-v1pZvaxA7i4RS-skrQFpl8';
  if (!apiKey || !idToken) return null;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    const u = json?.users?.[0];
    return u ? { uid: u.localId, email: u.email } : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const user = await verifyFirebaseUser(idToken);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  let data: OrderEmailData;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 });
  }
  if (!data?.reference || !Array.isArray(data.items) || data.items.length === 0 || data.items.length > 200) {
    return NextResponse.json({ ok: false, error: 'Datos de pedido incompletos' }, { status: 400 });
  }

  const SMTP_HOST = unquote(process.env.SMTP_HOST) || 'smtp.hostinger.com';
  const SMTP_PORT = unquote(process.env.SMTP_PORT) || '465';
  const SMTP_USER = unquote(process.env.SMTP_USER) || 'ventas@borarly.com';
  const SMTP_PASS = unquote(process.env.SMTP_PASS);
  const SMTP_FROM = unquote(process.env.SMTP_FROM) || `"Borarly Ventas" <${SMTP_USER}>`;
  const SALES_EMAIL = unquote(process.env.SALES_NOTIFICATION_EMAIL) || 'ventas@borarly.com';

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('[order-email] Falta configurar SMTP_HOST / SMTP_USER / SMTP_PASS');
    return NextResponse.json({ ok: false, error: 'Correo no configurado' }, { status: 500 });
  }

  const port = Number(SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: SMTP_FROM || `"Borarly Ventas" <${SMTP_USER}>`,
      to: SALES_EMAIL,
      replyTo: data.customer?.email || undefined,
      subject: buildOrderEmailSubject(data),
      html: buildOrderEmailHtml(data),
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[order-email] Error enviando correo:', err?.message || err);
    return NextResponse.json({ ok: false, error: 'No se pudo enviar el correo' }, { status: 502 });
  }
}
