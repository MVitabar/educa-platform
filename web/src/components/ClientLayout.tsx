'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // No mostrar Header en rutas de dashboard, registro o login
  const hideHeader = 
    pathname.startsWith('/student') || 
    pathname.startsWith('/instructor') || 
    pathname.startsWith('/admin') ||
    pathname === '/registro' ||
    pathname === '/login';

  return (
    <>
      {!hideHeader && <Header />}
      <main className={`${!hideHeader ? 'pt-16' : ''} min-h-full`}>
        {children}
      </main>
    </>
  );
}
