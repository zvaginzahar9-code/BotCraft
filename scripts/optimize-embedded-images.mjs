/**
 * Re-encodes the images embedded in the dc-runtime "bundled page" documents.
 *
 * `mono-phone/site.html` is a single 4.37 MB HTML file: a
 * `<script type="__bundler/manifest">` block holds every asset as base64 inside
 * JSON, and 4.2 MB of that is eight PNG photographs. Base64 defeats
 * compression — the file only shrinks to 3.21 MB under brotli (a 27% saving,
 * versus ~85% for real markup), and it is fetched by BOTH versions: it is 86%
 * of the mobile site's entire transfer.
 *
 * Transcoding those PNGs to WebP at the same pixel dimensions removes the bulk
 * of it with no perceptible quality change at phone-screen scale. Encoding runs
 * in headless Edge (which every dev here already has, via puppeteer-core) so
 * this needs no native image dependency.
 *
 * Idempotent: resources already stored as WebP are skipped.
 *
 *   node scripts/optimize-embedded-images.mjs [--quality=0.85] [--dry]
 */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const TARGETS = [
  'public/mono-phone/assets/site.html',
  'public/mobile/public/mono-phone/site.html',
];
const MANIFEST_OPEN = '<script type="__bundler/manifest">';
const QUALITY = Number(
  (process.argv.find((a) => a.startsWith('--quality=')) || '').split('=')[1] || 0.85,
);
const DRY = process.argv.includes('--dry');

const BROWSER_CANDIDATES = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const BROWSER = BROWSER_CANDIDATES.find((p) => existsSync(p));
if (!BROWSER) {
  console.error('No Chromium-based browser found. Set BROWSER_PATH.');
  process.exit(1);
}

const kb = (n) => (n / 1024).toFixed(0).padStart(6) + ' KB';

const browser = await puppeteer.launch({
  executablePath: BROWSER,
  headless: 'new',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();

for (const file of TARGETS) {
  if (!existsSync(file)) {
    console.log(`skip (missing): ${file}`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const open = html.indexOf(MANIFEST_OPEN);
  if (open === -1) {
    console.log(`skip (no manifest): ${file}`);
    continue;
  }
  const start = open + MANIFEST_OPEN.length;
  const end = html.indexOf('</script>', start);
  const manifest = JSON.parse(html.slice(start, end));

  console.log(`\n=== ${file} ===`);
  let before = 0;
  let after = 0;
  let changed = 0;

  for (const [key, res] of Object.entries(manifest)) {
    if (!res.mime?.startsWith('image/') || res.compressed) continue;
    if (res.mime === 'image/webp') {
      console.log(`  ${key.slice(0, 8)} already webp — skipped`);
      continue;
    }
    const originalB64 = res.data;
    const encoded = await page.evaluate(
      async (dataUrl, quality) => {
        const img = new Image();
        img.decoding = 'sync';
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = () => rej(new Error('decode failed'));
          img.src = dataUrl;
        });
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        // No smoothing/resampling: same pixel dimensions in, same out.
        c.getContext('2d').drawImage(img, 0, 0);
        const out = c.toDataURL('image/webp', quality);
        if (!out.startsWith('data:image/webp')) throw new Error('webp unsupported');
        return { b64: out.slice(out.indexOf(',') + 1), w: c.width, h: c.height };
      },
      `data:${res.mime};base64,${originalB64}`,
      QUALITY,
    );

    const oldBytes = Buffer.from(originalB64, 'base64').length;
    const newBytes = Buffer.from(encoded.b64, 'base64').length;
    before += oldBytes;
    after += newBytes;

    // Never let a "optimization" make a resource bigger.
    if (newBytes >= oldBytes) {
      console.log(`  ${key.slice(0, 8)} ${encoded.w}x${encoded.h} would grow — kept as ${res.mime}`);
      after += oldBytes - newBytes;
      continue;
    }
    console.log(
      `  ${key.slice(0, 8)} ${String(encoded.w) + 'x' + encoded.h} ${kb(oldBytes)} -> ${kb(newBytes)}  (-${(100 - (100 * newBytes) / oldBytes).toFixed(0)}%)`,
    );
    res.mime = 'image/webp';
    res.data = encoded.b64;
    changed++;
  }

  console.log(
    `  TOTAL images: ${kb(before)} -> ${kb(after)}  (-${(100 - (100 * after) / before).toFixed(1)}%), ${changed} re-encoded`,
  );

  if (!changed || DRY) {
    console.log(DRY ? '  --dry: not written' : '  nothing to do');
    continue;
  }
  const out = html.slice(0, start) + JSON.stringify(manifest) + html.slice(end);
  writeFileSync(file, out);
  console.log(`  file: ${kb(Buffer.byteLength(html))} -> ${kb(Buffer.byteLength(out))}`);
}

await browser.close();
