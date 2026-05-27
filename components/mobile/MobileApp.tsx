'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import KeyboardShortcuts from '@/components/hud/KeyboardShortcuts';
import HighImpactSoundCue from '@/components/earth/HighImpactSoundCue';
import NarrativeFeedSimulator from '@/components/earth/NarrativeFeedSimulator';
import LiveFeedSimulator from '@/components/moon/LiveFeedSimulator';
import MobileMapBlock from './MobileMapBlock';
import MobileMenu from './MobileMenu';
import MobileNarratives from './MobileNarratives';
import MobileSearch from './MobileSearch';
import MobileTabBar from './MobileTabBar';
import MobileTokenDetail from './MobileTokenDetail';
import MobileTopBar from './MobileTopBar';
import MobileTrending from './MobileTrending';
import MobileWatchlist from './MobileWatchlist';

/**
 * Mobile root. Owns the top bar / tab bar chrome and routes the
 * current URL to the right mobile screen. The bundle is deliberately
 * Three.js-free so first paint stays under the TTI budget on 4G.
 *
 * /siteview keeps the marketing landing as-is (it's responsive).
 * /token/[chain]/[address] routes to MobileTokenDetail.
 * /map and /moon show the desktop-only block.
 * Everything else maps onto one of the four tabs.
 */
export default function MobileApp() {
  const pathname = usePathname() ?? '/terminal';
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close overlays on route change so back navigation works cleanly.
  useEffect(() => {
    setSearchOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Lock scroll while a fullscreen overlay is open.
  useEffect(() => {
    const overlayOpen = searchOpen || menuOpen;
    if (!overlayOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [searchOpen, menuOpen]);

  const screen = renderScreen(pathname);
  const hideTabBar = pathname.startsWith('/token/');

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-ds-bg-base text-ds-text-primary">
      <MobileTopBar
        onSearch={() => setSearchOpen(true)}
        onMenu={() => setMenuOpen(true)}
      />

      <main className="flex-1 min-h-0">{screen}</main>

      {!hideTabBar && <MobileTabBar onSearch={() => setSearchOpen(true)} />}

      {searchOpen && <MobileSearch onClose={() => setSearchOpen(false)} />}
      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}

      {/* Headless — same heartbeat as desktop. */}
      <NarrativeFeedSimulator />
      <LiveFeedSimulator />
      <HighImpactSoundCue />
      <KeyboardShortcuts />
    </div>
  );
}

function renderScreen(pathname: string) {
  if (pathname.startsWith('/token/')) return <MobileTokenDetail />;
  if (pathname.startsWith('/map') || pathname.startsWith('/moon')) {
    return <MobileMapBlock />;
  }
  if (pathname.startsWith('/narratives')) return <MobileNarratives />;
  if (pathname.startsWith('/watchlist')) return <MobileWatchlist />;
  // /terminal, /, anything else → Trending.
  return <MobileTrending />;
}
