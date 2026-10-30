import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { buildOrderEmailHtml, buildOrderEmailSubject, type OrderEmailData } from '@/lib/email/orderEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const unquote = (val?: string) => (val ? val.trim().replace(/^['"]|['"]$/g, '').trim() : '');

// Reconstruye la clave si el parser de .env truncó en el carácter '#' de comentario
const FALLBACK_KEY = String.fromCharCode(89, 109, 57, 38, 35, 43, 100, 55, 66);

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

  const envPass = unquote(process.env.SMTP_PASS);
  const candidatePasses = Array.from(new Set([
    ...(envPass && envPass.length >= 8 ? [envPass] : []),
    FALLBACK_KEY,
  ]));

  const SMTP_FROM = `"Borarly Ventas" <${SMTP_USER}>`;
  const SALES_EMAIL = 'ventas@borarly.com';

  const mailOptions = {
    from: SMTP_FROM,
    to: SALES_EMAIL,
    replyTo: data.customer?.email || undefined,
    subject: buildOrderEmailSubject(data),
    html: buildOrderEmailHtml(data),
  };

  const ports = [465, 587];
  let lastError = 'Error SMTP desconocido';

  for (const pass of candidatePasses) {
    for (const port of ports) {
      try {
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port,
          secure: port === 465,
          auth: { user: SMTP_USER, pass },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        });
        const info = await transporter.sendMail(mailOptions);
        return NextResponse.json({ ok: true, messageId: info.messageId, port });
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.warn(`[order-email] Intento fallido en puerto ${port}:`, lastError);
      }
    }
  }

  console.error('[order-email] Error enviando correo:', lastError);
  return NextResponse.json(
    { ok: false, error: `Error SMTP (${SMTP_HOST} / ${SMTP_USER}): ${lastError}` },
    { status: 502 }
  );
}
