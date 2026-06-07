'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect } from 'react';
import { isSnapEnabled } from './snapMode';
import { useSceneStore } from './useSceneStore';

/**
 * Maps each section's viewport progress → store.activeSection + store
 * .sectionProgress, via one GSAP ScrollTrigger per [data-sn-section] element.
 * The scene's CameraRig reads activeSection to fly between waypoints.
 *
 * A section becomes active when its top crosses viewport center; onUpdate
 * publishes 0→1 local progress while it straddles center (exactly one section
 * contains the center line at a time, so progress is unambiguous).
 *
 * REDUCED-MOTION: no triggers created (activeSection stays 0; the scene renders
 * the static fallback anyway).
 */
export default function ScrollDirector() {
  const reduced = useSceneStore((s) => s.reducedMotion);
  const setActiveSection = useSceneStore((s) => s.setActiveSection);
  const setSectionProgress = useSceneStore((s) => s.setSectionProgress);

  useEffect(() => {
    if (reduced) return;
    if (typeof window === 'undefined') return;
    // In section-snap the page does not free-scroll, so GSAP ScrollTriggers
    // would never fire — SnapStage publishes the progress instead.
    if (isSnapEnabled()) return;

    gsap.registerPlugin(ScrollTrigger);

    const els = Array.from(
      document.querySelectorAll<HTMLElement>('[data-sn-section]')
    ).sort(
      (a, b) =>
        Number(a.dataset.snSection ?? 0) - Number(b.dataset.snSection ?? 0)
    );

    const triggers = els.map((el, i) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setActiveSection(i),
        onEnterBack: () => setActiveSection(i),
        onUpdate: (self) => setSectionProgress(self.progress),
      })
    );

    ScrollTrigger.refresh();

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, [reduced, setActiveSection, setSectionProgress]);

  return null;
}
