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
const ORB_SLOT = { cx: 0.77, cy: 0.52, scale: 0.44 };

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

    const place = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      el.style.transform = globeTransform(
        ORB_SLOT.cx,
        ORB_SLOT.cy,
        ORB_SLOT.scale,
        vw,
        vh,
        el.offsetWidth || vw,
        el.offsetHeight || vh
      );
    };
    place();
    const settle = window.setTimeout(place, 300);
    window.addEventListener('resize', place);
    window.addEventListener('load', place);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const travel = useSceneStore.getState().globeTravel;
      const centred = Math.max(0, 1 - Math.abs(travel - VISION_INDEX));
      el.style.opacity = smoothstep(0.12, 0.85, centred).toFixed(3);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener('resize', place);
      window.removeEventListener('load', place);
    };
  }, [mounted, reduced]);

  if (!mounted || shouldUseFallback(reduced)) return null;

  return (
    <div
      id="orbbot-stage"
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: z.earth }}
    >
      <div
        ref={elRef}
        id="orbbot-transform"
        className="absolute inset-0"
        style={{ transformOrigin: 'center center', opacity: 0, willChange: 'transform, opacity' }}
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
            gl.setClearColor(0x000000, 0); // transparent — page shows through
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
              <SceneOrbbot rotationSpeed={0.4} />
            </group>
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
