'use client';

import Link from 'next/link';

/**
 * Rendered when a mobile user arrives at /map or /moon. The desktop
 * scene needs a real GPU and a wider canvas, so we replace it with a
 * polite redirect.
 */
export default function MobileMapBlock() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-ds4 bg-ds-bg-base px-ds5 text-center font-ds-mono">
      <span className="text-[11px] uppercase tracking-[0.4em] text-ds-accent-cyan">
        Map view — desktop only
      </span>
      <p className="max-w-[300px] text-[14px] leading-relaxed text-ds-text-secondary">
        The Earth + Moon scenes need a larger screen and a real GPU. Open
        MetaMap on a laptop to see the globe in full.
      </p>
      <Link
        href="/terminal"
        className="inline-flex h-11 items-center rounded-ds-sm bg-ds-accent-cyan/15 px-ds5 text-[11px] uppercase tracking-[0.32em] text-ds-accent-cyan active:bg-ds-accent-cyan/25"
      >
        Open Trending
      </Link>
    </div>
  );
}
