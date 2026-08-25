import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'ClientGuard CRM | Personal Insurance & Renewals',
  description: 'Single-user CRM for managing personal insurance client policies, vehicle plates, driver license numbers, and policy renewal dates.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
