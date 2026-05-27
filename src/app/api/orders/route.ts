
import { NextRequest, NextResponse } from 'next/server';
import paypal from '@paypal/checkout-server-sdk';
import type { CartItem } from '@/lib/types';
import { getShippingSettings } from '@/services/settingsService';

const environment = process.env.PAYPAL_ENV === 'live'
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID || 'dummy', process.env.PAYPAL_CLIENT_SECRET || 'dummy')
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID || 'dummy', process.env.PAYPAL_CLIENT_SECRET || 'dummy');

const client = new paypal.core.PayPalHttpClient(environment);


// POST /api/orders
// Crea una nueva orden de PayPal
export async function POST(request: NextRequest) {
    try {
        const { cart, shippingCost: initialShippingCost, payerDetails }: { cart: CartItem[], shippingCost: number | null, payerDetails?: any } = await request.json();

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return NextResponse.json({ error: "El carrito está vacío o tiene un formato incorrecto." }, { status: 400 });
        }
        
        // Recalculate subtotal on the server to prevent manipulation
        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

        // Recalculate shipping on the server
        let finalShippingCost = 0;
        if (initialShippingCost !== null) {
            const settings = await getShippingSettings();
            finalShippingCost = settings.cost;
            // Para que el envío sea gratis, el umbral debe ser mayor a 0 y el carrito superarlo
            if (settings.freeShippingThreshold !== null && settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold) {
                finalShippingCost = 0;
            }
        } else {
             return NextResponse.json({ error: "No se pudo determinar el costo de envío." }, { status: 400 });
        }


        const total = subtotal + finalShippingCost;

        const paypalRequest = new paypal.orders.OrdersCreateRequest();
        paypalRequest.prefer("return=representation");
        
        const requestBody: any = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "MXN",
                        value: total.toFixed(2),
                        breakdown: {
                            item_total: {
                                currency_code: "MXN",
                                value: subtotal.toFixed(2),
                            },
                            shipping: {
                                currency_code: "MXN",
                                value: finalShippingCost.toFixed(2),
                            }
                        },
                    },
                    items: cart.map(item => ({
                        name: item.name.substring(0, 127), // Max length 127
                        unit_amount: {
                            currency_code: "MXN",
                            value: item.price.toFixed(2),
                        },
                        quantity: String(item.quantity),
                        sku: item.id.substring(0, 127),
                    })),
                },
            ],
            application_context: {
                shipping_preference: "SET_PROVIDED_ADDRESS",
                user_action: "PAY_NOW"
            }
        };

        if (payerDetails) {
            requestBody.payer = {
                name: {
                    given_name: payerDetails.firstName.substring(0, 140),
                    surname: payerDetails.lastName.substring(0, 140)
                },
                email_address: payerDetails.contactEmail.substring(0, 254),
                address: {
                     address_line_1: payerDetails.street.substring(0, 300),
                     admin_area_2: payerDetails.city.substring(0, 120),
                     admin_area_1: (payerDetails.state || payerDetails.city).substring(0, 300),
                     postal_code: payerDetails.zip.substring(0, 60),
                     country_code: "MX"
                }
            };
            
            // Add Phone if available
            if (payerDetails.phone) {
                // Ensure phone only contains digits
                const cleanPhone = payerDetails.phone.replace(/\D/g, '');
                if (cleanPhone.length >= 10) {
                    requestBody.payer.phone = {
                        phone_type: "MOBILE",
                        phone_number: {
                            national_number: cleanPhone.substring(cleanPhone.length - 10)
                        }
                    };
                }
            }
            
            // Add Shipping Address explicitly in purchase_units
            requestBody.purchase_units[0].shipping = {
                 name: { full_name: `${payerDetails.firstName} ${payerDetails.lastName}`.substring(0, 290) },
                 address: {
                     address_line_1: payerDetails.street.substring(0, 300),
                     admin_area_2: payerDetails.city.substring(0, 120),
                     admin_area_1: (payerDetails.state || payerDetails.city).substring(0, 300),
                     postal_code: payerDetails.zip.substring(0, 60),
                     country_code: "MX"
                 }
            };
        }

        paypalRequest.requestBody(requestBody);

        const response = await client.execute(paypalRequest);
        
        return NextResponse.json(response.result, { status: response.statusCode });

    } catch (error: any) {
        console.error("Failed to create PayPal order:", error);
         if (error.statusCode) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
    }
}
