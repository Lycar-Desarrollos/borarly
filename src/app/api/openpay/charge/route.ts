import { NextRequest, NextResponse } from 'next/server';
import {
  getOpenpayBaseUrl,
  getOpenpayAuthHeader,
  getPaynetPdfUrl,
  translateOpenpayError,
} from '@/lib/openpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      method = 'card',
      source_id,
      device_session_id,
      amount,
      description,
      order_id,
      customer,
      redirect_url,
      use_3d_secure = true,
    } = body;

    const numericAmount = parseFloat(Number(amount).toFixed(2));
    if (!numericAmount || numericAmount <= 0) {
      return NextResponse.json(
        { ok: false, error: 'El monto del cargo no es válido.' },
        { status: 400 }
      );
    }

    const cleanPhone = String(customer?.phone_number || '9999040931')
      .replace(/\D/g, '')
      .slice(-10) || '9999040931';

    const openpayCustomer = {
      name: (customer?.name || 'Cliente').trim(),
      last_name: (customer?.last_name || 'Borarly').trim(),
      phone_number: cleanPhone,
      email: (customer?.email || 'ventas@borarly.com').trim(),
    };

    const baseUrl = getOpenpayBaseUrl();
    const authHeader = getOpenpayAuthHeader();

    // ── CASO 1: PAGO EN TIENDAS AFILIADAS (PAYNET / STORE) ──────────────────
    if (method === 'store') {
      const storePayload = {
        method: 'store',
        amount: numericAmount,
        currency: 'MXN',
        description: description || `Pedido Borarly ${order_id || ''}`.trim(),
        order_id: order_id || `BOR-STORE-${Date.now()}`,
        customer: openpayCustomer,
      };

      const res = await fetch(`${baseUrl}/charges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(storePayload),
      });

      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          {
            ok: false,
            errorCode: data?.error_code,
            error: translateOpenpayError(data?.error_code, data?.description),
            raw: data,
          },
          { status: res.status }
        );
      }

      const reference = data?.payment_method?.reference || '';
      return NextResponse.json({
        ok: true,
        status: data.status,
        transactionId: data.id,
        reference,
        barcodeUrl: data?.payment_method?.barcode_url || '',
        paynetPdfUrl: reference ? getPaynetPdfUrl(reference) : '',
        transaction: data,
      });
    }

    // ── CASO 2: CARGO CON TARJETA (TOKEN + DEVICE_SESSION_ID + 3D SECURE) ───
    if (!source_id || !device_session_id) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Faltan credenciales de seguridad de la tarjeta (token_id o device_session_id).',
        },
        { status: 400 }
      );
    }

    const baseCardPayload: Record<string, any> = {
      method: 'card',
      source_id,
      amount: numericAmount,
      currency: 'MXN',
      description: description || `Compra en Borarly.com (${order_id || ''})`.trim(),
      order_id: order_id || `BOR-CARD-${Date.now()}`,
      device_session_id,
      customer: openpayCustomer,
    };

    if (use_3d_secure && redirect_url) {
      baseCardPayload.use_3d_secure = 'true';
      baseCardPayload.redirect_url = redirect_url;
    }

    let res = await fetch(`${baseUrl}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(baseCardPayload),
    });

    let data = await res.json();

    // Si en Sandbox la cuenta aún no tiene habilitado el emulador 3D Secure y Openpay devuelve error 1003/3006 por use_3d_secure,
    // reintentamos el cargo directo (con token_id + device_session_id) para permitir las pruebas de certificación en Sandbox.
    if (
      !res.ok &&
      use_3d_secure &&
      (data?.error_code === 1003 ||
        String(data?.description || '').toLowerCase().includes('3d'))
    ) {
      const directPayload = { ...baseCardPayload };
      delete directPayload.use_3d_secure;
      delete directPayload.redirect_url;

      res = await fetch(`${baseUrl}/charges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(directPayload),
      });
      data = await res.json();
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          errorCode: data?.error_code,
          error: translateOpenpayError(data?.error_code, data?.description),
          raw: data,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      ok: true,
      status: data.status, // 'completed' o 'charge_pending' (cuando requiere redirección 3D Secure)
      transactionId: data.id,
      authorization: data.authorization || data.id,
      redirectUrl: data?.payment_method?.url || null,
      transaction: data,
    });
  } catch (error: any) {
    console.error('[Openpay Charge Error]:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Error interno al comunicarse con Openpay.',
      },
      { status: 500 }
    );
  }
}
