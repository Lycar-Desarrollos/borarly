import type { Metadata } from 'next';
import { getService } from '@/lib/services';
import { ServiceDetail } from '@/components/services/ServiceDetail';

const service = getService('chatbots');

export const metadata: Metadata = {
  title: service.metaTitle,
  description: service.metaDescription,
};

export default function Page() {
  return <ServiceDetail service={service} />;
}