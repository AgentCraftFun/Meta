'use client';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * /siteNEW Vision "Bots" model — the uploaded orb-bot glTF (public/scene.gltf),
 * normalized to a unit bounding sphere so it reads the SAME on-screen size as
 * the earth and moon (radius-1 bodies) at the shared slot scale. Rotates gently.
 *
 * The shared loaded scene is used directly (one instance only) — no clone, so
 * the rigged/skinned meshes keep their skeleton binding. Normalisation is done
 * with wrapper groups, never by mutating the model transform.
 */

const MODEL = '/scene.gltf';

export default function SceneOrbbot({ rotationSpeed = 0.35 }: { rotationSpeed?: number }) {
  const { scene } = useGLTF(MODEL);
  const spin = useRef<THREE.Group>(null);

  const { scale, offset } = useMemo(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        const m = mesh.material as THREE.MeshStandardMaterial | undefined;
        if (m) m.envMapIntensity = 1.15; // let the baked env light the metal
      }
    });
    // Size by the BODY only (exclude the tall antenna — it otherwise inflates the
    // bounds in every axis and shrinks the orb). The body ≈ spherical, so its
    // largest dimension is its diameter → normalise to ~2 units so the orb reads
    // ≈ the earth / moon disc. The antenna just overflows, like a real antenna.
    scene.updateMatrixWorld(true);
    const bodyBox = new THREE.Box3();
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && !o.name.toLowerCase().includes('antenna')) {
        bodyBox.expandByObject(mesh);
      }
    });
    const size = bodyBox.getSize(new THREE.Vector3());
    const span = Math.max(size.x, size.y, size.z) || 1;
    return { scale: 2.0 / span, offset: bodyBox.getCenter(new THREE.Vector3()) };
  }, [scene]);

  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += rotationSpeed * dt;
  });

  return (
    <group ref={spin}>
      <group
        scale={scale}
        position={[-offset.x * scale, -offset.y * scale, -offset.z * scale]}
      >
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload(MODEL);
