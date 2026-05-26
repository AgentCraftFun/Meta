import type { Metadata, Viewport } from 'next';
import SurfaceTransition from '@/components/celestial/SurfaceTransition';
import TopBar from '@/components/chrome/TopBar';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'MetaMap — The world\'s attention, mapped in real time',
  description:
    'A live geopolitical attention dashboard for on-chain traders. A 3D earth that shows you what the world is talking about, country by country.',
};

export const viewport: Viewport = {
  themeColor: '#05080F',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600;700&family=Press+Start+2P&family=Space+Grotesk:wght@500;600;700&family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#05080F] text-slate-100 antialiased">
        <Providers>
          <TopBar />
          {children}
          <SurfaceTransition />
        </Providers>
      </body>
    </html>
  );
}
