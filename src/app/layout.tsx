import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProviderWrapper from '../components/AuthProviderWrapper';
import TopBar from '@/components/TopBar';
import Script from 'next/script';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = 'https://human-capacities.fr';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s | Human Capacities',
    default: 'Human Capacities — Testez vos capacités cognitives',
  },
  description:
    'Évaluez vos réflexes, votre mémoire et vos capacités cognitives avec 8 tests scientifiques. Comparez-vous à des milliers de joueurs dans le monde entier.',
  keywords: [
    'test cognitif', 'mémoire', 'réflexes', 'chimp test', 'vitesse de frappe',
    'capacités humaines', 'test de mémoire', 'temps de réaction', 'mémoire visuelle',
    'mémoire verbale', 'mémoire des chiffres',
  ],
  authors: [{ name: 'Human Capacities', url: BASE_URL }],
  creator: 'Human Capacities',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: BASE_URL,
    siteName: 'Human Capacities',
    title: 'Human Capacities — Testez vos capacités cognitives',
    description:
      'Évaluez vos réflexes, votre mémoire et vos capacités cognitives avec 8 tests scientifiques. Comparez-vous à des milliers de joueurs dans le monde.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Human Capacities — Testez vos capacités cognitives',
    description:
      'Évaluez vos réflexes, votre mémoire et vos capacités cognitives avec 8 tests scientifiques.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1 },
  },
  icons: {
    icon: '/chimp.svg',
    apple: '/chimp.svg',
  },
  alternates: {
    canonical: BASE_URL,
    languages: { 'fr-FR': BASE_URL },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8659475682678440"
          crossOrigin="anonymous"
        />
        <Script
          id="crisp-chat-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.$crisp=[];window.CRISP_WEBSITE_ID="d240d500-f2ef-40ed-bfb2-64d7c17fe3c1";(function(){var d=document;var s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProviderWrapper>
          <TopBar />
          <div className="min-h-screen">
            {children}
          </div>
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
