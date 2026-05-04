'use client';

import { useProgress } from '@react-three/drei';
import { useEffect, useState } from 'react';

/**
 * Full-viewport boot overlay. Reads drei's loading manager via useProgress and
 * shows real loading percentage. Fades out smoothly once active flips false
 * AND progress hits 100, then unmounts so canvas events go through.
 */
export default function LoadingScreen() {
  const { progress, active } = useProgress();
  const [visible, setVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (!active && progress >= 100) {
      const fade = setTimeout(() => setOpacity(0), 120);
      const remove = setTimeout(() => setVisible(false), 1100);
      return () => {
        clearTimeout(fade);
        clearTimeout(remove);
      };
    }
  }, [active, progress]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black"
      style={{
        opacity,
        transition: 'opacity 900ms ease-out',
      }}
    >
      <div className="flex flex-col items-center gap-3.5 font-mono">
        <div className="flex items-center gap-2.5 text-[10px] uppercase tracking-[0.4em] text-neon-cyan/85">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan shadow-neon-cyan" />
          Initializing MetaMap…
        </div>
        <div className="h-px w-60 overflow-hidden bg-white/8">
          <div
            className="h-full bg-neon-cyan shadow-neon-cyan"
            style={{
              width: `${progress}%`,
              transition: 'width 200ms ease-out',
            }}
          />
        </div>
        <div className="text-[9px] tracking-[0.3em] text-neon-cyan/55">
          {Math.floor(progress)}%
        </div>
      </div>
    </div>
  );
}
