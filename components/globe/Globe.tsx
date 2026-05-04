'use client';

import { OrbitControls, Stars } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SUN_POSITION } from '@/lib/sun';
import Atmosphere from './Atmosphere';
import Clouds from './Clouds';
import Earth from './Earth';

const IDLE_RESUME_MS = 3000;
const AUTO_ROTATE_SPEED = 0.05; // rad/s

export default function Globe() {
  const groupRef = useRef<THREE.Group>(null);
  const lastInteractionRef = useRef<number>(performance.now());
  const [autoRotate, setAutoRotate] = useState(true);
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame((_, delta) => {
    const now = performance.now();
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += AUTO_ROTATE_SPEED * delta;
    }
    if (!autoRotate && now - lastInteractionRef.current > IDLE_RESUME_MS) {
      setAutoRotate(true);
    }
  });

  const onUserInteract = () => {
    lastInteractionRef.current = performance.now();
    if (autoRotate) setAutoRotate(false);
  };

  return (
    <>
      {/* Lights — keep ambient low so night-side city lights stay visible */}
      <ambientLight intensity={0.05} color="#9bd6ff" />
      <directionalLight
        position={SUN_POSITION}
        intensity={1.5}
        color="#fff5e0"
      />

      {/* Starfield + nebula backdrop */}
      <Stars
        radius={60}
        depth={40}
        count={6000}
        factor={3}
        saturation={0}
        fade
        speed={0.5}
      />
      <NebulaBackdrop />

      {/* Earth + clouds rotate together. Earth renders first so the
          atmosphere rim composites on top. */}
      <group ref={groupRef}>
        <Earth />
        <Clouds />
      </group>
      <Atmosphere />

      <OrbitControls
        enablePan={false}
        enableZoom
        enableRotate
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        zoomSpeed={0.6}
        minDistance={1.6}
        maxDistance={4}
        onStart={onUserInteract}
        onChange={onUserInteract}
      />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.2}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0006, 0.0006)}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

function NebulaBackdrop() {
  const meshRef = useRef<THREE.Mesh>(null);
  return (
    <mesh ref={meshRef} position={[-12, 6, -20]}>
      <planeGeometry args={[28, 28]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        uniforms={{}}
        vertexShader={`
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          void main(){
            vec2 c = vUv - 0.5;
            float d = length(c);
            float g = smoothstep(0.5, 0.0, d);
            vec3 col = mix(vec3(0.05,0.08,0.18), vec3(0.35,0.55,1.0), g);
            float alpha = pow(g, 2.5) * 0.25;
            gl_FragColor = vec4(col, alpha);
          }
        `}
      />
    </mesh>
  );
}
