import { Sora, Lexend } from 'next/font/google';
import "./globals.css";
import type { Metadata } from 'next';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap' });
const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://votre-domaine.com'),
  title: "RevEd — 30 minutes par jour pour construire leur avenir",
  description: "Répétition espacée (SM-2), prérequis, maîtrise garantie. L&apos;alternative aux 4h d&apos;écrans passifs.",
  openGraph: {
    title: "RevEd — Le vrai concurrent, c&apos;est l&apos;algorithme.",
    description: "Remplacez 30 minutes de scroll par 30 minutes qui restent. Maîtrise garantie.",
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://votre-domaine.com',
  },
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${sora.variable} ${lexend.variable} font-lexend bg-deep-space text-clarity-white body-gradient`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-clarity-white focus:text-deep-space focus:px-3 focus:py-2 focus:rounded">Aller au contenu</a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "RevEd",
              url: "https://votre-domaine.com", // PENSEZ À CHANGER CECI
              logo: "https://votre-domaine.com/logo.png", // PENSEZ À CHANGER CECI
              sameAs: [],
            })
          }}
        />
      </body>
    </html>
  );
}