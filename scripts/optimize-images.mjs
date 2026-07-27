/**
 * Re-encodes the standalone raster assets to WebP.
 *
 * `laptop-screen-hi.jpg` (1280x9305, 1.17 MB) is the tall page screenshot mapped
 * onto the MacBook's screen. Every desktop visitor on real hardware downloads it
 * — the model picks the hi variant whenever `MAX_TEXTURE_SIZE >= 9305`, which is
 * every current GPU (16384). `laptop-screen-lo.jpg` (253 KB) is the largest
 * single asset in the mobile page's initial load.
 *
 * WebP keeps the same pixel dimensions, so texture sampling and the UV window
 * maths in Macbook.jsx are unaffected; three.js loads WebP through the same
 * TextureLoader path as JPEG.
 *
 *   node scripts/optimize-images.mjs [--quality=82] [--dry]
 */
import sharp from 'sharp';
import { statSync, existsSync } from 'node:fs';

const QUALITY = Number(
  (process.argv.find((a) => a.startsWith('--quality=')) || '').split('=')[1] || 82,
);
const DRY = process.argv.includes('--dry');

const TARGETS = [
  'public/models/laptop-screen-hi.jpg',
  'public/models/laptop-screen-lo.jpg',
  'public/mobile/public/models/laptop-screen-lo.jpg',
];

const kb = (n) => (n / 1024).toFixed(0).padStart(6) + ' KB';

for (const src of TARGETS) {
  if (!existsSync(src)) {
    console.log(`skip (missing): ${src}`);
    continue;
  }
  const out = src.replace(/\.(jpe?g|png)$/i, '.webp');
  const before = statSync(src).size;
  const meta = await sharp(src).metadata();

  const buf = await sharp(src).webp({ quality: QUALITY, effort: 6 }).toBuffer();
  console.log(
    `${src}\n  ${meta.width}x${meta.height}  ${kb(before)} -> ${kb(buf.length)}  (-${(100 - (100 * buf.length) / before).toFixed(1)}%)`,
  );
  if (DRY) continue;
  if (buf.length >= before) {
    console.log('  not smaller — keeping original');
    continue;
  }
  await sharp(buf).toFile(out);
  console.log(`  wrote ${out}`);
}
console.log('\nRemember: references live in src/desktop/three/Macbook.jsx and public/mobile/index.html');
