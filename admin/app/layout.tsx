import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Simamia Admin',
  description: 'Private operations console for Simamia',
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
