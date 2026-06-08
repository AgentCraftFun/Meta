/**
 * Build-time texture optimizer for /siteNEW.
 *
 * Reads the original 8k earth textures (read-only — never modified) and emits
 * device-tiered WebP into public/textures/sitenew/. Two tiers:
 *   - 4k (4096×2048) — desktop / capable devices
 *   - 2k (2048×1024) — mobile / saveData / low-memory
 *
 * Target: each tier's combined payload < 4MB. Run: node scripts/optimize-sitenew-textures.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'public', 'textures');
const OUT = join(root, 'public', 'textures', 'sitenew');
mkdirSync(OUT, { recursive: true });

const SOURCES = [
  { in: '8k_earth_daymap.jpg', out: 'earth_day', quality: 80 },
  { in: '8k_earth_nightmap.jpg', out: 'earth_night', quality: 78 },
  { in: '8k_earth_clouds.jpg', out: 'earth_clouds', quality: 78 },
  { in: '8k_earth_specular_map.png', out: 'earth_specular', quality: 72 },
];

const TIERS = [
  { name: '4k', width: 4096 },
  { name: '2k', width: 2048 },
];

for (const src of SOURCES) {
  for (const tier of TIERS) {
    const outFile = join(OUT, `${src.out}_${tier.name}.webp`);
    await sharp(join(SRC, src.in))
      .resize({ width: tier.width, height: tier.width / 2, fit: 'fill' })
      .webp({ quality: src.quality, effort: 5 })
      .toFile(outFile);
    console.log(`✓ ${src.out}_${tier.name}.webp`);
  }
}

// Moon — the /siteNEW Vision card shows a small moon, so a single 2k tier
// replaces the 15MB 8k JPG the full /moon route uses.
await sharp(join(SRC, '8k_moon.jpg'))
  .resize({ width: 2048, height: 1024, fit: 'fill' })
  .webp({ quality: 82, effort: 5 })
  .toFile(join(OUT, 'moon_2k.webp'));
console.log('✓ moon_2k.webp');

// Orb-bot (Vision "Bots" card) — the uploaded glTF ships 4k PBR maps (~31MB);
// the model is tiny on the card, so 1k WebP is ample. Re-run after re-uploading
// the source maps to public/textures/_orbbot_src/ (kept out of the deploy).
const ORB_SRC = join(SRC, '_orbbot_src');
const ORB_OUT = join(OUT, 'orbbot');
mkdirSync(ORB_OUT, { recursive: true });
const ORB = [
  { in: 'Robo_baseColor.jpeg', out: 'Robo_baseColor.webp', size: 1024, q: 82 },
  { in: 'Robo_metallicRoughness.png', out: 'Robo_metallicRoughness.webp', size: 1024, q: 86 },
  { in: 'Robo_normal.png', out: 'Robo_normal.webp', size: 1024, q: 90 },
  { in: 'Robo_emissive.png', out: 'Robo_emissive.webp', size: 512, q: 85 },
];
try {
  for (const t of ORB) {
    await sharp(join(ORB_SRC, t.in))
      .resize({ width: t.size, height: t.size, fit: 'fill' })
      .webp({ quality: t.q, effort: 5 })
      .toFile(join(ORB_OUT, t.out));
    console.log(`✓ orbbot/${t.out}`);
  }
} catch {
  console.log('· orbbot source maps not present — skipping (already optimized in repo)');
}

console.log('done');
