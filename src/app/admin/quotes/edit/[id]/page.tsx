
import { QuoteForm } from '@/components/admin/QuoteForm';
import { getQuoteById } from '@/services/quoteService';
import { notFound } from 'next/navigation';

interface EditQuotePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuotePage(props: EditQuotePageProps) {
  const params = await props.params;
  const { id: quoteId } = params;

  if (!quoteId) {
    notFound();
    return null;
  }

  const quote = await getQuoteById(quoteId);

  if (!quote) {
    notFound();
    return null;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Editar Cotización</h1>
      <QuoteForm quote={quote} />
    </div>
  );
}
