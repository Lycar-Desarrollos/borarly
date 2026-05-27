
import { QuoteForm } from '@/components/admin/QuoteForm';

export default async function NewQuotePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Crear Nueva Cotización</h1>
      <QuoteForm />
    </div>
  );
}
