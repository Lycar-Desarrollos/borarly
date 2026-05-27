
import { NextRequest, NextResponse } from 'next/server';
import paypal from '@paypal/checkout-server-sdk';

const environment = process.env.PAYPAL_ENV === 'live'
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID || 'dummy', process.env.PAYPAL_CLIENT_SECRET || 'dummy')
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID || 'dummy', process.env.PAYPAL_CLIENT_SECRET || 'dummy');

const client = new paypal.core.PayPalHttpClient(environment);


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

    try {
        const captureRequest = new paypal.orders.OrdersCaptureRequest(orderID);
        captureRequest.requestBody({});

        const response = await client.execute(captureRequest);

        return NextResponse.json(response.result, { status: response.statusCode });

    } catch (error: any) {
        console.error("Failed to capture PayPal order:", error);
        if (error.statusCode) {
             return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ error: "Failed to capture order." }, { status: 500 });
    }
}
