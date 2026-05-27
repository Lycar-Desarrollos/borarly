
"use client";

import { Facebook, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface ShareButtonsProps {
  product: Product;
}

export function ShareButtons({ product }: ShareButtonsProps) {
  const { toast } = useToast();
  const pathname = usePathname();
  const [fullUrl, setFullUrl] = useState('');

  useEffect(() => {
    // This ensures window is accessed only on the client side after hydration
    setFullUrl(`${window.location.origin}${pathname}`);
  }, [pathname]);


  const shareText = `¡Mira este increíble producto: ${product.name}!`;

  const socialLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + fullUrl)}`,
  };

  const copyToClipboard = () => {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl).then(() => {
      toast({ title: 'Enlace Copiado', description: 'El enlace al producto ha sido copiado a tu portapapeles.' });
    }, (err) => {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo copiar el enlace.' });
      console.error('Could not copy text: ', err);
    });
  };

  return (
    <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Compartir este producto</h3>
        <div className="flex items-center gap-2">
            <a href={fullUrl ? socialLinks.facebook : '#'} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" aria-label="Compartir en Facebook" disabled={!fullUrl}>
                    <Facebook className="h-5 w-5 text-[#1877F2]" />
                </Button>
            </a>
            <a href={fullUrl ? socialLinks.whatsapp : '#'} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" aria-label="Compartir en WhatsApp" disabled={!fullUrl}>
                    <MessageCircle className="h-5 w-5 text-[#25D366]" />
                </Button>
            </a>
            <Button variant="outline" size="icon" onClick={copyToClipboard} aria-label="Copiar enlace del producto" disabled={!fullUrl}>
                <LinkIcon className="h-5 w-5" />
            </Button>
        </div>
    </div>
  );
}
