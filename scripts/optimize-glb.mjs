/**
 * Compresses the 3D models.
 *
 * `laptop-new.glb` shipped at 16.9 MB — 12.3 MB even after brotli, by far the
 * largest asset on the site. It breaks down as ~9.96 MB of embedded PNG
 * textures (23 of them) and ~6.94 MB of geometry holding only 120k vertices /
 * 112k triangles, stored as raw float32 attributes with no compression at all
 * (`extensionsUsed: []`).
 *
 * Two passes:
 *   1. Textures -> WebP, capped at MAX_TEXTURE px. PNG is the wrong container
 *      for photographic PBR maps; WebP typically takes 90% off.
 *   2. Geometry -> EXT_meshopt_compression, with quantization.
 *
 * Meshopt rather than Draco is a deliberate security choice: drei's Draco path
 * fetches its decoder from https://www.gstatic.com, which would mean adding a
 * Google CDN to `script-src` in vercel.json. The Meshopt decoder is already
 * bundled with three-stdlib and runs under the `'wasm-unsafe-eval'` the app CSP
 * grants today, so this compresses the asset without touching a single header.
 *
 *   node scripts/optimize-glb.mjs [--max-texture=2048] [--quality=85] [--dry]
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup,
  prune,
  quantize,
  reorder,
  textureCompress,
  weld,
} from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';

const arg = (name, dflt) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : dflt;
};
const MAX_TEXTURE = Number(arg('max-texture', 2048));
const QUALITY = Number(arg('quality', 85));
const DRY = process.argv.includes('--dry');

const TARGETS = ['public/models/laptop-new.glb'];
const mb = (n) => (n / 1048576).toFixed(2).padStart(6) + ' MB';

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder,
});

for (const file of TARGETS) {
  if (!existsSync(file)) {
    console.log(`skip (missing): ${file}`);
    continue;
  }
  const before = readFileSync(file).length;
  const doc = await io.read(file);

  const texCountBefore = doc.getRoot().listTextures().length;
  const texBytesBefore = doc
    .getRoot()
    .listTextures()
    .reduce((a, t) => a + (t.getImage()?.byteLength ?? 0), 0);

  await doc.transform(
    // Drop duplicated accessors/materials/textures and anything unreferenced
    // before spending time compressing it.
    dedup(),
    prune({ keepAttributes: false, keepLeaves: false }),
    // Merge identical vertices — meshopt's encoders assume a welded mesh.
    weld(),
    textureCompress({
      encoder: sharp,
      targetFormat: 'webp',
      quality: QUALITY,
      resize: [MAX_TEXTURE, MAX_TEXTURE],
      resizeFilter: 'lanczos3',
    }),
    // Cache-friendly index order, then quantize + meshopt-encode.
    reorder({ encoder: MeshoptEncoder, target: 'performance' }),
    quantize({
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 12,
      quantizeColor: 8,
      quantizeWeight: 8,
    }),
  );

  doc.createExtension(
    (await import('@gltf-transform/extensions')).EXTMeshoptCompression,
  )
    .setRequired(true)
    .setEncoderOptions({ method: 'quantize' });

  const out = await io.writeBinary(doc);
  const texBytesAfter = doc
    .getRoot()
    .listTextures()
    .reduce((a, t) => a + (t.getImage()?.byteLength ?? 0), 0);

  console.log(`\n=== ${file} ===`);
  console.log(`  textures : ${texCountBefore} images, ${mb(texBytesBefore)} -> ${mb(texBytesAfter)}`);
  console.log(`  file     : ${mb(before)} -> ${mb(out.length)}  (-${(100 - (100 * out.length) / before).toFixed(1)}%)`);

  if (DRY) {
    console.log('  --dry: not written');
    continue;
  }
  if (out.length >= before) {
    console.log('  result is not smaller — keeping original');
    continue;
  }
  if (!existsSync(file + '.orig')) copyFileSync(file, file + '.orig');
  writeFileSync(file, Buffer.from(out));
  console.log('  written (original kept alongside as .orig)');
}
