import type { Metadata, Viewport } from 'next';
import { fontVariables } from '@/components/themes/font.config';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'HudumaDesk — Huduma kwa mpangilio',
  description: 'Kiswahili-first service management for Tanzanian businesses.',
  robots: { index: false, follow: false }
};

export const viewport: Viewport = { themeColor: '#ffffff' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='sw' data-theme='supabase' suppressHydrationWarning>
      <body
        className={cn(
          'bg-background overflow-x-hidden overscroll-none font-sans antialiased',
          fontVariables
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
