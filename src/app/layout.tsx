import type { Metadata, Viewport } from 'next';
import { fontVariables } from '@/components/themes/font.config';
import { Toaster } from '@/components/ui/sonner';
import ThemeProvider from '@/components/themes/theme-provider';
import { CamelAuthRoot } from '@/features/auth/components/camel-auth-screen';
import { SimamiaAnalytics } from '@/features/auth/components/camel-analytics';
import { cn } from '@/lib/utils';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Simamia — Huduma kwa mpangilio',
  description: 'Kiswahili-first service management for Tanzanian businesses.',
  robots: { index: false, follow: false }
};

export const viewport: Viewport = { themeColor: '#F8FAFC' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='sw' data-theme='supabase' suppressHydrationWarning>
      <body
        className={cn(
          'bg-background overflow-x-hidden overscroll-none font-sans antialiased',
          fontVariables
        )}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem
          disableTransitionOnChange
        >
          <CamelAuthRoot>
            <SimamiaAnalytics />
            {children}
            <Toaster />
          </CamelAuthRoot>
        </ThemeProvider>
      </body>
    </html>
  );
}
