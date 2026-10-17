"use client";

import { useState, useEffect, useMemo, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { authErrorMessage, safeRedirect } from '@/lib/authErrors';
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { GoogleButton, OrDivider } from '@/components/auth/GoogleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, KeyRound, User, Phone, Building2, Eye, EyeOff, ShoppingBag, AlertCircle, Check } from 'lucide-react';

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'];
  const colors = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-600'];
  return { score, label: labels[score], color: colors[score] };
}

function SignupForm() {
  const searchParams = useSearchParams();
  const redirectUrl = safeRedirect(searchParams.get('redirect'));
  const fromCheckout = redirectUrl.includes('checkout') || redirectUrl.includes('cart');
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [loading, setLoading] = useState<'email' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    // Si ya tiene sesión (p. ej. tras registrarse con Google), continuar
    if (!authLoading && currentUser && !loading) router.replace(redirectUrl);
  }, [authLoading, currentUser, loading, redirectUrl, router]);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const phoneDigits = phone.replace(/\D/g, '');
  const errors = {
    firstName: !firstName.trim() ? 'Escribe tu nombre' : '',
    lastName: !lastName.trim() ? 'Escribe tus apellidos' : '',
    email: !/^\S+@\S+\.\S+$/.test(email.trim()) ? 'Correo no válido' : '',
    phone: phoneDigits.length !== 10 ? 'Debe tener 10 dígitos' : '',
    password: password.length < 8 ? 'Mínimo 8 caracteres' : '',
  };
  const isValid = Object.values(errors).every((e) => !e);
  const loginHref = `/login${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`;

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    setLoading('email');
    setError(null);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const displayName = `${firstName.trim()} ${lastName.trim()}`;
      await updateProfile(user, { displayName });

      const profile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName,
        photoURL: user.photoURL,
        role: 'customer',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phoneDigits,
        companyName: company.trim(),
        marketingOptIn,
        createdAt: new Date().toISOString(),
        address: { street: '', city: '', zip: '', country: 'México', phone: phoneDigits },
      };
      await setDoc(doc(db, 'users', user.uid), profile, { merge: true });

      toast({ title: '¡Cuenta creada!', description: `Bienvenido a Borarly, ${firstName.trim()}.` });
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
      toast({ title: '¡Bienvenido a Borarly!' });
      router.push(redirectUrl);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  const fieldError = (msg: string) =>
    touched && msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;
  const invalidCls = (msg: string) => (touched && msg ? 'border-destructive focus-visible:ring-destructive' : '');

  return (
    <div className="mx-auto w-full max-w-lg md:max-w-none grid md:grid-cols-[0.9fr_1.1fr] overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-black/5">
      <AuthBrandPanel variant="signup" />

      <div className="p-6 sm:p-10">
        <Image src="/logo.png" alt="BORARLY" width={150} height={38} className="md:hidden h-8 w-auto mb-6" />

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Crear cuenta</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {fromCheckout ? 'Un paso más y terminas tu compra.' : 'Regístrate gratis en menos de un minuto.'}
        </p>

        {fromCheckout && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
            <ShoppingBag className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            Tu carrito está guardado. Al crear tu cuenta continúas directo al pago.
          </div>
        )}

        <div className="mt-6">
          <GoogleButton onClick={handleGoogle} disabled={!!loading} loading={loading === 'google'} label="Registrarme con Google" />
        </div>

        <OrDivider text="o con tu correo" />

        <form onSubmit={handleSignup} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Nombre(s)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="firstName" autoComplete="given-name" placeholder="Juan" value={firstName}
                  onChange={(e) => setFirstName(e.target.value)} className={`h-11 pl-10 ${invalidCls(errors.firstName)}`} />
              </div>
              {fieldError(errors.firstName)}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Apellidos</Label>
              <Input id="lastName" autoComplete="family-name" placeholder="Pérez López" value={lastName}
                onChange={(e) => setLastName(e.target.value)} className={`h-11 ${invalidCls(errors.lastName)}`} />
              {fieldError(errors.lastName)}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="tu@empresa.com" value={email}
                onChange={(e) => setEmail(e.target.value)} className={`h-11 pl-10 ${invalidCls(errors.email)}`} />
            </div>
            {fieldError(errors.email)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono / WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="999 123 4567" maxLength={14}
                  value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                  className={`h-11 pl-10 ${invalidCls(errors.phone)}`} />
              </div>
              {fieldError(errors.phone) || <p className="text-xs text-muted-foreground">Para avisarte del envío.</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Empresa <span className="font-normal text-muted-foreground">(opcional)</span></Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="company" autoComplete="organization" placeholder="Mi Empresa S.A." value={company}
                  onChange={(e) => setCompany(e.target.value)} className="h-11 pl-10" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo 8 caracteres"
                value={password} onChange={(e) => setPassword(e.target.value)} className={`h-11 pl-10 pr-11 ${invalidCls(errors.password)}`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && (
              <div className="pt-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i < strength.score ? strength.color : 'bg-muted'}`} />
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Seguridad: <span className="font-medium text-foreground">{strength.label}</span></p>
              </div>
            )}
            {fieldError(errors.password)}
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <Checkbox checked={marketingOptIn} onCheckedChange={(v) => setMarketingOptIn(v === true)} className="mt-0.5" />
            <span className="text-sm text-muted-foreground">Quiero recibir ofertas y promociones exclusivas.</span>
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                {error}{' '}
                {error.includes('Inicia sesión') && <Link href={loginHref} className="font-semibold underline">Ir a iniciar sesión</Link>}
              </span>
            </div>
          )}

          <Button type="submit" disabled={!!loading} className="w-full h-11 text-sm font-semibold">
            {loading === 'email' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            {fromCheckout ? 'Crear cuenta y continuar' : 'Crear mi cuenta'}
          </Button>

          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            Al crear tu cuenta aceptas nuestros términos y el aviso de privacidad de Borarly.
          </p>
        </form>

        <div className="mt-6 rounded-lg bg-muted/60 p-4 text-center text-sm">
          <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
          <Link href={loginHref} className="font-semibold text-primary hover:underline">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <SignupForm />
    </Suspense>
  );
}
