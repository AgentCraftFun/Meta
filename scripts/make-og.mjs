/**
 * Build-time OG image generator for /siteNEW. Composes a 1200×630 card from the
 * optimized day texture (circular-masked "globe") + a dark grade + tactical
 * brackets + title text. Output: public/og/sitenew-og.png
 *
 * Run: node scripts/make-og.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(root, 'public', 'og');
mkdirSync(OUT_DIR, { recursive: true });

const W = 1200;
const H = 630;
const GLOBE = 560;

// Circular-masked, blue-graded globe from the day texture.
const globeMask = Buffer.from(
  `<svg width="${GLOBE}" height="${GLOBE}"><circle cx="${GLOBE / 2}" cy="${GLOBE / 2}" r="${GLOBE / 2}" fill="#fff"/></svg>`
);
const globe = await sharp(join(root, 'public', 'textures', 'sitenew', 'earth_day_2k.webp'))
  .resize(GLOBE, GLOBE, { fit: 'cover', position: 'centre' })
  .modulate({ brightness: 0.8, saturation: 0.85 })
  .tint({ r: 200, g: 225, b: 255 })
  .composite([{ input: globeMask, blend: 'dest-in' }])
  .png()
  .toBuffer();

// Foreground: grade + brackets + text overlay.
const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="78%" cy="50%" r="55%">
      <stop offset="0%" stop-color="rgba(34,211,238,0.25)"/>
      <stop offset="100%" stop-color="rgba(34,211,238,0)"/>
    </radialGradient>
    <linearGradient id="vig" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgba(5,8,15,0.95)"/>
      <stop offset="55%" stop-color="rgba(5,8,15,0.55)"/>
      <stop offset="100%" stop-color="rgba(5,8,15,0.1)"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <!-- tactical corner brackets -->
  <g stroke="#22D3EE" stroke-width="3" fill="none" opacity="0.8">
    <path d="M40 40 h34 M40 40 v34"/>
    <path d="M${W - 40} 40 h-34 M${W - 40} 40 v34"/>
    <path d="M40 ${H - 40} h34 M40 ${H - 40} v-34"/>
    <path d="M${W - 40} ${H - 40} h-34 M${W - 40} ${H - 40} v-34"/>
  </g>
  <text x="80" y="150" fill="#22D3EE" font-family="monospace" font-size="22" letter-spacing="10">● LIVE · GLOBAL SIGNAL</text>
  <text x="76" y="320" fill="#FFFFFF" font-family="sans-serif" font-size="140" font-weight="800" letter-spacing="-4">MetaMap</text>
  <text x="80" y="400" fill="#A5F3FC" font-family="monospace" font-size="26" letter-spacing="6">THE WORLD'S ATTENTION, MAPPED IN REAL TIME.</text>
  <text x="80" y="470" fill="#94A3B8" font-family="sans-serif" font-size="28">A live geopolitical attention dashboard for on-chain traders.</text>
  <text x="80" y="560" fill="#64748B" font-family="monospace" font-size="20" letter-spacing="6">38 COUNTRIES · LIVE SIGNAL · V1.0</text>
</svg>
`);

await sharp({
  create: { width: W, height: H, channels: 4, background: { r: 5, g: 8, b: 15, alpha: 1 } },
})
  .composite([
    { input: globe, left: W - GLOBE - 10, top: (H - GLOBE) / 2 },
    { input: overlay, left: 0, top: 0 },
  ])
  .png()
  .toFile(join(OUT_DIR, 'sitenew-og.png'));

console.log('✓ public/og/sitenew-og.png');
