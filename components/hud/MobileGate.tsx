'use client';

import { useEffect, useState } from 'react';

const MIN_WIDTH = 1024;

/**
 * Hard gate at <1024px. v1 doesn't ship a mobile layout — show a clean
 * "open on a larger screen" message instead of a broken HUD.
 */
export default function MobileGate() {
  const [tooSmall, setTooSmall] = useState(false);

  useEffect(() => {
    const check = () => setTooSmall(window.innerWidth < MIN_WIDTH);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!tooSmall) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black px-8 text-center font-mono">
      <div className="flex max-w-md flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.45em] text-neon-cyan/85">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan shadow-neon-cyan" />
          MetaMap
        </div>
        <p className="text-[13px] leading-relaxed text-white/85">
          MetaMap is built for desktop — open on a larger screen.
        </p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">
          Min width 1024px
        </p>
      </div>
    </div>
  );
}
