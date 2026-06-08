'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useSceneStore } from '../system/useSceneStore';
import { shouldUseFallback } from './deviceTier';

/**
 * §5 VISION — solid card backdrops for the Earth / Moon / Bots cards.
 *
 * The models are ONE fixed WebGL layer behind the page (z-0) and the cards are
 * transparent cutouts in front (z-10), so a normal card background can't sit
 * BEHIND a model — it would cover it. This renders the card fill INSIDE the
 * globe-stage layer (a child painted before the globe canvas), so it sits
 * behind every model disc: the sphere renders over it, and the page content
 * (frame + text) renders over the sphere. The result is a real solid card the
 * model emerges from, instead of a bare outline over a floating planet.
 *
 * Each panel tracks its card's live rect (works through the snap pan/scale) and
 * the whole layer fades with §5 centredness (same curve as the orb-bot). A
 * top-fade gradient lets the oversized model emerge from the card with no hard
 * edge across it. Desktop-live only (reduced-motion / mobile use the solid 2D
 * fallback cards, which need no backdrop).
 */

const VISION_INDEX = 5;

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export default function VisionCardBackdrops() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || shouldUseFallback(reduced)) return;

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;

      const travel = useSceneStore.getState().globeTravel;
      const centred = Math.max(0, 1 - Math.abs(travel - VISION_INDEX));
      const op = smoothstep(0.12, 0.85, centred);

      const layer = layerRef.current;
      if (layer) layer.style.opacity = op.toFixed(3);
      if (op <= 0.001) return; // hidden — don't read layout

      // Track each card's live rect (captures the snap pan + per-section scale).
      const cards = document.querySelectorAll<HTMLElement>('[data-vision-card]');
      for (let i = 0; i < cards.length; i++) {
        const panel = panelRefs.current[i];
        if (!panel) continue;
        const r = cards[i].getBoundingClientRect();
        panel.style.transform = `translate3d(${r.left.toFixed(1)}px, ${r.top.toFixed(1)}px, 0)`;
        panel.style.width = `${r.width.toFixed(1)}px`;
        panel.style.height = `${r.height.toFixed(1)}px`;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, reduced]);

  if (!mounted || shouldUseFallback(reduced)) return null;

  return (
    <div ref={layerRef} aria-hidden className="absolute inset-0" style={{ opacity: 0 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          ref={(el) => {
            panelRefs.current[i] = el;
          }}
          className="absolute left-0 top-0"
          style={{
            willChange: 'transform, width, height',
            // Solid #0B1220 card fill that fades out at the top so the oversized
            // model emerges from the card with no hard edge across the sphere.
            background:
              'linear-gradient(to bottom, rgba(11,18,32,0) 0%, rgba(11,18,32,0.85) 26%, #0B1220 42%)',
          }}
        />
      ))}
    </div>
  );
}
