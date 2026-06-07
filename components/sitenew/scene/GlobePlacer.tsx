'use client';

import { useEffect, useRef, useState } from 'react';
import { SLOTS } from './globeSlots';

/**
 * DEV-ONLY live globe placement tool. Inert unless the URL has `?place`.
 *
 * Usage on the live site: visit /siteNEW?place=1
 *   • Scroll normally to the section you want to position.
 *   • Arrow keys  → move the globe (Shift = bigger step)
 *   • [ and ]     → shrink / grow the globe (Shift = bigger step)
 *   • C           → copy the full SLOTS block to the clipboard
 * The globe updates LIVE to exactly what you set (WYSIWYG), and the panel
 * shows the cx / cy / scale for the section you're on. Send me the copied
 * block (or a screenshot of the panel) and I paste the numbers straight in.
 */
const LABELS = ['Hero', 'Problem', 'Insight', 'Product', 'HowItWorks', 'Vision', 'CTA', 'Footer'];

type Place = Record<number, { cx: number; cy: number; scale: number }>;

export default function GlobePlacer() {
  const [active, setActive] = useState(0);
  const [, force] = useState(0);
  const placeRef = useRef<Place>({});
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!new URLSearchParams(window.location.search).has('place')) return;
    setEnabled(true);

    // Seed overrides from the current SLOTS so nothing jumps when enabled.
    const place: Place = {};
    SLOTS.forEach((s, i) => (place[i] = { cx: s.cx, cy: s.cy, scale: s.scale }));
    placeRef.current = place;
    (window as unknown as { __globePlace?: Place }).__globePlace = place;

    const sections = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-sn-section]')).sort(
        (a, b) => Number(a.dataset.snSection) - Number(b.dataset.snSection)
      );

    // Track the active section (last whose top passed viewport centre) each frame.
    let raf = 0;
    let cur = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const secs = sections();
      const center = window.innerHeight / 2;
      let a = 0;
      secs.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= center + 0.5) a = i;
      });
      if (a !== cur) {
        cur = a;
        setActive(a);
      }
    };
    raf = requestAnimationFrame(loop);

    const onKey = (e: KeyboardEvent) => {
      const center = window.innerHeight / 2;
      const secs = sections();
      let a = 0;
      secs.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= center + 0.5) a = i;
      });
      const p = placeRef.current[a] ?? { cx: 0.5, cy: 0.5, scale: 1 };
      const big = e.shiftKey;
      const posStep = big ? 0.04 : 0.01;
      const sclStep = big ? 0.05 : 0.02;
      let handled = true;
      switch (e.key) {
        case 'ArrowLeft': p.cx -= posStep; break;
        case 'ArrowRight': p.cx += posStep; break;
        case 'ArrowUp': p.cy -= posStep; break;
        case 'ArrowDown': p.cy += posStep; break;
        case '[': p.scale = Math.max(0.2, p.scale - sclStep); break;
        case ']': p.scale += sclStep; break;
        case 'c':
        case 'C':
          navigator.clipboard?.writeText(slotsText(placeRef.current));
          break;
        default: handled = false;
      }
      if (handled) {
        e.preventDefault();
        p.cx = Math.round(p.cx * 1000) / 1000;
        p.cy = Math.round(p.cy * 1000) / 1000;
        p.scale = Math.round(p.scale * 1000) / 1000;
        placeRef.current[a] = p;
        force((n) => n + 1);
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      delete (window as unknown as { __globePlace?: Place }).__globePlace;
    };
  }, []);

  if (!enabled) return null;
  const p = placeRef.current[active] ?? { cx: 0.5, cy: 0.5, scale: 1 };

  return (
    <div
      style={{
        position: 'fixed', left: 12, top: 12, zIndex: 100000,
        font: '12px/1.5 monospace', color: '#7CFFB2',
        background: 'rgba(0,0,0,0.82)', border: '1px solid #1f5', borderRadius: 6,
        padding: '10px 12px', width: 320, pointerEvents: 'auto', whiteSpace: 'pre-wrap',
      }}
    >
      <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: 4 }}>
        GLOBE PLACER · §{active} {LABELS[active]}
      </div>
      <div style={{ color: '#fff', fontSize: 14 }}>
        cx {p.cx.toFixed(3)}  cy {p.cy.toFixed(3)}  scale {p.scale.toFixed(3)}
      </div>
      <div style={{ color: '#9aa', marginTop: 6 }}>
        ←→ move x · ↑↓ move y · [ ] size · Shift=big · C=copy all
      </div>
      <div style={{ color: '#9aa', marginTop: 6 }}>
        Scroll to a section, position its globe, then press C and send me the copy
        (or screenshot this box).
      </div>
    </div>
  );
}

function slotsText(place: Place): string {
  return SLOTS.map((s, i) => {
    const o = place[i] ?? s;
    return `${i}: cx ${o.cx.toFixed(3)}, cy ${o.cy.toFixed(3)}, scale ${o.scale.toFixed(3)}  (${LABELS[i]})`;
  }).join('\n');
}
