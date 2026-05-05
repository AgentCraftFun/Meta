'use client';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
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
  // Indices below map back to that order. useTexture won't change shape
  // unless the props themselves change.
  const urls = [
    textures.day,
    textures.night ?? '',
    textures.normal ?? '',
    textures.specular ?? '',
  ].filter(Boolean) as string[];
  const loaded = useTexture(urls) as THREE.Texture[];

  // Map back to slot names by walking urls in the same order.
  const maps = useMemo(() => {
    const out: {
      day?: THREE.Texture;
      night?: THREE.Texture;
      normal?: THREE.Texture;
      specular?: THREE.Texture;
    } = {};
    let i = 0;
    if (textures.day) out.day = loaded[i++];
    if (textures.night) out.night = loaded[i++];
    if (textures.normal) out.normal = loaded[i++];
    if (textures.specular) out.specular = loaded[i++];
    return out;
    // loaded is a stable array reference unless urls change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textures.day, textures.night, textures.normal, textures.specular, loaded]);

  // Configure colour spaces + anisotropy.
  useEffect(() => {
    if (maps.day) {
      maps.day.colorSpace = THREE.SRGBColorSpace;
      maps.day.anisotropy = 8;
    }
    if (maps.night) {
      maps.night.colorSpace = THREE.SRGBColorSpace;
      maps.night.anisotropy = 8;
    }
    if (maps.normal) {
      maps.normal.colorSpace = THREE.NoColorSpace;
      maps.normal.anisotropy = 8;
    }
    if (maps.specular) {
      maps.specular.colorSpace = THREE.NoColorSpace;
      maps.specular.anisotropy = 4;
    }
  }, [maps]);

  // Build the material once based on the chosen path.
  const mat = useMemo(() => {
    if (material === 'shader') {
      if (!shader) {
        throw new Error('CelestialBody: material="shader" requires a shader prop');
      }
      const uniforms: Record<string, THREE.IUniform> = {
        ...(shader.uniforms ?? {}),
      };
      if (maps.day) uniforms.dayTexture = { value: maps.day };
      if (maps.night) uniforms.nightTexture = { value: maps.night };
      if (maps.normal) uniforms.normalMap = { value: maps.normal };
      if (maps.specular) uniforms.specularMap = { value: maps.specular };
      return new THREE.ShaderMaterial({
        uniforms,
        vertexShader: shader.vertex,
        fragmentShader: shader.fragment,
      });
    }

    return new THREE.MeshStandardMaterial({
      map: maps.day,
      normalMap: maps.normal ?? null,
      roughnessMap: maps.specular ?? null,
      metalness: standardProps?.metalness ?? 0,
      roughness: standardProps?.roughness ?? 0.9,
      bumpMap: standardProps?.useBumpFromDay ? maps.day ?? null : null,
      bumpScale: standardProps?.bumpScale ?? 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material, shader, maps, standardProps]);

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
