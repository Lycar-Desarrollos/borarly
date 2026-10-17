// Traduce los códigos de error de Firebase Auth a mensajes claros en español.
export function authErrorMessage(err: any): string {
  const code: string = err?.code || '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'No existe una cuenta con este correo.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/email-already-in-use': 'Ya existe una cuenta con este correo. Inicia sesión.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
    'auth/network-request-failed': 'Sin conexión. Revisa tu internet e inténtalo de nuevo.',
    'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de terminar.',
    'auth/cancelled-popup-request': 'Se cerró la ventana de Google antes de terminar.',
    'auth/popup-blocked': 'Tu navegador bloqueó la ventana de Google. Permite ventanas emergentes.',
    'auth/user-disabled': 'Esta cuenta está deshabilitada. Contáctanos para ayudarte.',
    'auth/missing-email': 'Escribe tu correo electrónico.',
    'auth/unauthorized-domain': 'Este dominio aún no está autorizado en Firebase Authentication (agrégalo en Firebase Console → Authentication → Settings → Dominios autorizados).',
    'auth/invalid-api-key': 'Error de configuración de API Key de Firebase.',
  };
  return map[code] || `Ocurrió un error (${code || 'desconocido'}). Inténtalo de nuevo.`;
}

/** Solo permite redirecciones internas para evitar open-redirects. */
export function safeRedirect(url: string | null | undefined): string {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return '/';
  return url;
}
