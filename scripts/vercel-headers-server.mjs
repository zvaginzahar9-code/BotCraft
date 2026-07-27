/**
 * Static server for `dist/` that replays the `vercel.json` header rules.
 *
 * Matching goes through path-to-regexp with the same options
 * (`strict: false`, `delimiter: '/'`) that Vercel's routing layer uses, so a
 * rule that resolves here resolves identically in production — including the
 * negative-lookahead `source` that keeps the app CSP off the embed pages.
 *
 * `applyHeaders: false` serves the same build with no headers at all, which is
 * how the verifier tells "CSP broke this" apart from "this was already like
 * that" (heavy FBX under software WebGL, template-placeholder 404s, …).
 */
import http from 'node:http';
import { readFileSync, statSync, createReadStream } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToRegexp } from 'path-to-regexp';

const REPO_ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.fbx': 'application/octet-stream',
};

export function loadRules(configPath = join(REPO_ROOT, 'vercel.json')) {
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
  return (cfg.headers ?? []).map((rule) => ({
    source: rule.source,
    re: pathToRegexp(rule.source, [], { strict: false, sensitive: false, delimiter: '/' }),
    headers: rule.headers,
  }));
}

export function startServer({ port = 0, root = join(REPO_ROOT, 'dist'), applyHeaders = true } = {}) {
  const rules = loadRules();
  const rootPath = normalize(root);

  const server = http.createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent(req.url.split('?')[0]);
    } catch {
      res.writeHead(400).end('bad request'); // malformed percent-encoding
      return;
    }
    let file = normalize(join(rootPath, urlPath));
    // Compare against root + separator: a bare startsWith would let
    // `/../dist-something/x` out of the tree on a shared prefix.
    if (file !== rootPath && !file.startsWith(rootPath + sep)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    let st;
    try {
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      st = statSync(file);
    } catch {
      res.writeHead(404).end('not found');
      return;
    }
    if (applyHeaders) {
      for (const rule of rules) {
        if (rule.re.test(urlPath)) for (const h of rule.headers) res.setHeader(h.key, h.value);
      }
    }
    res.setHeader('Content-Type', MIME[extname(file).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Content-Length', st.size);
    res.writeHead(200);
    createReadStream(file).pipe(res);
  });

  // Loopback only — this serves an unauthenticated copy of the build and, with
  // `applyHeaders: false`, one with no CSP at all. Nothing to expose on the LAN.
  return new Promise((res) => {
    server.listen(port, '127.0.0.1', () => res({ server, port: server.address().port }));
  });
}

// Standalone: `node scripts/vercel-headers-server.mjs 4173`
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const { port } = await startServer({
    port: Number(process.argv[2] || 4173),
    applyHeaders: !process.env.NO_HEADERS,
  });
  console.log(`serving dist/ on http://localhost:${port} (headers: ${!process.env.NO_HEADERS})`);
}
