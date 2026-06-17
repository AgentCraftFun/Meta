/**
 * Ambient Mars backdrop for /MarsTracker. Pure presentational (no hooks), so it
 * renders on the server. Echoes the /siteMARS language without pulling in the
 * scroll-coupled 3D scene system: the real 8k Mars texture as a large planet
 * "rising" from the bottom, faint orbital rings, a deterministic starfield, a
 * warm atmospheric glow, and a contrast vignette so the console stays readable.
 */

// Deterministic star positions — index math (never Math.random) to avoid any
// SSR/CSR hydration mismatch.
const STARS = Array.from({ length: 64 }).map((_, i) => ({
  left: ((i * 47) % 100) + (i % 3) * 0.7,
  top: ((i * 71) % 100) + (i % 5) * 0.4,
  size: i % 11 === 0 ? 2 : 1,
  opacity: ((i * 17) % 70) / 100 + 0.18,
}));

export default function MarsBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Starfield */}
      <div className="absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
            }}
          />
        ))}
      </div>

      {/* Orbital rings — concentric, centred on the planet below the fold, very
          slow counter-rotation. */}
      <div className="absolute left-1/2 top-[118%] -translate-x-1/2 -translate-y-1/2">
        {[1, 1.55, 2.15, 2.85].map((scale) => (
          <span
            key={scale}
            className="absolute rounded-full border border-accent-400/10"
            style={{
              width: `${scale * 760}px`,
              height: `${scale * 760}px`,
              left: `${-scale * 380}px`,
              top: `${-scale * 380}px`,
            }}
          />
        ))}
      </div>

      {/* Warm atmospheric glow blooming off the planet's limb. */}
      <div
        className="absolute left-1/2 top-[78%] h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px]"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgb(var(--accent-400) / 0.28) 0%, rgb(var(--accent-400) / 0.08) 38%, transparent 65%)',
        }}
      />

      {/* Mars — the real 8k texture as a large sphere rising from the bottom.
          Inset shadows fake the terminator/limb shading so it reads spherical. */}
      <div
        className="absolute left-1/2 top-[122%] h-[1180px] w-[1180px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          backgroundImage: 'url(/textures/mars_tracker_bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          boxShadow:
            'inset -70px -90px 200px rgba(0,0,0,0.9), inset 60px 40px 160px rgba(0,0,0,0.45), 0 0 140px rgb(var(--accent-400) / 0.22)',
        }}
      />

      {/* Contrast vignette — darkens the centre/top where the console sits while
          letting Mars glow at the lower edge (same lesson as the /siteMARS CTA). */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 130% 90% at 50% 26%, rgba(5,8,15,0.46) 0%, rgba(5,8,15,0.72) 58%, rgba(5,8,15,0.9) 100%)',
        }}
      />
      {/* Top fade into pure background so the header reads cleanly. */}
      <div
        className="absolute inset-x-0 top-0 h-[42%]"
        style={{ background: 'linear-gradient(to bottom, #05080F 6%, transparent)' }}
      />
    </div>
  );
}
