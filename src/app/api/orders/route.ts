
import { NextRequest, NextResponse } from 'next/server';
import paypal from '@paypal/checkout-server-sdk';
import type { CartItem } from '@/lib/types';
import { getShippingSettings } from '@/services/settingsService';
import { getProductById } from '@/services/productService';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Tolerancia de redondeo (centavos) al comparar el precio del cliente contra el del catalogo.
const PRICE_TOLERANCE = 0.5;

function getPayPalClient() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    return null;
  }
  const environment = process.env.PAYPAL_ENV === 'live'
    ? new paypal.core.LiveEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
    : new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
  return new paypal.core.PayPalHttpClient(environment);
}

interface PricedLine {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

/**
 * Revalida cada linea del carrito contra el catalogo (fuente de verdad) para que
 * el importe cobrado nunca dependa del precio enviado por el navegador.
 */
async function priceCartOnServer(
  cart: CartItem[]
): Promise<{ lines: PricedLine[]; error: null } | { lines: null; error: string }> {
  const results = await Promise.all(
    cart.map(async (item): Promise<{ line: PricedLine; error: null } | { line: null; error: string }> => {
      const quantity = Math.floor(Number(item?.quantity));
      if (!item?.id || !Number.isFinite(quantity) || quantity < 1) {
        return { line: null, error: `Cantidad invalida para el producto "${item?.name || item?.id}".` };
      }

      const catalogProduct = await getProductById(String(item.id));
      if (!catalogProduct || !Number.isFinite(catalogProduct.price) || catalogProduct.price <= 0) {
        return { line: null, error: `No pudimos confirmar el precio vigente de "${item.name || item.id}". Actualiza tu carrito e intenta de nuevo.` };
      }

      if (Math.abs(catalogProduct.price - Number(item.price)) > PRICE_TOLERANCE) {
        return { line: null, error: `El precio de "${catalogProduct.name}" cambio. Vuelve a cargar tu carrito para continuar.` };
      }

      return {
        line: {
          id: String(item.id),
          name: catalogProduct.name || item.name,
          unitPrice: catalogProduct.price,
          quantity,
        },
        error: null,
      };
    })
  );

  const failed = results.find((r) => r.error !== null);
  if (failed && failed.error) {
    return { lines: null, error: failed.error };
  }

  return { lines: results.map((r) => r.line as PricedLine), error: null };
}

// POST /api/orders
// Crea una nueva orden de PayPal
export async function POST(request: NextRequest) {
    const client = getPayPalClient();
    if (!client) {
        console.error("PayPal no esta configurado: faltan PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET.");
        return NextResponse.json({ error: "El pago con PayPal no esta disponible en este momento." }, { status: 503 });
    }

    try {
        const { cart, shippingCost: initialShippingCost, payerDetails }: { cart: CartItem[], shippingCost: number | null, payerDetails?: any } = await request.json();

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return NextResponse.json({ error: "El carrito está vacío o tiene un formato incorrecto." }, { status: 400 });
        }

        // Los precios se recalculan contra el catálogo: nunca se confía en el importe del cliente.
        const priced = await priceCartOnServer(cart);
        if (priced.error !== null) {
            return NextResponse.json({ error: priced.error }, { status: 409 });
        }
        const lines = priced.lines;

        const subtotal = lines.reduce((acc, line) => acc + line.unitPrice * line.quantity, 0);

        // Recalculate shipping on the server
        let finalShippingCost = 0;
        if (initialShippingCost !== null) {
            const settings = await getShippingSettings();
            finalShippingCost = settings.cost;
            // Para que el envío sea gratis, el umbral debe ser mayor a 0 y el carrito superarlo
            if (settings.freeShippingThreshold !== null && settings.freeShippingThreshold !== undefined && settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold) {
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
                    items: lines.map(line => ({
                        name: line.name.substring(0, 127), // Max length 127
                        unit_amount: {
                            currency_code: "MXN",
                            value: line.unitPrice.toFixed(2),
                        },
                        quantity: String(line.quantity),
                        sku: line.id.substring(0, 127),
                    })),
                },
            ],
            application_context: {
                shipping_preference: "SET_PROVIDED_ADDRESS",
                user_action: "PAY_NOW"
            }
        };
        const text = (value: unknown, max: number) => String(value ?? '').substring(0, max);
        const hasShippingAddress = Boolean(payerDetails?.street && payerDetails?.city && payerDetails?.zip);

        // PayPal rechaza SET_PROVIDED_ADDRESS si no se envia una direccion completa.
        requestBody.application_context.shipping_preference = hasShippingAddress ? "SET_PROVIDED_ADDRESS" : "GET_FROM_FILE";

        if (payerDetails) {
            requestBody.payer = {
                name: {
                    given_name: text(payerDetails.firstName, 140),
                    surname: text(payerDetails.lastName, 140)
                },
                email_address: text(payerDetails.contactEmail, 254),
                address: {
                     address_line_1: text(payerDetails.street, 300),
                     admin_area_2: text(payerDetails.city, 120),
                     admin_area_1: text(payerDetails.state || payerDetails.city, 300),
                     postal_code: text(payerDetails.zip, 60),
                     country_code: "MX"
                }
            };
            
            // Add Phone if available
            if (payerDetails.phone) {
                // Ensure phone only contains digits
                const cleanPhone = String(payerDetails.phone).replace(/\D/g, '');
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
            if (hasShippingAddress) {
                requestBody.purchase_units[0].shipping = {
                     name: { full_name: text(`${payerDetails.firstName ?? ''} ${payerDetails.lastName ?? ''}`.trim(), 290) },
                     address: {
                         address_line_1: text(payerDetails.street, 300),
                         admin_area_2: text(payerDetails.city, 120),
                         admin_area_1: text(payerDetails.state || payerDetails.city, 300),
                         postal_code: text(payerDetails.zip, 60),
                         country_code: "MX"
                     }
                };
            }
        }

        paypalRequest.requestBody(requestBody);

        const response = await client.execute(paypalRequest);
        
        return NextResponse.json(response.result, { status: response.statusCode });

    } catch (error: any) {
        console.error("Failed to create PayPal order:", error);
        return NextResponse.json({ error: "No se pudo crear la orden de pago. Intenta de nuevo." }, { status: 502 });
    }
}
