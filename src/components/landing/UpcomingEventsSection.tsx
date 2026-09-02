
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { UpcomingEvent } from '@/lib/types';
import { getUpcomingEvents } from '@/services/upcomingEventService';
import { Skeleton } from '@/components/ui/skeleton';
import { safeImageSrc } from '@/lib/imageUrl';


export function UpcomingEventsSection() {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const fetchedEvents = await getUpcomingEvents(true);
        setEvents(fetchedEvents.slice(0, 4)); // Show up to 4 events
      } catch (error) {
        console.error("Failed to load upcoming events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <section className="container px-4 md:px-6 py-8">
        <h2 className="text-2xl font-bold text-center mb-8">PRÓXIMOS EVENTOS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
             <Card key={i} className="flex flex-col overflow-hidden shadow-lg rounded-lg">
                <CardHeader className="p-4 space-y-2">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <Skeleton className="aspect-video w-full"/>
                <CardFooter className="p-0 mt-auto">
                   <Skeleton className="h-12 w-full rounded-none rounded-b-lg"/>
                </CardFooter>
             </Card>
          ))}
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null; // Don't render if there are no active events
  }

  return (
    <section className="container px-4 md:px-6 py-8">
      <h2 className="text-2xl font-bold text-center mb-8">PRÓXIMOS EVENTOS</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow rounded-lg">
            <CardHeader className="p-4">
              {event.brandLogoUrl && (
                <div className="mb-2 h-10 flex items-center">
                  <div className="relative w-[100px] h-[40px]">
                    <Image src={safeImageSrc(event.brandLogoUrl)} alt={`${event.title} brand`} layout="fill" objectFit="contain" data-ai-hint={`${event.title} brand logo`} />
                  </div>
                </div>
              )}
              <CardTitle className="text-lg font-semibold">{event.title}</CardTitle>
              <CardDescription>{event.subtitle}</CardDescription>
            </CardHeader>
            <div className="relative aspect-video w-full group bg-white">
                 <Image 
                    src={safeImageSrc(event.imageUrl, 'https://placehold.co/400x200.png')} 
                    alt={event.title} 
                    layout="fill" 
                    objectFit="contain" 
                    data-ai-hint={`${event.title} event graphic`}
                    className="transition-transform duration-300 group-hover:scale-105 p-2"
                  />
            </div>
            <CardFooter className="p-0 bg-primary mt-auto">
              <Link href={event.buttonLink || '#'} passHref legacyBehavior>
                <a target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button
                    variant="default"
                    className="w-full rounded-none rounded-b-lg h-12 text-base font-semibold bg-primary text-primary-foreground hover:brightness-110"
                  >
                    {event.buttonText}
                  </Button>
                </a>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
