import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import { Bricolage_Grotesque, Outfit } from 'next/font/google';
import 'nextra-theme-docs/style.css';
import 'swagger-ui-react/swagger-ui.css';
import './styles.css';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit'
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bricolage'
});

export const metadata = {
  title: {
    default: 'Simamia API Documentation',
    template: '%s | Simamia API Docs'
  },
  description:
    'Integration guides and complete endpoint reference for the Simamia service management API.'
};

const navbar = (
  <Navbar
    logo={
      <span className='brand-lockup'>
        <span className='brand-mark'>S</span>
        <span>
          Simamia <span className='brand-muted'>Developers</span>
        </span>
      </span>
    }
    projectLink='https://github.com/troubleman96/SIMAMIA'
    chatLink='https://app.simamia.online'
  />
);

const footer = <Footer>Simamia API documentation · Tanzania · TZS</Footer>;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' dir='ltr' suppressHydrationWarning>
      <Head />
      <body className={`${outfit.variable} ${bricolage.variable}`}>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase='https://github.com/troubleman96/SIMAMIA/tree/main/docs-site'
          nextThemes={{ defaultTheme: 'light', storageKey: 'simamia-docs-theme' }}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
