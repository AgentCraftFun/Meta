'use client';

import { z, color } from '../system/motion';

/**
 * Static, NON-WebGL globe frame. Rendered instead of the live canvas when
 * reduced-motion / mobile-low-power / no-WebGL. Zero animation.
 *
 * NOTE (smallest-reasonable-choice): the spec calls for "one pre-rendered
 * globe WebP". The build env has no headless-GL renderer to pre-render the
 * actual 3D scene, so this composes a static globe from the real optimized
 * day texture (earth_day_2k.webp) inside a spherical clip + cyan rim + the
 * same dark grade. Same framing as waypoint 0 (planet to the right).
 */
export default function LightHeroFallback() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: z.earth, background: color.bg }}
    >
      <div
        className="absolute"
        style={{
          right: '-8%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 'min(78vh, 70vw)',
          height: 'min(78vh, 70vw)',
          // Faint so it reads as a static backdrop and every section stays
          // legible (no travel on RM/mobile to move it out of the way).
          opacity: 0.55,
        }}
      >
        {/* atmosphere glow */}
        <div
          className="absolute inset-[-12%] rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${color.cyan}22 60%, transparent 72%)`,
            filter: 'blur(14px)',
          }}
        />
        {/* planet — real day texture clipped to a sphere */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundImage: 'url(/textures/sitenew/earth_day_2k.webp)',
            backgroundSize: '200% 100%',
            backgroundPosition: '30% 50%',
            // cool blue grade to match the shader DNA
            filter: 'saturate(0.85) brightness(0.72) hue-rotate(-6deg)',
          }}
        />
        {/* spherical shading: terminator shadow from lower-left */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 68% 38%, rgba(0,0,0,0) 35%, rgba(2,6,15,0.85) 78%)',
          }}
        />
        {/* cyan rim light */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `inset 14px 10px 40px rgba(34,211,238,0.22), 0 0 60px rgba(34,211,238,0.18)`,
          }}
        />
      </div>

      {/* vertical grade to match Grade.tsx tone */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(5,8,15,0) 45%, rgba(5,8,15,0.6) 100%)',
        }}
      />
    </div>
  );
}
