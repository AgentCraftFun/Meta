'use client';

import { useEffect, useRef } from 'react';
import { globeDebug } from './GlobeStageController';

/**
 * TEMP on-screen readout of the travelling-globe state for diagnosis.
 * Remove once the travel is dialled in.
 */
export default function GlobeDebug() {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const d = globeDebug;
      if (ref.current) {
        ref.current.textContent =
          `f=${d.f.toFixed(2)}  scale=${d.scale.toFixed(3)}  op=${d.opacity.toFixed(2)}\n` +
          `tx=${d.tx.toFixed(0)} ty=${d.ty.toFixed(0)}  n=${d.n}\n` +
          `tops=[${d.tops}]  vh=${window.innerHeight}`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <pre
      ref={ref}
      className="pointer-events-none fixed left-2 top-2"
      style={{
        zIndex: 9999,
        margin: 0,
        font: '11px/1.4 monospace',
        color: '#39ff14',
        background: 'rgba(0,0,0,0.72)',
        padding: '6px 8px',
        whiteSpace: 'pre',
      }}
    />
  );
}
