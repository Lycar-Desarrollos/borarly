"use client";

import { useState, useEffect, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { authErrorMessage, safeRedirect } from '@/lib/authErrors';
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { GoogleButton, OrDivider } from '@/components/auth/GoogleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, KeyRound, Eye, EyeOff, ShoppingBag, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectUrl = safeRedirect(searchParams.get('redirect'));
  const fromCheckout = redirectUrl.includes('checkout') || redirectUrl.includes('cart');
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<'email' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // Si ya tiene sesión, no tiene sentido mostrar el login
  useEffect(() => {
    if (!authLoading && currentUser) router.replace(redirectUrl);
  }, [authLoading, currentUser, redirectUrl, router]);

  const signupHref = `/signup${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading('email');
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast({ title: '¡Bienvenido de vuelta!' });
      router.push(redirectUrl);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setLoading('google');
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      toast({ title: '¡Bienvenido!' });
      router.push(redirectUrl);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setLoading('email');
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err: any) {
      // Por seguridad no revelamos si el correo existe o no
      if (err?.code === 'auth/user-not-found') setResetSent(true);
      else setError(authErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md md:max-w-none grid md:grid-cols-2 overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-black/5">
      <AuthBrandPanel variant="login" />

      <div className="p-6 sm:p-10 flex flex-col justify-center">
        {/* Logo en móvil (el panel lateral se oculta) */}
        <Image src="/logo.png" alt="BORARLY" width={150} height={38} className="md:hidden h-8 w-auto mb-6" />

        {mode === 'login' ? (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Iniciar sesión</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {fromCheckout ? 'Inicia sesión para terminar tu compra.' : 'Ingresa a tu cuenta de Borarly.'}
            </p>

            {fromCheckout && (
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
                <ShoppingBag className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                Tu carrito está guardado. Al entrar continúas directo al pago.
              </div>
            )}

            <div className="mt-6">
              <GoogleButton onClick={handleGoogle} disabled={!!loading} loading={loading === 'google'} />
            </div>

            <OrDivider text="o con tu correo" />

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" autoComplete="email" inputMode="email" placeholder="tu@empresa.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 pl-10" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <button type="button" onClick={() => { setMode('reset'); setError(null); setResetSent(false); }}
                    className="text-xs font-semibold text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pl-10 pr-11" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
                </div>
              )}

              <Button type="submit" disabled={!!loading || !email || !password} className="w-full h-11 text-sm font-semibold">
                {loading === 'email' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {fromCheckout ? 'Iniciar sesión y continuar' : 'Iniciar sesión'}
              </Button>
            </form>

            <div className="mt-6 rounded-lg bg-muted/60 p-4 text-center text-sm">
              <span className="text-muted-foreground">¿Aún no tienes cuenta? </span>
              <Link href={signupHref} className="font-semibold text-primary hover:underline">Crear cuenta gratis</Link>
            </div>
          </>
        ) : (
          <>
            <button type="button" onClick={() => { setMode('login'); setError(null); }}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground self-start">
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Recuperar contraseña</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Te enviaremos un enlace para crear una nueva contraseña.</p>

            {resetSent ? (
              <div className="mt-6 flex items-start gap-3 rounded-lg border border-green-600/30 bg-green-600/10 p-4 text-sm text-foreground">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                <div>
                  Si existe una cuenta con <strong>{email}</strong>, recibirás un correo en unos minutos. Revisa también tu carpeta de spam.
                </div>
              </div>
            ) : (
              <form onSubmit={handleReset} className="mt-6 space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="reset-email" type="email" autoComplete="email" placeholder="tu@empresa.com"
                      value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 pl-10" />
                  </div>
                </div>
                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
                  </div>
                )}
                <Button type="submit" disabled={!!loading || !email} className="w-full h-11 text-sm font-semibold">
                  {loading === 'email' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar enlace
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
