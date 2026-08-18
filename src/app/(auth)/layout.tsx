
import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50 px-4 py-8 pb-safe">
      <div className="mb-6 sm:mb-8">
        <Link href="/" className="flex items-center gap-2 text-2xl font-black tracking-tight text-foreground select-none">
          <Image
            src="/icon-192.png"
            alt="BORARLY Logo"
            width={36}
            height={36}
            priority
            className="h-9 w-9 object-contain"
          />
          <span className="leading-none font-black text-3xl tracking-tighter bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400">
            BORARLY
          </span>
        </Link>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
