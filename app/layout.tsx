import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-sans',
  weight: ['300', '400', '500'],
  subsets: ['latin'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-mono',
  weight: ['400', '500'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SEFAZ-CE · B02 TI',
  description: 'Tracker de estudos para Auditor-Fiscal da Fazenda Estadual do Ceará',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="bg-bg text-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
