"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, Phone, Mail, MapPin, Clock, ChevronRight, 
  CreditCard, Truck, CheckCircle2, Lock, Award, FileText, Sparkles
} from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-zinc-200/80 bg-zinc-50 dark:bg-[#070b14] dark:border-white/10 text-zinc-700 dark:text-zinc-300 transition-colors">
      
      {/* 1. SECCIÓN PRINCIPAL: COLUMNAS + SELLOS DE CONFIANZA Y CERTIFICACIONES */}
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Columna 1: Acerca de Borarly */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              Acerca de Borarly
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/nosotros" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Quiénes somos
                </Link>
              </li>
              <li>
                <Link href="/nosotros" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Por qué Borarly.com
                </Link>
              </li>
              <li>
                <Link href="/politicas/devoluciones" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link href="/politicas/terminos" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Formas de pago
                </Link>
              </li>
              <li>
                <Link href="/politicas/envios" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Formas de envío nacional
                </Link>
              </li>
              <li>
                <Link href="/profile/billing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Facturación CFDI 4.0
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Centro de Información
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 2: Accesos Rápidos */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              Accesos Rápidos
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/profile" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Mi Cuenta
                </Link>
              </li>
              <li>
                <Link href="/profile/orders" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Mis pedidos
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Mis cotizaciones
                </Link>
              </li>
              <li>
                <Link href="/profile/wishlist" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Lista de Deseos
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Portal Mayorista
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Asesoría en Compras & Servicios */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              Asesoría en Compras
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/services/value-projects" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Cómo comprar mayoreo
                </Link>
              </li>
              <li>
                <Link href="/services/certifications" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Certificaciones Oficiales
                </Link>
              </li>
              <li>
                <Link href="/services/support" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Herramientas de Compra
                </Link>
              </li>
              <li>
                <Link href="/politicas/devoluciones" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Garantías y devoluciones
                </Link>
              </li>
              <li>
                <Link href="/services/web" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Soluciones en la nube
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Contacto y Horarios */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              Contacto
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="font-semibold text-zinc-800 dark:text-zinc-200">
                MID (999) 904 0931
              </li>
              <li className="font-semibold text-zinc-800 dark:text-zinc-200">
                MEX (55) 4780 0901
              </li>
              <li className="font-semibold text-zinc-800 dark:text-zinc-200">
                GDL (33) 4780 0901
              </li>
              <li className="text-zinc-500 pt-1">
                L-V 9:00AM - 6:00PM
              </li>
              <li>
                <a 
                  href="mailto:ventas@borarly.com" 
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  ventas@borarly.com
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 5: SELLOS DE CONFIANZA Y CERTIFICACIONES (PSICOLOGÍA DE CONVERSIÓN DE ALTA GAMA) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3 pt-2 sm:pt-0">
            
            {/* Sello 1: Asociación de Internet.mx (Sello de Confianza Oficial) */}
            <div className="bg-white dark:bg-[#0c121e] border border-zinc-200 dark:border-white/10 rounded-2xl p-3.5 flex flex-col justify-center items-center text-center shadow-xs hover:shadow-md hover:border-blue-500/50 transition-all group">
              <div className="flex items-center gap-2 mb-1.5">
                <svg className="w-7 h-7 text-zinc-900 dark:text-white shrink-0" viewBox="0 0 36 36" fill="currentColor">
                  <path d="M14.5 25.1l-6.8-6.8 2.1-2.1 4.7 4.7 11.2-11.2 2.1 2.1z" />
                  <path d="M18 2C9.2 2 2 9.2 2 18s7.2 16 16 16 16-7.2 16-16S26.8 2 18 2zm0 29.5C10.6 31.5 4.5 25.4 4.5 18S10.6 4.5 18 4.5 31.5 10.6 31.5 18 25.4 31.5 18 31.5z" />
                </svg>
                <div className="text-left leading-tight">
                  <span className="text-[9px] text-zinc-500 font-medium block">Asociación de</span>
                  <span className="text-[11px] text-zinc-900 dark:text-white font-extrabold block tracking-tight">Internet.mx</span>
                </div>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider text-[#0066cc] dark:text-[#38bdf8]">
                SELLO DE CONFIANZA
              </span>
              <span className="text-[8px] text-zinc-400 font-medium tracking-tight">COMERCIO ELECTRÓNICO</span>
            </div>

            {/* Sello 2: ISO 9001:2015 Certificado */}
            <div className="bg-white dark:bg-[#0c121e] border border-zinc-200 dark:border-white/10 rounded-2xl p-3.5 flex flex-col justify-center items-center text-center shadow-xs hover:shadow-md hover:border-blue-500/50 transition-all group">
              <div className="w-7 h-7 rounded-full border-2 border-zinc-800 dark:border-zinc-200 flex items-center justify-center mb-1 text-zinc-800 dark:text-zinc-200">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <span className="text-[12px] font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                ISO 9001:2015
              </span>
              <span className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
                CERTIFICADO
              </span>
            </div>

            {/* Sello 3: DigiCert Secured / SSL 256-bit */}
            <div className="bg-white dark:bg-[#0c121e] border border-zinc-200 dark:border-white/10 rounded-2xl p-3.5 flex flex-col justify-center items-center text-center shadow-xs hover:shadow-md hover:border-blue-500/50 transition-all group">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-5 h-5 text-[#0066cc] dark:text-[#38bdf8]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v6h-2v-6z"/>
                </svg>
                <span className="text-[13px] font-black text-[#0066cc] dark:text-[#38bdf8] tracking-tight leading-none">
                  digicert
                </span>
              </div>
              <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">
                SECURED 256-BIT SSL
              </span>
            </div>

            {/* Sello 4: Great Place To Work Certificada */}
            <div className="bg-white dark:bg-[#0c121e] border border-zinc-200 dark:border-white/10 rounded-2xl p-3 flex flex-col justify-center items-center text-center shadow-xs hover:shadow-md hover:border-red-500/50 transition-all group">
              <div className="bg-[#e11931] text-white px-2 py-1 rounded-md text-center leading-tight mb-1 w-full max-w-[95px] shadow-2xs">
                <span className="text-[8px] font-black uppercase block tracking-tighter">Great Place</span>
                <span className="text-[8px] font-black uppercase block tracking-tighter">To Work.</span>
              </div>
              <span className="text-[8px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">
                Certificada México
              </span>
            </div>

          </div>

        </div>
      </div>

      {/* 2. FRANJA INFERIOR: MÉTODOS DE PAGO SEGUROS + PAQUETERÍAS + PRECIOS IVA */}
      <div className="border-t border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-[#090d16]/90 py-5">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-6">
          
          {/* Métodos de Pago Seguros y Bancos Oficiales */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
            
            {/* SPEI Oficial */}
            <div className="h-8.5 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-2xs">
              <span className="font-black text-xs text-[#0a2540] dark:text-blue-300 tracking-wider">
                SPEI<span className="text-[#f59e0b] font-bold text-[10px] ml-0.5">®</span>
              </span>
            </div>

            {/* Monex */}
            <div className="h-8.5 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-black text-xs text-[#006f8a] dark:text-cyan-300 tracking-tight shadow-2xs">
              monex
            </div>

            {/* BBVA */}
            <div className="h-8.5 px-3 rounded-xl bg-[#004481] text-white border border-[#003366] flex items-center justify-center font-black text-xs tracking-wider shadow-2xs">
              BBVA
            </div>

            {/* VISA */}
            <div className="h-8.5 px-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-2xs">
              <span className="font-black text-sm text-[#1a1f71] dark:text-blue-400 italic tracking-wider">
                VISA
              </span>
            </div>

            {/* Mastercard */}
            <div className="h-8.5 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-1 shadow-2xs">
              <div className="flex items-center -space-x-1.5">
                <div className="w-4 h-4 rounded-full bg-[#eb001b]" />
                <div className="w-4 h-4 rounded-full bg-[#f79e1b] mix-blend-multiply opacity-90" />
              </div>
            </div>

            {/* American Express */}
            <div className="h-8.5 px-3 rounded-xl bg-[#006fcf] text-white flex items-center justify-center font-black text-[10px] uppercase tracking-tighter shadow-2xs">
              AMEX
            </div>

            {/* PayPal Oficial */}
            <div className="h-8.5 px-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-black text-xs shadow-2xs">
              <span className="text-[#003087] dark:text-blue-400">Pay</span>
              <span className="text-[#0079c1] dark:text-cyan-400">Pal</span>
            </div>
          </div>

          {/* Paqueterías y Envíos Nacionales */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
            
            {/* Estafeta */}
            <div className="h-8.5 px-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-black text-xs text-[#d32f2f] italic tracking-tight shadow-2xs">
              estafeta
            </div>

            {/* DHL Express */}
            <div className="h-8.5 px-3.5 rounded-xl bg-[#ffcc00] border border-[#e6b800] flex items-center justify-center font-black text-xs text-[#d40511] italic tracking-widest shadow-2xs">
              DHL
            </div>

            {/* Paquetexpress */}
            <div className="h-8.5 px-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-black text-[10px] text-[#002f6c] dark:text-blue-300 uppercase tracking-tight shadow-2xs">
              PAQUETEXPRESS
            </div>

            {/* FedEx */}
            <div className="h-8.5 px-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-black text-xs shadow-2xs">
              <span className="text-[#4d148c]">Fed</span><span className="text-[#ff6600]">Ex</span>
            </div>
          </div>

          {/* Leyenda Precios Incluyendo IVA */}
          <div className="h-8.5 px-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 shadow-2xs">
            <span>Precios incluyendo IVA</span>
            <span className="text-zinc-400 font-normal">· MXN</span>
          </div>

        </div>
      </div>

      {/* 3. BARRA DE COPYRIGHT Y AVISOS LEGALES DE CIERRE */}
      <div className="border-t border-zinc-200/80 dark:border-white/10 bg-zinc-900 dark:bg-[#04070d] text-zinc-400 text-xs py-4">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          
          {/* Enlaces Legales */}
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
            <Link href="/politicas/terminos" className="hover:text-white transition-colors">
              Condiciones Generales
            </Link>
            <span className="text-zinc-600">|</span>
            <Link href="/politicas/privacidad" className="hover:text-white transition-colors">
              Aviso de Privacidad
            </Link>
            <span className="text-zinc-600">|</span>
            <Link href="/politicas/envios" className="hover:text-white transition-colors">
              Garantía de Envío Seguro
            </Link>
          </div>

          {/* Leyenda País */}
          <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
            <span>Hecho en México, para empresas e integradores mexicanos</span>
            <span className="text-sm">🇲🇽</span>
          </div>

          {/* Copyright */}
          <div className="text-[11px] text-zinc-500 font-normal">
            &copy; 2012 - {currentYear} Borarly.com. Todos los derechos reservados.
          </div>

        </div>
      </div>

    </footer>
  );
}

