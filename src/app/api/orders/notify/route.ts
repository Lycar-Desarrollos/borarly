import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { buildOrderEmailHtml, buildOrderEmailSubject, type OrderEmailData } from '@/lib/email/orderEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const unquote = (val?: string) => (val ? val.trim().replace(/^['"]|['"]$/g, '').trim() : '');

export async function POST(req: Request) {
  let data: OrderEmailData;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 });
  }
  if (!data?.reference || !Array.isArray(data.items) || data.items.length === 0 || data.items.length > 200) {
    return NextResponse.json({ ok: false, error: 'Datos de pedido incompletos' }, { status: 400 });
  }

  const rawHost = unquote(process.env.SMTP_HOST).replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  const SMTP_HOST = rawHost && rawHost.includes('.') ? rawHost : 'smtp.hostinger.com';

  const rawUser = unquote(process.env.SMTP_USER);
  const emailMatch = rawUser.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const SMTP_USER = emailMatch ? emailMatch[0] : 'ventas@borarly.com';

  const SMTP_PASS = unquote(process.env.SMTP_PASS);
  const SMTP_FROM = `"Borarly Ventas" <${SMTP_USER}>`;
  const SALES_EMAIL = 'ventas@borarly.com';

  if (!SMTP_PASS) {
    console.error('[order-email] Falta configurar SMTP_PASS en variables de entorno');
    return NextResponse.json(
      { ok: false, error: 'Falta configurar SMTP_PASS en Netlify ( haz Trigger Deploy después de guardarla )' },
      { status: 500 }
    );
  }

  const mailOptions = {
    from: SMTP_FROM,
    to: SALES_EMAIL,
    replyTo: data.customer?.email || undefined,
    subject: buildOrderEmailSubject(data),
    html: buildOrderEmailHtml(data),
  };

  // Intento 1: Puerto configurado (por defecto 465 SSL)
  const primaryPort = Number(unquote(process.env.SMTP_PORT) || 465) || 465;
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: primaryPort,
      secure: primaryPort === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json({ ok: true, messageId: info.messageId, port: primaryPort });
  } catch (errPrimary: any) {
    console.warn(`[order-email] Falló puerto ${primaryPort}, reintentando en 587 STARTTLS:`, errPrimary?.message);
    // Intento 2: Respaldo automático en puerto 587 (STARTTLS)
    const fallbackPort = primaryPort === 465 ? 587 : 465;
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: fallbackPort,
        secure: fallbackPort === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
      const info = await fallbackTransporter.sendMail(mailOptions);
      return NextResponse.json({ ok: true, messageId: info.messageId, port: fallbackPort });
    } catch (errFallback: any) {
      const detail = errFallback?.message || errPrimary?.message || 'Error SMTP desconocido';
      console.error('[order-email] Error enviando correo en ambos puertos:', detail);
      return NextResponse.json(
        { ok: false, error: `Error SMTP (${SMTP_HOST} / ${SMTP_USER}): ${detail}` },
        { status: 502 }
      );
    }
  }
}
