'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useSafeTexture } from '@/lib/useSafeTexture';

export default function Clouds() {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudMap = useSafeTexture('/textures/clouds.png');

  const fallback = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 1024;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 2048, 1024);
    for (let i = 0; i < 1400; i++) {
      const x = Math.random() * 2048;
      // Bias clouds to mid-latitudes
      const y =
        80 + Math.pow(Math.random(), 0.7) * 880 * (Math.random() < 0.5 ? 1 : 0.7);
      const r = 8 + Math.random() * 38;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.9)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.45)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uMap: { value: cloudMap ?? fallback ?? null },
        uTime: { value: 0 },
        uOpacity: { value: 0.95 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        uniform float uTime;

        float hash(vec3 p){ p = fract(p*0.3183099+0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
        float noise(vec3 p){
          vec3 i = floor(p); vec3 f = fract(p);
          vec3 u = f*f*(3.0-2.0*f);
          return mix(mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)),u.x),
                         mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)),u.x),u.y),
                     mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)),u.x),
                         mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)),u.x),u.y),u.z);
        }

        void main(){
          vUv = uv;
          vec3 n = normalize(normal);
          float d = noise(n*4.5 + vec3(uTime*0.04));
          vec3 displaced = position + n * (d - 0.5) * 0.018;
          vec4 worldPos = modelMatrix * vec4(displaced,1.0);
          vPositionW = worldPos.xyz;
          vNormalW = normalize(mat3(modelMatrix) * n);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        uniform sampler2D uMap;
        uniform float uOpacity;

        void main(){
          vec4 c = texture2D(uMap, vUv);
          vec3 viewDir = normalize(cameraPosition - vPositionW);
          float facing = clamp(dot(viewDir, normalize(vNormalW)), 0.0, 1.0);
          float edge = smoothstep(0.0, 0.45, facing);
          float a = c.a * uOpacity * edge;
          vec3 col = mix(vec3(0.78,0.84,0.95), vec3(1.0), facing);
          gl_FragColor = vec4(col * c.rgb * 1.05, a);
        }
      `,
    });
  }, [cloudMap, fallback]);

  // Keep the uniform synced if the texture loads after material creation.
  useFrame((_, delta) => {
    const m = material;
    if (cloudMap && m.uniforms.uMap.value !== cloudMap) {
      m.uniforms.uMap.value = cloudMap;
      m.needsUpdate = true;
    }
    if (meshRef.current) meshRef.current.rotation.y += 0.02 * delta;
    (m.uniforms.uTime.value as number) += delta;
  });

  return (
    <mesh ref={meshRef} scale={1.012}>
      <sphereGeometry args={[1, 96, 96]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
