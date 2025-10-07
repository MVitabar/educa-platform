'use client';

import { AuthProvider } from './providers/AuthProvider';
import ClientLayout from './ClientLayout';

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ClientLayout>
        {children}
      </ClientLayout>
    </AuthProvider>
  );
}
