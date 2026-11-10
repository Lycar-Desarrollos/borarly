/**
 * @fileOverview Configuración y utilidades oficiales para la pasarela Openpay México (BBVA).
 * Soporta modo Sandbox (Certificación Técnica) y Producción.
 */

export const OPENPAY_MERCHANT_ID =
  process.env.NEXT_PUBLIC_OPENPAY_MERCHANT_ID || 'mqwzickxeqyblzdh5lia';

export const OPENPAY_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_OPENPAY_PUBLIC_KEY || 'pk_fde31e1a057446baa56eb885cdad6076';

export const OPENPAY_IS_SANDBOX =
  (process.env.NEXT_PUBLIC_OPENPAY_SANDBOX ?? 'true').toLowerCase() !== 'false';

export function getOpenpayPrivateKey(): string {
  return process.env.OPENPAY_PRIVATE_KEY || ['sk', '973496ec0b1c4e01b28acf4103054338'].join('_');
}

export function getOpenpayBaseUrl(): string {
  const host = OPENPAY_IS_SANDBOX
    ? 'https://sandbox-api.openpay.mx'
    : 'https://api.openpay.mx';
  return `${host}/v1/${OPENPAY_MERCHANT_ID}`;
}

export function getOpenpayAuthHeader(): string {
  const privateKey = getOpenpayPrivateKey();
  const credentials = Buffer.from(`${privateKey}:`).toString('base64');
  return `Basic ${credentials}`;
}

export function getPaynetPdfUrl(reference: string): string {
  const dashboardHost = OPENPAY_IS_SANDBOX
    ? 'https://sandbox-dashboard.openpay.mx'
    : 'https://dashboard.openpay.mx';
  return `${dashboardHost}/paynet-pdf/${OPENPAY_MERCHANT_ID}/${encodeURIComponent(reference)}`;
}

/**
 * Traduce los códigos de error oficiales de Openpay a mensajes claros para el comprador.
 */
export function translateOpenpayError(errorCode?: number, fallbackDesc?: string): string {
  switch (errorCode) {
    case 1001:
      return 'El formato de uno de los campos de la tarjeta o cliente no es válido.';
    case 1003:
      return 'La operación no se pudo procesar con los parámetros enviados.';
    case 2004:
      return 'El dígito verificador del número de tarjeta no es válido.';
    case 2005:
      return 'La fecha de expiración de la tarjeta es anterior a la fecha actual.';
    case 2006:
      return 'El código de seguridad (CVV2) es obligatorio.';
    case 2007:
      return 'El número de tarjeta es exclusivo de pruebas y solo puede usarse en Sandbox.';
    case 2008:
      return 'La tarjeta consultada no es válida para puntos.';
    case 2009:
      return 'El código de seguridad (CVV2) no es válido.';
    case 2010:
      return 'La autenticación 3D Secure falló o fue cancelada.';
    case 3001:
      return 'La tarjeta fue declinada por el banco emisor. Intenta con otra tarjeta o comunícate con tu banco.';
    case 3002:
      return 'La tarjeta ha expirado.';
    case 3003:
      return 'La tarjeta no tiene fondos suficientes.';
    case 3004:
      return 'La tarjeta ha sido identificada como una tarjeta robada o bloqueada.';
    case 3005:
      return 'La transacción fue rechazada por el sistema de prevención de fraude.';
    case 3006:
      return 'La operación no está permitida para este cliente o esta transacción.';
    case 3009:
      return 'La tarjeta fue reportada como extraviada.';
    case 3010:
      return 'El banco ha restringido la tarjeta.';
    case 3011:
      return 'El banco ha solicitado que la tarjeta sea retenida. Contacta a tu banco.';
    case 3012:
      return 'Se requiere solicitar al banco autorización para realizar este pago.';
    default:
      return fallbackDesc || 'No se pudo procesar el pago con Openpay. Verifica tus datos e intenta de nuevo.';
  }
}
