import type { Metadata } from 'next';

const TITLE = 'Starship Protocol: On-chain SPCX exposure with $STAR';
const DESCRIPTION =
  'Starship Protocol is a deflationary ERC-20 on Ethereum. A 3% sell tax routes synthetic SPCX exposure to every holder, burns supply, and funds development, automatically and on-chain. Hold $STAR and accrue. Claim whenever you want.';

/**
 * Per-page metadata for /siteMARS (Starship Protocol, $STAR). metadataBase
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
        alt: 'Starship Protocol ($STAR)',
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
