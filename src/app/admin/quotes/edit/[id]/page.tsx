"use client";

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { QuoteForm } from '@/components/admin/QuoteForm';
import { getQuoteById } from '@/services/quoteService';
import type { Quote } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface EditQuotePageProps {
  params: Promise<{ id: string }>;
}

export default function EditQuotePage(props: EditQuotePageProps) {
  const params = use(props.params);
  const quoteId = params?.id;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    if (!quoteId) {
      setNotFoundError(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    getQuoteById(quoteId)
      .then((data) => {
        if (!data) {
          setNotFoundError(true);
        } else {
          setQuote(data);
        }
      })
      .catch(() => setNotFoundError(true))
      .finally(() => setLoading(false));
  }, [quoteId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Cargando cotización...</p>
      </div>
    );
  }

  if (notFoundError || !quote) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center py-20 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h1 className="text-xl font-bold">Cotización no encontrada</h1>
        <p className="text-sm text-muted-foreground">
          No se encontró la cotización solicitada o fue eliminada.
        </p>
        <Button asChild variant="outline">
          <Link href="/admin/quotes">Volver a Cotizaciones</Link>
        </Button>
      </div>
    );
  }

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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Editar Cotización {quote.quoteNumber}
        </h1>
      </div>
      <QuoteForm quote={quote} />
    </div>
  );
}
