'use client';

import { useProgress } from '@react-three/drei';
import { useEffect, useState } from 'react';

type Tone = 'cyan' | 'mars';

type Props = {
  /** Headline text (uppercased + tracking applied via styling). */
  title?: string;
  /**
   * Accent colour. 'cyan' (default) is the original neon-cyan used on /siteNEW,
   * the landing hero and the map surfaces — unchanged. 'mars' uses the themed
   * accent vars, which resolve to branded orange under `.theme-mars` (/siteMARS).
   */
  tone?: Tone;
};

const DEFAULT_TITLE = 'Initializing MetaMap…';

const TONES: Record<Tone, { title: string; dot: string; bar: string; pct: string }> = {
  cyan: {
    title: 'text-neon-cyan/85',
    dot: 'bg-neon-cyan shadow-neon-cyan',
    bar: 'bg-neon-cyan shadow-neon-cyan',
    pct: 'text-neon-cyan/55',
  },
  mars: {
    title: 'text-accent-300/90',
    dot: 'bg-accent-300 shadow-[0_0_12px_rgb(var(--accent-400)_/_0.85)]',
    bar: 'bg-accent-300 shadow-[0_0_24px_rgb(var(--accent-400)_/_0.5)]',
    pct: 'text-accent-300/60',
  },
};

/**
 * Full-viewport boot overlay. Reads drei's loading manager via useProgress and
 * shows real loading percentage. Fades out smoothly once active flips false
 * AND progress hits 100, then unmounts so canvas events go through. The
 * headline is configurable so each surface (Earth, Moon …) can announce
 * its own boot string.
 */
export default function LoadingScreen({ title = DEFAULT_TITLE, tone = 'cyan' }: Props) {
  const { progress, active } = useProgress();
  const [visible, setVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);
  const c = TONES[tone];

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
        <div className={`flex items-center gap-2.5 text-[10px] uppercase tracking-[0.4em] ${c.title}`}>
          <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${c.dot}`} />
          {title}
        </div>
        <div className="h-px w-60 overflow-hidden bg-white/8">
          <div
            className={`h-full ${c.bar}`}
            style={{
              width: `${progress}%`,
              transition: 'width 200ms ease-out',
            }}
          />
        </div>
        <div className={`text-[9px] tracking-[0.3em] ${c.pct}`}>
          {Math.floor(progress)}%
        </div>
      </div>
    </div>
  );
}
