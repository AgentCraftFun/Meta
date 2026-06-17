'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { z } from '@/components/sitenew/system/motion';
import { useSceneStore } from '@/components/sitenew/system/useSceneStore';
import { shouldUseFallback } from '@/components/sitenew/scene/deviceTier';
import { globeTransform, measureAnchor } from '@/components/sitenew/scene/globeSlots';
import SceneJupiter from './SceneJupiter';

/**
 * §5 TOKENOMICS — the real 3D JUPITER globe on the "Buy Backs" card (replaces
 * the orb-bot). Same fixed-layer / fade / measured-anchor model as the moon
 * canvas, parked over the RIGHT card via #vision-globe-bots so it tracks the
 * card at any screen size. Desktop-live only (RM / mobile keep the 2D fallback).
 */

const VISION_INDEX = 5;
// Same camera (z 5) + slot scale the orb-bot used, which renders a unit sphere
// at ≈ the moon's on-screen size, so the three §5 bodies read consistently.
const JUPITER_SLOT = { cx: 0.77, cy: 0.52, scale: 0.55 };

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export default function JupiterCanvas() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || shouldUseFallback(reduced)) return;
    const el = elRef.current;
    if (!el) return;

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    let baseW = vw;
    let baseH = vh;
    // Centre on the measured Buy Backs card so it tracks the card at any size.
    let anchor: { cx: number; cy: number } | null = null;
    const measure = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      baseW = el.offsetWidth || vw;
      baseH = el.offsetHeight || vh;
      const a = measureAnchor('vision-globe-bots', VISION_INDEX, vw, vh);
      anchor = a ? { cx: a.cx, cy: a.cy } : null;
      // Bracket the clip window around the MEASURED card so the globe is never
      // cut and the stage never sits over the moon/earth cards. A FIXED clip
      // fraction can't track the right card (it shifts with viewport width) —
      // that mismatch was the clipping bug.
      const stage = stageRef.current;
      if (stage) {
        const cx = anchor ? anchor.cx : JUPITER_SLOT.cx;
        const half = 0.16; // half-window (fraction of vw): card half + margin
        const leftPct = Math.max(0, (cx - half) * 100);
        const rightPct = Math.max(0, (1 - cx - half) * 100);
        stage.style.clipPath = `inset(0 ${rightPct.toFixed(2)}% 0 ${leftPct.toFixed(2)}%)`;
      }
    };
    measure();
    const settle = window.setTimeout(measure, 300);
    const settle2 = window.setTimeout(measure, 1200);
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const travel = useSceneStore.getState().globeTravel;
      const centred = Math.max(0, 1 - Math.abs(travel - VISION_INDEX));
      // Fade in across the scroll-in, fast out — matches the moon/bot timing.
      const opacity =
        travel <= VISION_INDEX
          ? smoothstep(0.3, 0.88, centred)
          : smoothstep(0.88, 1.0, centred);
      // Rise WITH the section as it pans into place, then hold the settled slot.
      const baseCx = anchor ? anchor.cx : JUPITER_SLOT.cx;
      const baseCy = anchor ? anchor.cy : JUPITER_SLOT.cy;
      const cy =
        travel < VISION_INDEX ? baseCy + (VISION_INDEX - travel) : baseCy;
      el.style.transform = globeTransform(
        baseCx,
        cy,
        JUPITER_SLOT.scale,
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
      window.clearTimeout(settle2);
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
    };
  }, [mounted, reduced]);

  if (!mounted || shouldUseFallback(reduced)) return null;

  return (
    <div
      ref={stageRef}
      id="jupiter-stage"
      aria-hidden
      className="pointer-events-none fixed inset-0"
      // Clip window brackets the measured Buy Backs card (recomputed in
      // measure()), so it never sits over the earth/moon and never cuts the
      // globe. This static value is just the first-paint default.
      style={{ zIndex: z.earth, clipPath: 'inset(0 8% 0 62%)' }}
    >
      <div
        ref={elRef}
        id="jupiter-transform"
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
          camera={{ position: [0, 0, 5], fov: 30, near: 0.1, far: 100 }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.0;
            gl.outputColorSpace = SRGBColorSpace;
            gl.setClearColor(0x000000, 0); // transparent — the page #05080F shows through
          }}
        >
          <Suspense fallback={null}>
            {/* Warm key + cool fill + soft ambient → a lit gas-giant with a
                defined terminator, matching the Vision moon's read. */}
            <directionalLight position={[5, 2, 3]} intensity={1.8} color="#fff6e8" />
            <directionalLight position={[-4, -1, -3]} intensity={0.55} color="#6a86c0" />
            <ambientLight intensity={0.32} color="#48402f" />
            <group rotation={[0.16, 0, 0.05]}>
              <SceneJupiter rotationSpeed={0.04} />
            </group>
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
