'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { z } from '../system/motion';
import { useSceneStore } from '../system/useSceneStore';
import { shouldUseFallback } from './deviceTier';
import { globeTransform } from './globeSlots';
import SceneMoon from './SceneMoon';

/**
 * §5 VISION — the real 3D MOON, parked on the "Moon" product card.
 *
 * A second, lightweight fixed WebGL layer (the travelling-earth canvas can't be
 * reused — its whole canvas is CSS-transformed per globe slot, so a second body
 * at a different screen spot needs its own layer). The moon does NOT travel: it
 * sits at a fixed slot over the Moon card (tuned via ?place: cx 0.50 / cy 0.52 /
 * scale 0.44, matching the earth's framing so the same scale reads the same
 * size) and TASTEFULLY FADES in/out with §5 centredness, driven by the same one
 * `globeTravel` signal the earth uses — so it appears exactly as the globe docks
 * next door, and leaves as you scroll on.
 *
 * Desktop-live only: reduced-motion / mobile render the card's 2D fallback, so
 * this layer isn't mounted there at all (same gate as the earth canvas).
 */

const VISION_INDEX = 5;
const MOON_SLOT = { cx: 0.5, cy: 0.52, scale: 0.44 };

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export default function MoonCanvas() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Place the moon stage once (+ on resize) and fade it from §5 centredness.
  useEffect(() => {
    if (!mounted || shouldUseFallback(reduced)) return;
    const el = elRef.current;
    if (!el) return;

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    let baseW = vw;
    let baseH = vh;
    const measure = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      baseW = el.offsetWidth || vw;
      baseH = el.offsetHeight || vh;
    };
    measure();
    const settle = window.setTimeout(measure, 300);
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const travel = useSceneStore.getState().globeTravel;
      const centred = Math.max(0, 1 - Math.abs(travel - VISION_INDEX));
      const opacity =
        travel <= VISION_INDEX
          ? smoothstep(0.8, 0.99, centred)
          : smoothstep(0.88, 1.0, centred);
      // ENTER (travel < 5): rise WITH the section. The snap pans the whole §5
      // strip by (VISION_INDEX − travel) viewport-heights as it settles, so
      // offset cy by exactly that — the moon stays glued to its card and rises UP
      // into place with it. (Pinning it to a fixed point made the rising section
      // slide past it, which read as the moon drifting DOWN.) EXIT (travel ≥ 5):
      // hold the settled slot — stay in place while only the Earth travels on.
      const cy =
        travel < VISION_INDEX ? MOON_SLOT.cy + (VISION_INDEX - travel) : MOON_SLOT.cy;
      el.style.transform = globeTransform(
        MOON_SLOT.cx,
        cy,
        MOON_SLOT.scale,
        vw,
        vh,
        baseW,
        baseH
      );
      el.style.opacity = opacity.toFixed(3);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
    };
  }, [mounted, reduced]);

  if (!mounted || shouldUseFallback(reduced)) return null;

  return (
    <div
      id="moon-stage"
      aria-hidden
      className="pointer-events-none fixed inset-0"
      // Clip this full-screen stage to the moon's column (left of it is the earth
      // card). Stacking transparent canvases hazes what's beneath, so the earth
      // must NOT sit under this stage — that was the "not solid" look.
      style={{ zIndex: z.earth, clipPath: 'inset(0 36% 0 36%)' }}
    >
      <div
        ref={elRef}
        id="moon-transform"
        className="absolute inset-0"
        style={{
          transformOrigin: 'center center',
          opacity: 0,
          willChange: 'transform, opacity',
        }}
      >
        <Canvas
          dpr={[1, 1.75]}
          resize={{ offsetSize: true }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', depth: true, stencil: false }}
          camera={{ position: [0, 0, 4], fov: 30, near: 0.1, far: 100 }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.0;
            gl.outputColorSpace = SRGBColorSpace;
            gl.setClearColor(0x000000, 0); // transparent — the clean #05080F page bg shows behind = solid moon
          }}
        >
          <Suspense fallback={null}>
            {/* Warm key + cool fill + soft ambient → a lit moon with a defined
                terminator, matching the /moon scene's read. */}
            <directionalLight position={[5, 2, 3]} intensity={1.7} color="#fffaf0" />
            {/* Lifted cool fill + ambient so the shadow side reads as a solid
                moon, not a see-through dark crescent against the page bg. */}
            <directionalLight position={[-4, -1, -3]} intensity={0.6} color="#5a86c0" />
            <ambientLight intensity={0.34} color="#41506e" />
            <group rotation={[0.18, 0, 0.06]}>
              <SceneMoon rotationSpeed={0.04} />
            </group>
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
