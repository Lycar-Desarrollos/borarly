import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook receptor de eventos de Openpay (https://borarly.com/api/openpay/webhook).
 * Soporta:
 * - Evento "verification": registra y devuelve el código de verificación al dar de alta el Webhook en Openpay.
 * - Eventos "charge.succeeded", "charge.failed", "charge.cancelled", "payout.succeeded".
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const eventType = payload?.type;

    if (eventType === 'verification') {
      console.log(
        '[Openpay Webhook Verification Code]:',
        payload?.verification_code
      );
      return NextResponse.json(
        {
          ok: true,
          type: 'verification',
          verification_code: payload?.verification_code,
        },
        { status: 200 }
      );
    }

    console.log('[Openpay Webhook Event]:', {
      type: eventType,
      transactionId: payload?.transaction?.id,
      orderId: payload?.transaction?.order_id,
      status: payload?.transaction?.status,
      amount: payload?.transaction?.amount,
    });

    return NextResponse.json({ ok: true, received: eventType }, { status: 200 });
  } catch (error: any) {
    console.error('[Openpay Webhook Error]:', error);
    // Responder 200 evita reintentos innecesarios ante payloads malformados
    return NextResponse.json(
      { ok: false, error: error?.message || 'Invalid payload' },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'Borarly Openpay Webhook Endpoint',
  });
}
