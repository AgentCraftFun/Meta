'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, type ReactNode } from 'react';
import * as THREE from 'three';
import LoadingScreen from './LoadingScreen';

type CameraConfig = {
  position?: [number, number, number];
  fov?: number;
  near?: number;
  far?: number;
};

type Props = {
  children: ReactNode;
  camera?: CameraConfig;
  exposure?: number;
  /** When false, the LoadingScreen overlay is suppressed. Default true. */
  showLoadingScreen?: boolean;
  /** Custom title for the boot overlay. Default: "Initializing MetaMap…". */
  loadingTitle?: string;
};

const DEFAULT_CAMERA: Required<CameraConfig> = {
  position: [1.0, 0.5, 2.2],
  fov: 38,
  near: 0.1,
  far: 600,
};

const DEFAULT_EXPOSURE = 0.85;

/**
 * Generic Canvas wrapper for any celestial body scene. Sets up ACES filmic
 * tone mapping, sRGB output, retina DPR cap, and a Suspense boundary so
 * texture-loading children integrate with <LoadingScreen />.
 *
 * Pass scene contents (lights, body, atmosphere, postprocessing, controls)
 * as children. Camera and exposure can be overridden per scene.
 */
export default function Stage({
  children,
  camera,
  exposure = DEFAULT_EXPOSURE,
  showLoadingScreen = true,
  loadingTitle,
}: Props) {
  const cam = { ...DEFAULT_CAMERA, ...(camera ?? {}) };
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true,
        }}
        camera={cam}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = exposure;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
      {showLoadingScreen && <LoadingScreen title={loadingTitle} />}
    </div>
  );
}
