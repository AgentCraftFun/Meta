'use client';

import { useEffect, useState } from 'react';
import * as THREE from 'three';

/**
 * Loads a texture without throwing into Suspense. Returns null while loading
 * or on failure, so callers can substitute a procedural fallback.
 */
export function useSafeTexture(url: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.anisotropy = 8;
        setTexture(tex);
      },
      undefined,
      () => {
        if (!cancelled) setTexture(null);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [url]);

  return texture;
}
