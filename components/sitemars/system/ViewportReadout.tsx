'use client';

import { useEffect, useState } from 'react';

/**
 * TEMPORARY diagnostic — shows the live viewport size so the globe centre-lock
 * can be pinned to the EXACT width/height this site is viewed at (the slots are
 * viewport-relative and only line up at their tuning width). Remove once the
 * lock is dialled in. Sits top-centre, above everything.
 */
export default function ViewportReadout() {
  const [d, setD] = useState('…');
  useEffect(() => {
    const update = () => setD(`${window.innerWidth} × ${window.innerHeight}`);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return (
    <div
      aria-hidden
      style={{ zIndex: 99999 }}
      className="pointer-events-none fixed left-1/2 top-2 -translate-x-1/2 rounded-md border border-accent-400/60 bg-black/85 px-3 py-1 font-mono text-[12px] font-semibold uppercase tracking-[0.25em] text-accent-300 shadow-lg"
    >
      VIEWPORT {d}
    </div>
  );
}
