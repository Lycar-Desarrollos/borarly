
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Landmark, Star, LifeBuoy } from 'lucide-react'; // Adjusted icons
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface ServiceItem {
  icon: LucideIcon;
  title: string;
  bgColorClass: string;
  iconColorClass: string;
  href: string;
}

const services: ServiceItem[] = [
  { icon: Cloud, title: 'SERVICIOS WEB', bgColorClass: 'bg-sky-100', iconColorClass: 'text-sky-600', href: '/services/web' },
  { icon: Landmark, title: 'SERVICIOS FINANCIEROS', bgColorClass: 'bg-amber-100', iconColorClass: 'text-amber-600', href: '/services/financial' },
  { icon: Star, title: 'PROYECTOS DE VALOR', bgColorClass: 'bg-indigo-100', iconColorClass: 'text-indigo-600', href: '/services/value-projects' },
  { icon: LifeBuoy, title: 'SOPORTE', bgColorClass: 'bg-teal-100', iconColorClass: 'text-teal-600', href: '/services/support' },
];

export function ServiceHighlights() {
  return (
    <section className="container px-4 md:px-6 py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {services.map((service) => (
          <Link key={service.title} href={service.href} passHref legacyBehavior>
            <a className="h-full">
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow rounded-lg overflow-hidden group h-full flex flex-col">
                <CardHeader className={`p-4 md:p-6 ${service.bgColorClass} transition-colors group-hover:brightness-95`}>
                  <service.icon className={`mx-auto h-10 w-10 md:h-12 md:w-12 ${service.iconColorClass} mb-2 transition-transform group-hover:scale-110`} />
                </CardHeader>
                <CardContent className="p-3 md:p-4 bg-card flex-grow flex items-center justify-center">
                  <CardTitle className="text-sm md:text-base font-semibold text-card-foreground">{service.title}</CardTitle>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>
    </section>
  );
}
