'use client';

/**
 * Device capability + texture-tier detection for the /siteNEW scene. All
 * client-only; guarded for SSR. Pure functions, no React.
 */

export type TextureTier = '2k' | '4k';

type NavigatorExt = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

/** True if a WebGL context can be created at all. */
export function hasWebGL(): boolean {
  if (typeof window === 'undefined') return true; // optimistic on server
  try {
    const c = document.createElement('canvas');
    return !!(
      c.getContext('webgl2') ||
      c.getContext('webgl') ||
      c.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

function isNarrow(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches;
}

function isSaveData(): boolean {
  if (typeof navigator === 'undefined') return false;
  return Boolean((navigator as NavigatorExt).connection?.saveData);
}

function isLowMemory(): boolean {
  if (typeof navigator === 'undefined') return false;
  const mem = (navigator as NavigatorExt).deviceMemory;
  return typeof mem === 'number' && mem <= 4;
}

/** 2k on narrow viewport / saveData / low device-memory, else 4k. */
export function pickTextureTier(): TextureTier {
  return isNarrow() || isSaveData() || isLowMemory() ? '2k' : '4k';
}

/**
 * Mobile-low-power: a narrow viewport that ALSO signals constrained
 * resources. Used (with reduced-motion + no-WebGL) to drop the live canvas
 * for the static fallback frame.
 */
export function isMobileLowPower(): boolean {
  if (typeof window === 'undefined') return false;
  const cores =
    typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 8;
  return isNarrow() && (isSaveData() || isLowMemory() || cores <= 4);
}

/** Should we render the static fallback instead of the live canvas? */
export function shouldUseFallback(reducedMotion: boolean): boolean {
  return reducedMotion || !hasWebGL() || isMobileLowPower();
}
