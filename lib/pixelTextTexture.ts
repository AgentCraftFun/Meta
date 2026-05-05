import * as THREE from 'three';
import type { HeatLevel } from './types/token';

const BG_COLORS: Record<HeatLevel, string> = {
  hot: '#3a0a0a',
  warm: '#3a2a05',
  emerging: '#161829',
};

const FG_COLORS: Record<HeatLevel, string> = {
  hot: '#fde7e3',
  warm: '#fff3d6',
  emerging: '#e6f7ff',
};

/**
 * Render a token's symbol into a 64x32 canvas with chunky pixel-font text
 * and return it as a CanvasTexture. THREE.NearestFilter on both min and
 * mag is the move that gives genuine 8-bit crispness when zoomed in —
 * any antialias or trilinear filtering would mush the text into a blur.
 */
export function makePixelTextTexture(
  symbol: string,
  category: HeatLevel
): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  // Background — dark heat tone so the lit text reads.
  ctx.fillStyle = BG_COLORS[category];
  ctx.fillRect(0, 0, 64, 32);

  // 1px inner outline.
  ctx.strokeStyle = FG_COLORS[category];
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, 63, 31);

  // Symbol text — Press Start 2P at low pt size renders 8x8 pixel glyphs.
  // Truncate to 5 chars so longer symbols still fit the banner cleanly.
  ctx.fillStyle = FG_COLORS[category];
  ctx.imageSmoothingEnabled = false;
  ctx.font =
    'bold 9px "Press Start 2P", "VT323", ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const display = symbol.slice(0, 5).toUpperCase();
  ctx.fillText(display, 32, 17);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
