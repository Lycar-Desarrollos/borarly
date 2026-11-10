import { NextRequest, NextResponse } from 'next/server';
import {
  getOpenpayBaseUrl,
  getOpenpayAuthHeader,
  translateOpenpayError,
} from '@/lib/openpay';

/**
 * Verifica directamente ante Openpay el estado de una transacción
 * (por ejemplo, al regresar del flujo de autenticación bancaria 3D Secure).
 */
export async function GET(req: NextRequest) {
  const transactionId = req.nextUrl.searchParams.get('id');
  if (!transactionId) {
    return NextResponse.json(
      { ok: false, error: 'Falta el ID de la transacción de Openpay.' },
      { status: 400 }
    );
  }

  try {
    const baseUrl = getOpenpayBaseUrl();
    const authHeader = getOpenpayAuthHeader();

    const res = await fetch(
      `${baseUrl}/charges/${encodeURIComponent(transactionId)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: authHeader,
        },
        cache: 'no-store',
      }
    );

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

    const isCompleted = data.status === 'completed';
    const isFailed =
      data.status === 'failed' ||
      data.status === 'cancelled' ||
      Boolean(data.error_message);

    return NextResponse.json({
      ok: true,
      completed: isCompleted,
      failed: isFailed,
      status: data.status,
      transactionId: data.id,
      authorization: data.authorization || data.id,
      orderId: data.order_id,
      errorMessage: data.error_message
        ? translateOpenpayError(data?.error_code, data.error_message)
        : null,
      transaction: data,
    });
  } catch (error: any) {
    console.error('[Openpay Verify Error]:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'No se pudo verificar la transacción en Openpay.',
      },
      { status: 500 }
    );
  }
}
