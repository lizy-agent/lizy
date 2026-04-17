import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'LIZY — The data layer AI agents pay to use',
    template: '%s | LIZY',
  },
  description:
    'LIZY provides on-chain data APIs on Abstract Mainnet that AI agents pay for using x402 micropayments and MPP session billing.',
  keywords: ['AI agents', 'Web3', 'Abstract Chain', 'MCP', 'on-chain data', 'x402', 'micropayments'],
  authors: [{ name: 'LIZY Labs', url: 'https://lizy.world' }],
  creator: 'LIZY Labs',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lizy.world',
    siteName: 'LIZY',
    title: 'LIZY — The data layer AI agents pay to use',
    description: 'On-chain data APIs for AI agents on Abstract Mainnet.',
    images: [{ url: 'https://lizy.world/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@lizy_agent',
    creator: '@lizy_agent',
    title: 'LIZY — The data layer AI agents pay to use',
    description: 'On-chain data APIs for AI agents on Abstract Mainnet.',
    images: ['https://lizy.world/og.png'],
  },
  robots: { index: true, follow: true },
  metadataBase: new URL('https://lizy.world'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
