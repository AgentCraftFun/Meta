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
console.log('done');
