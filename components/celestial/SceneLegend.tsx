'use client';

import { useEffect, useState } from 'react';

type Props = {
  surface: 'earth' | 'moon';
};

const STORAGE_KEY = 'metamap.legend.collapsed.v1';

const ROWS: Record<'earth' | 'moon', { glyph: string; text: string }[]> = {
  earth: [
    { glyph: '●', text: 'Pin colour = sentiment (bull / bear / neutral)' },
    { glyph: '↥', text: 'Pin height = narrative impact (volume)' },
    { glyph: '◯', text: 'Pin pulse = recent breaking-news event' },
  ],
  moon: [
    { glyph: '●', text: 'Crater colour = 24h direction (bull / bear)' },
    { glyph: '◉', text: 'Crater size = market cap' },
    { glyph: '◯', text: 'Crater pulse = volume spike' },
  ],
};

/**
 * Tiny legend pinned bottom-right of the canvas. Collapsed state
 * persists per-user in localStorage so power users only see the icon
 * after the first session. Renders nothing on SSR until the persisted
 * value is read to avoid a flash of expanded state.
 */
export default function SceneLegend({ surface }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') setCollapsed(true);
    } catch {
      /* localStorage blocked — start expanded */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      /* noop */
    }
  }, [collapsed, hydrated]);

  if (!hydrated) return null;

  const rows = ROWS[surface];

  return (
    <aside
      aria-label="Scene legend"
      className="pointer-events-auto fixed bottom-ds4 right-ds4 z-30 rounded-ds-sm border border-ds-border-subtle bg-ds-bg-base/85 font-ds-mono backdrop-blur-md"
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        aria-controls="scene-legend-body"
        className="flex w-full items-center justify-between gap-ds3 px-ds3 py-ds2 text-[9px] uppercase tracking-[0.4em] text-ds-text-tertiary hover:text-ds-text-primary"
      >
        <span>Legend</span>
        <span aria-hidden>{collapsed ? '+' : '−'}</span>
      </button>
      {!collapsed && (
        <ul
          id="scene-legend-body"
          className="flex flex-col gap-ds1 border-t border-ds-border-subtle/60 px-ds3 py-ds2"
        >
          {rows.map((r) => (
            <li
              key={r.text}
              className="flex items-center gap-ds2 text-[10px] leading-snug text-ds-text-secondary"
            >
              <span aria-hidden className="text-ds-accent-cyan">{r.glyph}</span>
              <span>{r.text}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
