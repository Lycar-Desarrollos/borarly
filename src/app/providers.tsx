
"use client";

import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { TooltipProvider } from '@/components/ui/tooltip'; // Required by Sidebar
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // For potential Firestore data fetching
import { ThemeProvider } from 'next-themes';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                {children}
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
