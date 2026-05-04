'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useSafeTexture } from '@/lib/useSafeTexture';

type Props = {
  sunDirection: THREE.Vector3;
};

const TEXTURE_PATHS = {
  day: '/textures/earth_day.jpg',
  normal: '/textures/earth_normal.jpg',
  specular: '/textures/earth_specular.jpg',
};

function makeFallbackTexture(kind: 'day' | 'normal' | 'specular') {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1024;
  const ctx = c.getContext('2d')!;
  if (kind === 'day') {
    // Ocean gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0.0, '#0a1f3f');
    grad.addColorStop(0.45, '#0e3a82');
    grad.addColorStop(0.5, '#1d63c8');
    grad.addColorStop(0.55, '#0e3a82');
    grad.addColorStop(1.0, '#0a1f3f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Crude continent blobs (very approximate)
    ctx.fillStyle = '#2c5a31';
    const continents = [
      // [centerX, centerY, radiusX, radiusY]
      [380, 420, 220, 180], // N. America
      [420, 700, 130, 220], // S. America
      [1020, 360, 220, 150], // Europe + N. Africa west
      [1100, 600, 200, 260], // Africa
      [1340, 380, 360, 200], // Asia
      [1500, 760, 130, 90], // Australia
      [1720, 520, 90, 50], // misc
    ];
    for (const [cx, cy, rx, ry] of continents) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Speckle
    ctx.fillStyle = '#3d7a44';
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 2048;
      const y = 80 + Math.random() * 880;
      const r = 2 + Math.random() * 8;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Polar caps
    ctx.fillStyle = '#e8f3ff';
    ctx.fillRect(0, 0, 2048, 60);
    ctx.fillRect(0, 970, 2048, 54);
  } else if (kind === 'specular') {
    // Bright = ocean, dark = land. Mirror the day map roughly.
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, 0, 2048, 1024);
    ctx.fillStyle = '#222222';
    const continents = [
      [380, 420, 220, 180],
      [420, 700, 130, 220],
      [1020, 360, 220, 150],
      [1100, 600, 200, 260],
      [1340, 380, 360, 200],
      [1500, 760, 130, 90],
    ];
    for (const [cx, cy, rx, ry] of continents) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // neutral normal map (flat)
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, 2048, 1024);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace =
    kind === 'day' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export default function Earth({ sunDirection: _sunDirection }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);

  const day = useSafeTexture(TEXTURE_PATHS.day);
  const normal = useSafeTexture(TEXTURE_PATHS.normal);
  const specular = useSafeTexture(TEXTURE_PATHS.specular);

  const fallback = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return {
      day: makeFallbackTexture('day'),
      normal: makeFallbackTexture('normal'),
      specular: makeFallbackTexture('specular'),
    };
  }, []);

  const dayMap = day ?? fallback?.day ?? null;
  const normalMap = normal ?? fallback?.normal ?? null;
  const specMap = specular ?? fallback?.specular ?? null;

  if (dayMap) dayMap.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <sphereGeometry args={[1, 128, 128]} />
      <meshPhongMaterial
        map={dayMap ?? undefined}
        normalMap={normalMap ?? undefined}
        normalScale={new THREE.Vector2(0.85, 0.85)}
        specularMap={specMap ?? undefined}
        specular={new THREE.Color('#3a76b8')}
        shininess={22}
        emissive={new THREE.Color('#0a1428')}
        emissiveIntensity={0.08}
      />
    </mesh>
  );
}
