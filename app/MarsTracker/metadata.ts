import type { Metadata } from 'next';

const TITLE = 'Mars Tracker: Check your $SPCX rewards | Starship Protocol';
const DESCRIPTION =
  'Paste any wallet to see how much $SPCX it has accrued from Starship Protocol. Read live from Ethereum mainnet. No connection, no signing, fully non-custodial.';

/**
 * Per-page metadata for /MarsTracker (Starship Protocol rewards tracker).
 * metadataBase makes the relative OG/canonical URLs absolute; theme-color
 * #05080F is set globally in app/layout.tsx's viewport export.
 */
export const metadata: Metadata = {
  metadataBase: new URL('https://metamap.space'),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/MarsTracker' },
  icons: { icon: '/Starship_Protocol_Logo.png' },
  openGraph: {
    type: 'website',
    siteName: 'Starship Protocol',
    title: TITLE,
    description: DESCRIPTION,
    url: '/MarsTracker',
    images: [
      {
        url: '/Starship_Protocol_Logo.png',
        alt: 'Starship Protocol ($STAR) — $SPCX Rewards Tracker',
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
