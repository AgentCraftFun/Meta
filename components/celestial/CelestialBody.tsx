'use client';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

export type CelestialTextures = {
  day: string;
  night?: string;
  normal?: string;
  specular?: string;
};

export type CelestialShader = {
  vertex: string;
  fragment: string;
  /** Extra uniforms beyond the texture maps (e.g. sunDirection). */
  uniforms?: Record<string, THREE.IUniform>;
};

export type StandardMaterialProps = {
  /** Default 0.9 */
  roughness?: number;
  /** Default 0.0 */
  metalness?: number;
  /**
   * When true, the day texture is also bound as bumpMap so the surface gets
   * crater / terrain depth without a separate height map. Useful for the
   * moon and other dust-bodies whose albedo doubles as elevation cue.
   */
  useBumpFromDay?: boolean;
  /** Default 0 (no bump). Typical values 0.01–0.05. */
  bumpScale?: number;
};

type Props = {
  textures: CelestialTextures;
  /** 'shader' uses a custom ShaderMaterial; 'standard' uses MeshStandardMaterial. */
  material?: 'standard' | 'shader';
  shader?: CelestialShader;
  /** Tuning for the standard MeshStandardMaterial path. Ignored in shader mode. */
  standardProps?: StandardMaterialProps;
  radius?: number;
  segments?: number;
  /** Y-axis rotation in rad/s. 0 = static. */
  rotationSpeed?: number;
};

/**
 * Generic celestial body: a sphere with parametric textures, geometry, and
 * material. Earth uses the shader path with its custom day/night/specular
 * fragment; Moon uses the standard path with a single albedo texture.
 *
 * Texture maps are auto-loaded and bound to canonical uniform names
 * (dayTexture, nightTexture, normalMap, specularMap) when in shader mode,
 * so consumers can reference them directly in their fragment.
 */
export default function CelestialBody({
  textures,
  material = 'standard',
  shader,
  standardProps,
  radius = 1,
  segments = 128,
  rotationSpeed = 0,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Build a stable URL list ordered: day, night, normal, specular.
  const urls = [
    textures.day,
    textures.night ?? '',
    textures.normal ?? '',
    textures.specular ?? '',
  ].filter(Boolean) as string[];
  const loaded = useTexture(urls) as THREE.Texture[];

  // Pull out individual texture refs by walking urls in known order.
  // Using individual refs (not the loaded array) as deps keeps the material
  // stable across renders — drei's useTexture can return a fresh array
  // reference each render even when the underlying Textures are the same.
  let i = 0;
  const dayMap = textures.day ? loaded[i++] : undefined;
  const nightMap = textures.night ? loaded[i++] : undefined;
  const normalMap = textures.normal ? loaded[i++] : undefined;
  const specularMap = textures.specular ? loaded[i++] : undefined;

  // Build the material once. Texture colour-space + anisotropy are set
  // synchronously here, BEFORE the material is constructed, so the first
  // GL upload happens with the correct sRGB / linear flags. Doing this in
  // useEffect (post-commit) creates a race where Three uploads textures
  // as linear and the day/night blend looks washed out.
  const mat = useMemo(() => {
    if (dayMap) {
      dayMap.colorSpace = THREE.SRGBColorSpace;
      dayMap.anisotropy = 8;
    }
    if (nightMap) {
      nightMap.colorSpace = THREE.SRGBColorSpace;
      nightMap.anisotropy = 8;
    }
    if (normalMap) {
      normalMap.colorSpace = THREE.NoColorSpace;
      normalMap.anisotropy = 8;
    }
    if (specularMap) {
      specularMap.colorSpace = THREE.NoColorSpace;
      specularMap.anisotropy = 4;
    }

    if (material === 'shader') {
      if (!shader) {
        throw new Error('CelestialBody: material="shader" requires a shader prop');
      }
      const uniforms: Record<string, THREE.IUniform> = {
        ...(shader.uniforms ?? {}),
      };
      if (dayMap) uniforms.dayTexture = { value: dayMap };
      if (nightMap) uniforms.nightTexture = { value: nightMap };
      if (normalMap) uniforms.normalMap = { value: normalMap };
      if (specularMap) uniforms.specularMap = { value: specularMap };
      return new THREE.ShaderMaterial({
        uniforms,
        vertexShader: shader.vertex,
        fragmentShader: shader.fragment,
      });
    }

    return new THREE.MeshStandardMaterial({
      map: dayMap,
      normalMap: normalMap ?? null,
      roughnessMap: specularMap ?? null,
      metalness: standardProps?.metalness ?? 0,
      roughness: standardProps?.roughness ?? 0.9,
      bumpMap: standardProps?.useBumpFromDay ? dayMap ?? null : null,
      bumpScale: standardProps?.bumpScale ?? 0,
    });
    // Individual texture refs are stable across renders; deps deliberately
    // exclude the wrapping `loaded` array reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    material,
    shader,
    standardProps,
    dayMap,
    nightMap,
    normalMap,
    specularMap,
  ]);

  useFrame((_, delta) => {
    if (rotationSpeed && meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, segments, segments]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}
