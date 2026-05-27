'use client';

import { usePathname, useRouter } from 'next/navigation';

type TabId = 'trending' | 'narratives' | 'watchlist' | 'search';

type Props = {
  onSearch: () => void;
};

const TABS: { id: TabId; label: string; href?: string }[] = [
  { id: 'trending', label: 'Trending', href: '/terminal' },
  { id: 'narratives', label: 'Narratives', href: '/narratives' },
  { id: 'watchlist', label: 'Watchlist', href: '/watchlist' },
  { id: 'search', label: 'Search' },
];

function tabFromPath(path: string): TabId | null {
  if (path.startsWith('/narratives')) return 'narratives';
  if (path.startsWith('/watchlist')) return 'watchlist';
  if (path.startsWith('/token/') || path.startsWith('/terminal') || path === '/') {
    return 'trending';
  }
  return null;
}

/**
 * Bottom-anchored tab bar. 64px tall — fits the 44×44 tap target
 * plus label. Tabs route via Next.js navigation; Search opens a
 * fullscreen modal in MobileApp instead of pushing a route.
 */
export default function MobileTabBar({ onSearch }: Props) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const active = tabFromPath(pathname);

  return (
    <nav
      aria-label="Sections"
      role="tablist"
      className="flex h-16 shrink-0 items-stretch justify-around border-t border-ds-border-subtle bg-ds-bg-base font-ds-mono"
    >
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              if (t.id === 'search') onSearch();
              else if (t.href) router.push(t.href);
            }}
            className={[
              'flex h-full flex-1 flex-col items-center justify-center gap-[2px] px-ds1 text-[9px] uppercase tracking-[0.32em]',
              isActive
                ? 'text-ds-accent-cyan'
                : 'text-ds-text-tertiary',
            ].join(' ')}
          >
            <TabIcon id={t.id} active={isActive} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function TabIcon({ id, active }: { id: TabId; active: boolean }) {
  const stroke = active ? '#4DD4FF' : 'currentColor';
  const w = 18;
  switch (id) {
    case 'trending':
      return (
        <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" aria-hidden>
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      );
    case 'narratives':
      return (
        <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" aria-hidden>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      );
    case 'watchlist':
      return (
        <svg width={w} height={w} viewBox="0 0 24 24" fill={active ? stroke : 'none'} stroke={stroke} strokeWidth="1.6" aria-hidden>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'search':
      return (
        <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      );
  }
}
