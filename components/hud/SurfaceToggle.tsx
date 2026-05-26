'use client';

import { usePathname } from 'next/navigation';
import {
  type Surface,
  useSurfaceTransition,
} from '@/lib/useSurfaceTransition';

const SURFACES: { id: Surface; label: string }[] = [
  { id: 'earth', label: 'Earth' },
  { id: 'moon', label: 'Moon' },
];

function activeSurface(path: string): Surface {
  if (path.startsWith('/moon')) return 'moon';
  return 'earth';
}

export default function SurfaceToggle() {
  const pathname = usePathname() ?? '/';
  const active = activeSurface(pathname);
  const start = useSurfaceTransition((s) => s.start);
  const phase = useSurfaceTransition((s) => s.phase);

  const navigate = (target: Surface) => {
    if (target === active) return;
    if (phase !== 'idle') return; // already transitioning
    start(active, target);
  };

  return (
    <div className="pointer-events-auto fixed right-5 top-[60px] z-30 flex items-center gap-1.5 rounded-sm border border-white/10 bg-black/40 p-1 font-mono backdrop-blur-xl">
      {SURFACES.map((s, i) => {
        const isActive = s.id === active;
        return (
          <span key={s.id} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate(s.id)}
              aria-current={isActive ? 'page' : undefined}
              disabled={isActive || phase !== 'idle'}
              className={[
                'rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-[0.32em] transition-all disabled:cursor-default',
                isActive
                  ? 'bg-neon-cyan/90 text-black shadow-neon-cyan'
                  : 'border border-transparent text-white/55 hover:border-white/15 hover:text-white/85',
              ].join(' ')}
            >
              {s.label}
            </button>
            {i === 0 && <span className="text-white/25">◯</span>}
          </span>
        );
      })}
    </div>
  );
}
