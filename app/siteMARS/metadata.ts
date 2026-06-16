import type { Metadata } from 'next';

const TITLE = "MetaMap — The world's attention, mapped in real time";
const DESCRIPTION =
  'A live geopolitical attention dashboard for on-chain traders. One immersive 3D earth that shows you what the world is talking about, country by country — see where the next narrative is forming before the token does.';

/**
 * Per-page metadata for /siteMARS — a clone of /siteNEW's metadata with the
 * canonical / OG URLs pointed at the new slash. metadataBase makes the relative
 * OG/canonical URLs absolute; theme-color #05080F is set globally in
 * app/layout.tsx's viewport export.
 */
export const metadata: Metadata = {
  metadataBase: new URL('https://metamap.space'),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/siteMARS' },
  openGraph: {
    type: 'website',
    siteName: 'MetaMap',
    title: TITLE,
    description: DESCRIPTION,
    url: '/siteMARS',
    images: [
      {
        url: 'https://metamap.space/og/sitenew-og.png',
        width: 1200,
        height: 630,
        alt: 'MetaMap — live global attention map',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['https://metamap.space/og/sitenew-og.png'],
  },
};
