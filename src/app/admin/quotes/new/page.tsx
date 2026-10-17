"use client";

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { QuoteForm } from '@/components/admin/QuoteForm';

export default function NewQuotePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-1">
        <Link
          href="/admin/quotes"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline w-fit"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Volver a Cotizaciones
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Crear Nueva Cotización</h1>
      </div>
      <QuoteForm />
    </div>
  );
}
