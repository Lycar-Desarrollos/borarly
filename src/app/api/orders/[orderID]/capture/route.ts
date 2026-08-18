
import { NextRequest, NextResponse } from 'next/server';
import paypal from '@paypal/checkout-server-sdk';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

function getPayPalClient() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    return null;
  }
  const environment = process.env.PAYPAL_ENV === 'live'
    ? new paypal.core.LiveEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
    : new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
  return new paypal.core.PayPalHttpClient(environment);
}

// POST /api/orders/[orderID]/capture
// Captura el pago para una orden de PayPal existente
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ orderID: string }> }
) {
    const { orderID } = await params;

    if (!orderID) {
        return NextResponse.json({ error: "Missing orderID" }, { status: 400 });
    }

    const client = getPayPalClient();
    if (!client) {
        console.error("PayPal no esta configurado: faltan PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET.");
        return NextResponse.json({ error: "El pago con PayPal no esta disponible en este momento." }, { status: 503 });
    }

    try {
        const captureRequest = new paypal.orders.OrdersCaptureRequest(orderID);
        captureRequest.requestBody({});

        const response = await client.execute(captureRequest);

        return NextResponse.json(response.result, { status: response.statusCode });

    } catch (error: any) {
        console.error("Failed to capture PayPal order:", error);
        return NextResponse.json({ error: "No se pudo confirmar el pago. Si el cargo aparece en tu cuenta, contacta a soporte." }, { status: 502 });
    }
}
