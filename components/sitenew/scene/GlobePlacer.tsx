'use client';

import { useEffect, useRef, useState } from 'react';
import { SLOTS, activeSection, globeTransform } from './globeSlots';

/**
 * DEV-ONLY live globe placement tool. Inert unless the URL has `?place`.
 *
 * Usage on the live site: visit /siteNEW?place=1
 *   • Scroll normally to the section you want to position.
 *   • Arrow keys → move the globe (Shift = bigger step)
 *   • [ ] or - = → shrink / grow the globe (Shift = bigger step)
 *   • on-screen buttons do the same (move + scale)
 *   • C → copy the full SLOTS block to the clipboard
 * The globe updates LIVE to exactly what you set (WYSIWYG), and the panel
 * shows the cx / cy / scale for the section you're on. Send me the copied
 * block (or a screenshot of the panel) and I paste the numbers straight in.
 */
const LABELS = ['Hero', 'Problem', 'Insight', 'Product', 'HowItWorks', 'Vision', 'CTA', 'Footer'];

type Place = Record<number, { cx: number; cy: number; scale: number }>;

const round = (v: number) => Math.round(v * 1000) / 1000;

export default function GlobePlacer() {
  const [active, setActive] = useState(0);
  const [, force] = useState(0);
  const placeRef = useRef<Place>({});
  const [enabled, setEnabled] = useState(false);

  // Active section — the SAME function the live controller uses, so the overlay
  // and the live page can never disagree about which slot is shown.
  const getActive = () => activeSection();

  // Apply a change to the active section's placement and re-render.
  const mutate = (cb: (p: { cx: number; cy: number; scale: number }) => void) => {
    const a = getActive();
    const p = placeRef.current[a] ?? { cx: 0.5, cy: 0.5, scale: 1 };
    cb(p);
    p.cx = round(p.cx);
    p.cy = round(p.cy);
    p.scale = round(Math.max(0.2, p.scale));
    placeRef.current[a] = p;
    force((n) => n + 1);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!new URLSearchParams(window.location.search).has('place')) return;
    setEnabled(true);

    // Seed overrides from the current SLOTS so nothing jumps when enabled.
    const place: Place = {};
    SLOTS.forEach((s, i) => (place[i] = { cx: s.cx, cy: s.cy, scale: s.scale }));
    placeRef.current = place;
    (window as unknown as { __globePlace?: Place }).__globePlace = place;

    let raf = 0;
    let cur = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const a = getActive();
      if (a !== cur) {
        cur = a;
        setActive(a);
      }
      // HARD LOCK: render the active section's tuned slot directly — the EXACT
      // same mapping the live controller uses (globeTransform of slot[active]),
      // so what you see here is byte-identical to what ships.
      const g = document.getElementById('globe-transform');
      if (g) {
        const o = placeRef.current[a] ?? { cx: 0.5, cy: 0.5, scale: 1 };
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const baseW = g.offsetWidth || vw;
        const baseH = g.offsetHeight || vh;
        g.style.transform = globeTransform(o.cx, o.cy, o.scale, vw, vh, baseW, baseH);
        g.style.filter = 'brightness(1)';
        g.style.opacity = '1';
      }
    };
    raf = requestAnimationFrame(loop);

    const onKey = (e: KeyboardEvent) => {
      const big = e.shiftKey;
      const posStep = big ? 0.04 : 0.01;
      const sclStep = big ? 0.1 : 0.02;
      let handled = true;
      switch (e.key) {
        case 'ArrowLeft': mutate((p) => (p.cx -= posStep)); break;
        case 'ArrowRight': mutate((p) => (p.cx += posStep)); break;
        case 'ArrowUp': mutate((p) => (p.cy -= posStep)); break;
        case 'ArrowDown': mutate((p) => (p.cy += posStep)); break;
        case '[':
        case '-':
        case '_': mutate((p) => (p.scale -= sclStep)); break;
        case ']':
        case '=':
        case '+': mutate((p) => (p.scale += sclStep)); break;
        case 'c':
        case 'C': navigator.clipboard?.writeText(slotsText(placeRef.current)); break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      delete (window as unknown as { __globePlace?: Place }).__globePlace;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!enabled) return null;
  const p = placeRef.current[active] ?? { cx: 0.5, cy: 0.5, scale: 1 };

  const Btn = ({ label, on }: { label: string; on: () => void }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={on}
      style={{
        font: '13px monospace', color: '#05080F', background: '#7CFFB2',
        border: 'none', borderRadius: 4, padding: '4px 0', cursor: 'pointer',
        fontWeight: 'bold', minWidth: 34,
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        position: 'fixed', left: 12, top: 12, zIndex: 100000,
        font: '12px/1.5 monospace', color: '#7CFFB2',
        background: 'rgba(0,0,0,0.85)', border: '1px solid #1f5', borderRadius: 6,
        padding: '10px 12px', width: 340, pointerEvents: 'auto',
      }}
    >
      <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: 4 }}>
        GLOBE PLACER · §{active} {LABELS[active]}
      </div>
      <div style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>
        cx {p.cx.toFixed(3)} · cy {p.cy.toFixed(3)} · <b>scale {p.scale.toFixed(3)}</b>
      </div>

      {/* SIZE controls — the headline action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ width: 46, color: '#9aa' }}>SIZE</span>
        <Btn label="––" on={() => mutate((q) => (q.scale -= 0.1))} />
        <Btn label="–" on={() => mutate((q) => (q.scale -= 0.02))} />
        <Btn label="+" on={() => mutate((q) => (q.scale += 0.02))} />
        <Btn label="++" on={() => mutate((q) => (q.scale += 0.1))} />
      </div>

      {/* POSITION controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ width: 46, color: '#9aa' }}>MOVE</span>
        <Btn label="◀" on={() => mutate((q) => (q.cx -= 0.01))} />
        <Btn label="▶" on={() => mutate((q) => (q.cx += 0.01))} />
        <Btn label="▲" on={() => mutate((q) => (q.cy -= 0.01))} />
        <Btn label="▼" on={() => mutate((q) => (q.cy += 0.01))} />
      </div>

      <div style={{ color: '#9aa' }}>
        keys: ←→↑↓ move · [ ] or - + size · Shift = big · C = copy all
      </div>
      <div style={{ color: '#9aa', marginTop: 4 }}>
        Set each section, press C, send me the copy.
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
