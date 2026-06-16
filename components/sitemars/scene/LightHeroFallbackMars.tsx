'use client';

import { z, color, rgba } from '@/components/sitenew/system/motion';

/**
 * Static, NON-WebGL Mars frame — the Mars fork of
 * components/sitenew/scene/LightHeroFallback.tsx. Rendered instead of the live
 * canvas on reduced-motion / mobile-low-power / no-WebGL. Zero animation.
 *
 * Same composition as the Earth fallback (spherical clip + rim + dark grade,
 * planet parked to the right matching waypoint 0), but it samples the real Mars
 * surface (public/textures/8k_mars.jpg) and swaps Earth's cool blue grade for a
 * warm, dusty rim so it reads as the red planet.
 */

/** Warm, dusty rim accent for Mars (vs the Earth fallback's cyan). */
const MARS_RIM = '#E8794A';

export default function LightHeroFallbackMars() {
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
        {/* atmosphere glow — warm dusty haze */}
        <div
          className="absolute inset-[-12%] rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${rgba(MARS_RIM, 0.13)} 60%, transparent 72%)`,
            filter: 'blur(14px)',
          }}
        />
        {/* planet — real Mars texture clipped to a sphere */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundImage: 'url(/textures/8k_mars.jpg)',
            backgroundSize: '200% 100%',
            backgroundPosition: '30% 50%',
            // gentle grade — keep Mars's natural rust (no blue hue-rotate)
            filter: 'saturate(1.02) brightness(0.78)',
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
        {/* warm rim light */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `inset 14px 10px 40px ${rgba(MARS_RIM, 0.22)}, 0 0 60px ${rgba(MARS_RIM, 0.18)}`,
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
