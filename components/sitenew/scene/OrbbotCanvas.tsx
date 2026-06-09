'use client';

import { Environment, Lightformer } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { z } from '../system/motion';
import { useSceneStore } from '../system/useSceneStore';
import { shouldUseFallback } from './deviceTier';
import { globeTransform } from './globeSlots';
import SceneOrbbot from './SceneOrbbot';

/**
 * §5 VISION — the real 3D ORB-BOT on the "Bots" product card. A third light
 * fixed WebGL layer (sibling of the earth + moon canvases), parked at a fixed
 * slot over the Bots card at the SAME framing/size as the earth and moon, and
 * tastefully faded in/out with §5 centredness off the one `globeTravel` signal.
 * Desktop-live only (reduced-motion / mobile keep the card's 2D terminal feed).
 */

const VISION_INDEX = 5;
// Camera pulled back (z 5) so the larger orb body + antenna fit the view; the
// bigger slot scale (0.55) then renders the orb ≈ the earth/moon on screen.
const ORB_SLOT = { cx: 0.77, cy: 0.52, scale: 0.55 };

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export default function OrbbotCanvas() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
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
      // ENTER (travel ≤ 5): fade in ACROSS the scroll-in (not a late pop) so the
      // bot materialises seamlessly as it rides up into its card — 0.3 start ≈
      // when it enters view from below, full by 0.88. (The bot column is right of
      // the Earth's path, so it never overlaps.) EXIT (travel > 5): fast.
      const opacity =
        travel <= VISION_INDEX
          ? smoothstep(0.3, 0.88, centred)
          : smoothstep(0.88, 1.0, centred);
      // ENTER (travel < 5): rise WITH the section — offset cy by the section's
      // pan (VISION_INDEX − travel viewport-heights) so the bot stays glued to
      // its card and rises UP into place, instead of the rising section sliding
      // past a pinned bot (which read as it drifting DOWN). EXIT (travel ≥ 5):
      // hold the settled slot — stay in place while only the Earth travels on.
      const cy =
        travel < VISION_INDEX ? ORB_SLOT.cy + (VISION_INDEX - travel) : ORB_SLOT.cy;
      el.style.transform = globeTransform(
        ORB_SLOT.cx,
        cy,
        ORB_SLOT.scale,
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
      id="orbbot-stage"
      aria-hidden
      className="pointer-events-none fixed inset-0"
      // Clip this top stage to the bot's column so it never sits over the earth
      // or moon (stacking transparent canvases hazes what's beneath them).
      style={{ zIndex: z.earth, clipPath: 'inset(0 0 0 64%)' }}
    >
      <div
        ref={elRef}
        id="orbbot-transform"
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
            gl.setClearColor(0x000000, 0); // transparent — the clean #05080F page bg shows behind = solid bot
          }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} color="#9fb4d8" />
            <directionalLight position={[3, 4, 5]} intensity={2.2} color="#ffffff" />
            <directionalLight position={[-4, -1, -3]} intensity={0.6} color="#8fb0ff" />
            {/* Baked (network-free) reflection env so the brushed-metal shell
                reads as metal instead of flat black. frames={1} = render once. */}
            <Environment resolution={128} frames={1}>
              <color attach="background" args={['#10151f']} />
              <Lightformer intensity={2.4} position={[3, 3, 3]} scale={7} />
              <Lightformer intensity={1.1} color="#bcd3ff" position={[-3, 1, -3]} scale={7} />
              <Lightformer intensity={0.8} color="#ffffff" position={[0, -3, 2]} scale={5} />
            </Environment>
            <group rotation={[0.16, 0, 0.05]}>
              {/* 0.04 rad/s — matches the Earth's ambient spin (CameraRig) and
                  the Moon (SceneMoon) so all three bodies turn at one speed. */}
              <SceneOrbbot rotationSpeed={0.04} />
            </group>
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
