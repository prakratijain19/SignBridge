import type { Metadata } from 'next';
import {
  Inter,
  Hanken_Grotesk,
  Noto_Sans_Devanagari,
  Noto_Sans_Gujarati,
} from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

// Body / UI face → --font-sans (referenced by Tailwind and globals.css).
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Display face for headings → --font-display.
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

// Indian-script fallbacks so Hindi/Gujarati render correctly.
const notoDeva = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-noto-deva',
  display: 'swap',
});

const notoGujr = Noto_Sans_Gujarati({
  subsets: ['gujarati'],
  variable: '--font-noto-gujr',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SignBridge',
  description:
    'AI-powered multilingual accessibility platform for Indian Sign Language communication.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${hanken.variable} ${notoDeva.variable} ${notoGujr.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-canvas"
        >
          Skip to content
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
