/**
 * Scores responses the way securityheaders.com does: the six headers it grades
 * on must all be present for A+, each missing one costs a grade.
 *
 *   node scripts/grade-headers.mjs                      # against the local dist/ + vercel.json
 *   URL=https://botcraft.example node scripts/grade-headers.mjs   # against the deployment
 */
import { startServer } from './vercel-headers-server.mjs';

const GRADED = [
  'strict-transport-security',
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
];
const SCALE = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'];
const PATHS = [
  '/',
  '/mobile/index.html',
  '/contacts/index.html',
  '/pricing-desktop/index.html',
  '/pricing-mobile/index.html',
  '/mono-phone/index.html',
  '/embeds/bg-scroll.html',
];

let base = process.env.URL;
let server;
if (!base) {
  const started = await startServer({ port: 0 });
  server = started.server;
  base = `http://localhost:${started.port}`;
  console.log(`(local dist/ behind vercel.json headers — ${base})\n`);
}

let worst = 0;
for (const p of PATHS) {
  const res = await fetch(base.replace(/\/$/, '') + p, { redirect: 'manual' });
  const h = res.headers;
  const missing = GRADED.filter((k) => !h.get(k));
  const notes = [];

  const hsts = h.get('strict-transport-security');
  if (hsts) {
    const age = Number(/max-age=(\d+)/.exec(hsts)?.[1] ?? 0);
    if (age < 15768000) notes.push(`HSTS max-age ${age} < 6 months`);
    if (!/includeSubDomains/i.test(hsts)) notes.push('HSTS without includeSubDomains');
  }
  if (h.get('access-control-allow-origin')) {
    notes.push(`ACAO present: ${h.get('access-control-allow-origin')}`);
  }
  if (h.get('x-powered-by')) notes.push('info disclosure: x-powered-by');

  const idx = Math.min(missing.length, SCALE.length - 1);
  worst = Math.max(worst, idx);
  console.log(
    `${SCALE[idx].padEnd(3)} ${p.padEnd(30)} ${
      missing.length ? 'missing: ' + missing.join(', ') : 'all graded headers present'
    }${notes.length ? ' | ' + notes.join('; ') : ''}`,
  );
}

console.log(`\nWorst grade across paths: ${SCALE[worst]}`);
server?.close();
process.exit(worst === 0 ? 0 : 1);
