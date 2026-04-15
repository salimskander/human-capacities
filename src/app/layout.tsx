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

export const metadata: Metadata = {
  title: "Human-capacities",
  description: "Human-capacities",
  icons: {
    icon: "/chimp.svg",
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
        <script type="text/javascript">
          window.$crisp=[];window.CRISP_WEBSITE_ID="d240d500-f2ef-40ed-bfb2-64d7c17fe3c1";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();
        </script>
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
