import type { Metadata } from 'next';

const TITLE = 'Starship Protocol — Own SpaceX on-chain with $STAR';
const DESCRIPTION =
  'Starship Protocol is a deflationary ERC-20 on Ethereum that routes real SpaceX stock to every holder. A 3% sell tax burns supply, buys SpaceX stock for holders, and funds development — automatically, on-chain. Buy once, accrue forever.';

/**
 * Per-page metadata for /siteMARS — Starship Protocol ($STAR). metadataBase
 * makes the relative OG/canonical URLs absolute; theme-color #05080F is set
 * globally in app/layout.tsx's viewport export.
 */
export const metadata: Metadata = {
  metadataBase: new URL('https://metamap.space'),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/siteMARS' },
  openGraph: {
    type: 'website',
    siteName: 'Starship Protocol',
    title: TITLE,
    description: DESCRIPTION,
    url: '/siteMARS',
    images: [
      {
        url: '/Starship_Protocol_Logo.png',
        alt: 'Starship Protocol — $STAR',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/Starship_Protocol_Logo.png'],
  },
};
