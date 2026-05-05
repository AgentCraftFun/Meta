'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Surface = 'earth' | 'moon';

const SURFACES: { id: Surface; label: string; href: string }[] = [
  { id: 'earth', label: 'Earth', href: '/' },
  { id: 'moon', label: 'Moon', href: '/moon' },
];

function activeSurface(path: string): Surface {
  return path.startsWith('/moon') ? 'moon' : 'earth';
}

export default function SurfaceToggle() {
  const pathname = usePathname() ?? '/';
  const active = activeSurface(pathname);

  return (
    <div className="pointer-events-auto fixed right-5 top-5 z-30 flex items-center gap-1.5 rounded-sm border border-white/10 bg-black/40 p-1 font-mono backdrop-blur-xl">
      {SURFACES.map((s, i) => {
        const isActive = s.id === active;
        return (
          <span key={s.id} className="flex items-center gap-1.5">
            <Link
              href={s.href}
              className={[
                'rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-[0.32em] transition-all',
                isActive
                  ? 'bg-neon-cyan/90 text-black shadow-neon-cyan'
                  : 'border border-transparent text-white/55 hover:border-white/15 hover:text-white/85',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              {s.label}
            </Link>
            {i === 0 && <span className="text-white/25">◯</span>}
          </span>
        );
      })}
    </div>
  );
}
