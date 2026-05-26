'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMetaStore } from '@/lib/store';

type Surface = 'terminal' | 'map' | 'watchlist' | 'other';

function surfaceFromPath(path: string | null): Surface {
  if (!path) return 'other';
  if (path.startsWith('/terminal')) return 'terminal';
  if (path.startsWith('/watchlist')) return 'watchlist';
  if (path === '/' || path.startsWith('/map') || path.startsWith('/moon')) {
    return 'map';
  }
  return 'other';
}

/**
 * Global keyboard shortcuts.
 *
 *   Anywhere
 *     ?              open the shortcuts overlay
 *     Esc            close the active panel / overlay
 *
 *   On /terminal
 *     1 / 2 / 3      jump to Terminal / Map / Watchlist
 *     /  or ⌘K       focus global search (stubbed via window.__metamapSearchFocus)
 *     f              focus the first filter chip (if any)
 *     j / k          move row selection up / down       (handled in TokenTable)
 *     Enter          open selected token                (handled in TokenTable)
 *
 *   On /, /moon (Map surfaces)
 *     1 / 2 / 3      switch time window 1h / 24h / 7d
 *     M              toggle mute
 *
 * No-op when the user is typing in an input / textarea / contenteditable.
 */
export default function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const isTextTarget = (t: EventTarget | null) => {
      if (!(t instanceof HTMLElement)) return false;
      if (t.isContentEditable) return true;
      const tag = t.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    };

    const focusSearch = () => {
      const fn = (
        window as unknown as { __metamapSearchFocus?: () => void }
      ).__metamapSearchFocus;
      if (fn) fn();
      else console.log('[shortcuts] search not registered on this surface');
    };

    const focusFirstChip = () => {
      const root = document.querySelector('[data-testid="filter-chips"]');
      const first = root?.querySelector<HTMLElement>('button');
      first?.focus();
    };

    const surface = surfaceFromPath(pathname);

    const onKey = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K opens search regardless of focus.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        focusSearch();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTextTarget(e.target)) return;

      const store = useMetaStore.getState();

      switch (e.key) {
        case 'Escape':
          if (helpOpen) {
            e.preventDefault();
            setHelpOpen(false);
            return;
          }
          if (store.selectedCountry) {
            e.preventDefault();
            store.setSelectedCountry(null);
          }
          if (store.selectedTokenId) {
            e.preventDefault();
            store.setSelectedToken(null);
          }
          break;
        case '?':
          e.preventDefault();
          setHelpOpen((v) => !v);
          break;
        case '/':
          // Spec: ⌘K or / focuses global search from anywhere.
          e.preventDefault();
          focusSearch();
          break;
        case 'f':
        case 'F':
          if (surface === 'terminal') {
            e.preventDefault();
            focusFirstChip();
          }
          break;
        case '1':
          e.preventDefault();
          if (surface === 'terminal' || surface === 'watchlist') {
            router.push('/terminal');
          } else {
            store.setTimeWindow('1h');
          }
          break;
        case '2':
          e.preventDefault();
          if (surface === 'terminal' || surface === 'watchlist') {
            router.push('/map');
          } else {
            store.setTimeWindow('24h');
          }
          break;
        case '3':
          e.preventDefault();
          if (surface === 'terminal' || surface === 'map') {
            router.push('/watchlist');
          } else {
            store.setTimeWindow('7d');
          }
          break;
        case 'm':
        case 'M':
          if (surface === 'map') {
            e.preventDefault();
            store.toggleMuted();
          }
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pathname, router, helpOpen]);

  if (!helpOpen) return null;

  return <ShortcutsOverlay onClose={() => setHelpOpen(false)} />;
}

function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  const sections: { title: string; rows: [string, string][] }[] = [
    {
      title: 'Anywhere',
      rows: [
        ['?', 'Toggle this overlay'],
        ['Esc', 'Close current panel / overlay'],
      ],
    },
    {
      title: 'Terminal',
      rows: [
        ['1', 'Terminal'],
        ['2', 'Map'],
        ['3', 'Watchlist'],
        ['/  or  ⌘K', 'Focus global search'],
        ['f', 'Focus first filter chip'],
        ['j / k', 'Move row selection'],
        ['Enter', 'Open selected token'],
      ],
    },
    {
      title: 'Map',
      rows: [
        ['1 / 2 / 3', 'Switch time window'],
        ['m', 'Toggle mute'],
      ],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full max-w-[480px] overflow-y-auto rounded-ds-md border border-ds-border-strong bg-ds-bg-surface p-ds6 font-ds-mono"
      >
        <header className="mb-ds5 flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-[0.4em] text-ds-text-primary">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts overlay"
            className="rounded-ds-sm border border-ds-border-strong px-ds2 py-ds1 text-[10px] uppercase tracking-[0.32em] text-ds-text-secondary hover:text-ds-text-primary"
          >
            Esc
          </button>
        </header>
        <div className="flex flex-col gap-ds5">
          {sections.map((s) => (
            <section key={s.title}>
              <h3 className="mb-ds2 text-[9px] uppercase tracking-[0.4em] text-ds-text-tertiary">
                {s.title}
              </h3>
              <ul className="flex flex-col gap-ds1">
                {s.rows.map(([key, desc]) => (
                  <li
                    key={key}
                    className="flex items-center justify-between border-b border-ds-border-subtle/40 py-ds1 text-[12px]"
                  >
                    <span className="text-ds-text-secondary">{desc}</span>
                    <kbd className="rounded-ds-sm border border-ds-border-strong bg-ds-bg-surfaceHi px-ds2 py-[2px] text-[10px] text-ds-text-primary">
                      {key}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
