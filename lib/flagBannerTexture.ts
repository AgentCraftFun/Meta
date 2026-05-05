import * as THREE from 'three';
import type { HeatLevel } from './types/token';

/**
 * Strict 3-colour heat system for flag banners. White / amber / red ONLY —
 * any other accent colour is the filter system's territory (cap dot).
 */
const HEAT_BG: Record<HeatLevel, string> = {
  hot: '#1a0505',
  warm: '#1a1505',
  emerging: '#0a0a14',
};

const HEAT_BORDER: Record<HeatLevel, string> = {
  hot: '#ef4444',
  warm: '#fbbf24',
  emerging: '#f1f5f9',
};

const HEAT_TEXT: Record<HeatLevel, string> = {
  hot: '#ffffff',
  warm: '#ffffff',
  emerging: '#ffffff',
};

/**
 * Render a token's symbol into a 256x128 canvas at 2:1 aspect ratio,
 * matching the banner's plane geometry. Linear filtering + mipmaps +
 * anisotropy 8 keep the text sharp at any viewing angle without the
 * RGB-split fringing that NearestFilter produced at oblique zooms.
 */
export function makeFlagBannerTexture(
  symbol: string,
  category: HeatLevel
): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = HEAT_BG[category];
  ctx.fillRect(0, 0, 256, 128);

  // 4px inner border in the heat colour.
  ctx.strokeStyle = HEAT_BORDER[category];
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 252, 124);

  // Crisp tactical mono. NOT a pixel font.
  ctx.fillStyle = HEAT_TEXT[category];
  ctx.font = 'bold 64px "JetBrains Mono", "Consolas", ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const display = symbol.slice(0, 5).toUpperCase();
  ctx.fillText(display, 128, 68);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
