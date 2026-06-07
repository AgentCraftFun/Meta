'use client';

import { useSceneStore } from './useSceneStore';

/**
 * Subtle grade overlay. Fixed, full-bleed, pointer-events-none, z-20 (with the
 * ticker). Deliberately minimal so it NEVER veils or desaturates the globe —
 * the hero must read with /siteview-level crispness:
 *   - NO full-bleed navy tint / vertical gradient (removed — that was the veil)
 *   - film grain @ 0.02, drifting
 *   - vignette = CORNERS ONLY (fully-transparent large center, edge alpha 0.22)
 *
 * REDUCED-MOTION: grain static.
 */
export default function Grade() {
  const reducedMotion = useSceneStore((s) => s.reducedMotion);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 20 }}>
      {/* corner-only vignette — transparent center, faint edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(5,8,15,0) 62%, rgba(5,8,15,0.22) 100%)',
        }}
      />

      {/* film grain — oversized so the drift never reveals an edge */}
      <div
        className="absolute"
        style={{
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          opacity: 0.02,
          mixBlendMode: 'overlay',
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          animation: reducedMotion ? 'none' : 'sn-grain-drift 8s linear infinite',
        }}
      />

      <style jsx>{`
        @keyframes sn-grain-drift {
          0% {
            transform: translate3d(0, 0, 0);
          }
          25% {
            transform: translate3d(-4%, 3%, 0);
          }
          50% {
            transform: translate3d(3%, -2%, 0);
          }
          75% {
            transform: translate3d(-2%, -3%, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}
