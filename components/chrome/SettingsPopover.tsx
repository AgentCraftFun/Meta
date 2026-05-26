'use client';

import { useEffect, useRef, useState } from 'react';
import { useMetaStore } from '@/lib/store';
import { useReducedMotion } from '@/lib/useReducedMotion';

/**
 * Settings popover anchored to the top-bar cog. Three rows: theme
 * (dark active / light coming), sound (writes the shared `muted`
 * zustand flag), reduced-motion (read-only mirror of the OS pref).
 *
 * Closes on click-outside and on Esc. The trigger button toggles it.
 */
export default function SettingsPopover() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const muted = useMetaStore((s) => s.muted);
  const toggleMuted = useMetaStore((s) => s.toggleMuted);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-ds-sm border border-ds-border-strong bg-ds-bg-surface text-ds-text-secondary hover:border-ds-accent-cyan/40 hover:text-ds-text-primary"
      >
        <CogIcon />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Settings"
          className="absolute right-0 top-[calc(100%+6px)] z-[71] w-[260px] rounded-ds-md border border-ds-border-strong bg-ds-bg-surface p-ds3 font-ds-mono shadow-[0_18px_40px_-12px_rgba(0,0,0,0.65)]"
        >
          <h3 className="mb-ds3 text-[10px] uppercase tracking-[0.4em] text-ds-text-tertiary">
            Settings
          </h3>

          <Row label="Theme">
            <SegmentedToggle
              options={[
                { id: 'dark', label: 'Dark', active: true },
                { id: 'light', label: 'Light', active: false, disabled: true },
              ]}
              onChange={() => {
                /* Theme toggle stub — light mode lands in the
                   theming sprint. Dark stays the only choice. */
              }}
            />
          </Row>

          <Row label="Sound">
            <SegmentedToggle
              options={[
                { id: 'on', label: 'On', active: !muted },
                { id: 'mute', label: 'Mute', active: muted },
              ]}
              onChange={(id) => {
                const wantMute = id === 'mute';
                if (wantMute !== muted) toggleMuted();
              }}
            />
          </Row>

          <Row label="Motion">
            <span
              className="text-[10px] uppercase tracking-[0.32em] text-ds-text-secondary"
              aria-label={
                reducedMotion ? 'Reduced motion enabled' : 'Full motion'
              }
            >
              {reducedMotion ? 'Reduced (OS)' : 'Full'}
            </span>
          </Row>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-ds3 border-b border-ds-border-subtle/60 py-ds2 last:border-b-0">
      <span className="text-[10px] uppercase tracking-[0.32em] text-ds-text-tertiary">
        {label}
      </span>
      <div className="flex items-center gap-ds1">{children}</div>
    </div>
  );
}

function SegmentedToggle({
  options,
  onChange,
}: {
  options: { id: string; label: string; active: boolean; disabled?: boolean }[];
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      className="inline-flex rounded-ds-sm border border-ds-border-strong bg-ds-bg-base p-[2px]"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.active}
          disabled={o.disabled}
          onClick={() => !o.disabled && onChange(o.id)}
          className={[
            'h-5 rounded-[3px] px-ds2 text-[10px] uppercase tracking-[0.32em] transition-colors duration-ds-fast ease-ds-standard',
            o.active
              ? 'bg-ds-accent-cyan/15 text-ds-accent-cyan'
              : 'text-ds-text-secondary hover:text-ds-text-primary',
            o.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function CogIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
