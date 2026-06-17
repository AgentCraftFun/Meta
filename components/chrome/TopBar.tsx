'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GlobalSearch from './GlobalSearch';
import SettingsPopover from './SettingsPopover';
import StatusIndicator from './StatusIndicator';

type ViewId = 'terminal' | 'map' | 'watchlist';

const VIEWS: { id: ViewId; label: string; href: string }[] = [
  { id: 'terminal', label: 'Terminal', href: '/terminal' },
  { id: 'map', label: 'Map', href: '/map' },
  { id: 'watchlist', label: 'Watchlist', href: '/watchlist' },
];

/** Surfaces that don't show the bar — landing + the design smoke
 *  test render their own header / no header. */
const HIDDEN_ROUTES = ['/siteview', '/siteNEW', '/siteMARS', '/MarsTracker', '/design'];

function viewFromPath(path: string): ViewId | null {
  if (path.startsWith('/terminal')) return 'terminal';
  if (path.startsWith('/watchlist')) return 'watchlist';
  if (path.startsWith('/map') || path.startsWith('/moon')) return 'map';
  return null;
}

/**
 * Persistent global chrome. 48px tall, fixed top, z-70 so it stays
 * above the Three canvases and the cinematic SurfaceTransition's
 * black flash (which is z-60). Sits below the keyboard-shortcuts
 * modal (z-80).
 */
export default function TopBar() {
  const pathname = usePathname() ?? '/';
  if (HIDDEN_ROUTES.some((p) => pathname.startsWith(p))) return null;

  const active = viewFromPath(pathname);

  return (
    <header
      role="banner"
      className="fixed left-0 right-0 top-0 z-[70] flex h-12 items-center gap-ds5 border-b border-ds-border-subtle bg-ds-bg-base px-ds4 font-ds-mono"
    >
      <Link
        href="/terminal"
        aria-label="MetaMap home"
        className="text-[12px] font-semibold uppercase tracking-[0.42em] text-ds-text-primary hover:text-ds-accent-cyan"
      >
        METAMAP
      </Link>

      <ViewSwitcher active={active} />

      <div className="flex flex-1 justify-center">
        <GlobalSearch />
      </div>

      <StatusIndicator />
      <SettingsPopover />
    </header>
  );
}

function ViewSwitcher({ active }: { active: ViewId | null }) {
  return (
    <nav
      aria-label="Views"
      role="tablist"
      className="flex items-center gap-ds1 rounded-ds-sm border border-ds-border-strong bg-ds-bg-surface p-[2px]"
    >
      {VIEWS.map((v) => {
        const isActive = active === v.id;
        return (
          <Link
            key={v.id}
            href={v.href}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'h-6 rounded-[3px] px-ds3 text-[10px] uppercase tracking-[0.32em] transition-colors duration-ds-fast ease-ds-standard',
              'flex items-center',
              isActive
                ? 'bg-ds-accent-cyan/15 text-ds-accent-cyan'
                : 'text-ds-text-secondary hover:bg-ds-bg-surfaceHi hover:text-ds-text-primary',
            ].join(' ')}
          >
            {v.label}
          </Link>
        );
      })}
    </nav>
  );
}
