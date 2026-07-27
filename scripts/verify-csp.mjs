/**
 * Regression test for the `vercel.json` CSP: runs the production build behind
 * the real headers and fails if anything is blocked.
 *
 * A CSP mistake is invisible to `npm run build` and to any test that doesn't use
 * a browser — it only shows up as an empty device screen or a dead animation.
 * So every frame (main document + all embedded iframes) records
 * `securitypolicyviolation` events, and the run exits non-zero if any fire, if a
 * graded header is missing, or if a scene fails to come up.
 *
 * Legs: desktop acts, the mobile version (which needs a `userAgentData.mobile`
 * override — that's what `detectDevice()` trusts), and each embed on its own so
 * its CSP tier is exercised directly.
 *
 *   npm run build && node scripts/verify-csp.mjs
 *   SHOTS=1 node scripts/verify-csp.mjs     # also write screenshots to tmp/shots-csp
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { startServer } from './vercel-headers-server.mjs';

// puppeteer-core ships no browser, so point it at an installed Chromium.
// Override with BROWSER_PATH when yours lives somewhere else.
const BROWSER_CANDIDATES = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const BROWSER = BROWSER_CANDIDATES.find((p) => fs.existsSync(p));
if (!BROWSER) {
  console.error(
    'No Chromium-based browser found. Set BROWSER_PATH to one, e.g.\n' +
      '  BROWSER_PATH="/path/to/chrome" npm run verify:csp',
  );
  process.exit(1);
}
const SHOTS = !!process.env.SHOTS;
const OUT = 'tmp/shots-csp';
if (SHOTS) fs.mkdirSync(OUT, { recursive: true });

const GRADED = [
  'content-security-policy',
  'strict-transport-security',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
];
const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
const CSP_RE = /Refused to|Content Security Policy|violates the following/i;

const { server, port } = await startServer({ port: 0 });
const BASE = `http://localhost:${port}`;
const failures = [];

const browser = await puppeteer.launch({
  executablePath: BROWSER,
  headless: 'new',
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
  ],
});

async function leg({ label, path = '/', width, height, mobile = false, marks = [0], needsCanvas }) {
  const page = await browser.newPage();
  await page.setViewport({
    width,
    height,
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  if (mobile) {
    // detectDevice() reads navigator.userAgentData.mobile first, so the UA
    // string alone would still hand us the desktop app.
    await page.setUserAgent(MOBILE_UA, {
      architecture: '',
      model: 'Pixel 7',
      mobile: true,
      platform: 'Android',
      platformVersion: '13',
      fullVersion: '124.0.0.0',
    });
  }
  await page.evaluateOnNewDocument(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      window.__csp.push(
        `${e.violatedDirective} blocked ${e.blockedURI || '(inline)'} @ ${e.sourceFile || '?'}:${e.lineNumber || 0}`,
      ),
    );
  });

  const consoleCsp = [];
  page.on('console', (m) => {
    if (CSP_RE.test(m.text())) consoleCsp.push(m.text());
  });

  const url = BASE + path;
  const headers = {};
  page.on('response', (r) => {
    if (r.url() === url) Object.assign(headers, r.headers());
  });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 9000));

  console.log(`\n===== ${label} (${width}x${height}) ${path} =====`);

  const missing = GRADED.filter((k) => !headers[k]);
  console.log(missing.length ? `HEADERS MISSING: ${missing.join(', ')}` : 'headers: all present');
  if (missing.length) failures.push(`${label}: missing ${missing.join(', ')}`);
  if (headers['access-control-allow-origin']) {
    failures.push(`${label}: unexpected Access-Control-Allow-Origin`);
  }

  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  for (const frac of marks) {
    const y = Math.max(0, Math.floor((totalHeight - height) * frac));
    await page.evaluate(
      (yy) => (window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy)),
      y,
    );
    await new Promise((r) => setTimeout(r, 1800));
    if (SHOTS) await page.screenshot({ path: `${OUT}/${label}-${frac}.png` });
  }

  const state = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const ctx = c && (c.getContext('webgl2') || c.getContext('webgl'));
    return {
      gl: ctx ? ctx.getParameter(ctx.VERSION) : null,
      frames: [...document.querySelectorAll('iframe')].map((f) => f.getAttribute('src')),
    };
  });
  console.log(`webgl: ${state.gl ?? 'none'} | iframes: ${state.frames.join(', ') || 'none'}`);
  if (needsCanvas && !state.gl) failures.push(`${label}: no WebGL context came up`);

  let violations = await page.evaluate(() => window.__csp || []);
  for (const f of page.frames()) {
    if (f === page.mainFrame()) continue;
    const d = await f
      .evaluate(() => ({
        path: location.pathname,
        nodes: document.body ? document.body.querySelectorAll('*').length : 0,
        csp: window.__csp || [],
      }))
      .catch(() => null);
    if (!d) continue;
    console.log(`  frame ${d.path}: ${d.nodes} nodes, ${d.csp.length} violations`);
    if (d.nodes === 0) failures.push(`${label}: frame ${d.path} rendered nothing`);
    violations = violations.concat(d.csp.map((v) => `[${d.path}] ${v}`));
  }

  const all = [...new Set([...violations, ...consoleCsp])];
  console.log(all.length ? `VIOLATIONS:\n  ${all.join('\n  ')}` : 'violations: none');
  if (all.length) failures.push(`${label}: ${all.length} CSP violation(s)`);

  await page.close();
}

await leg({
  label: 'desktop',
  width: 1600,
  height: 1000,
  needsCanvas: true,
  marks: [0, 0.14, 0.33, 0.6, 0.8, 0.96],
});
await leg({ label: 'mobile-shell', width: 390, height: 844, mobile: true, marks: [0, 0.5, 0.95] });
await leg({ label: 'mobile-direct', path: '/mobile/index.html', width: 390, height: 844, mobile: true });
for (const p of [
  '/embeds/bg-scroll.html',
  '/contacts/index.html',
  '/pricing-desktop/index.html',
  '/pricing-mobile/index.html',
  '/mono-phone/index.html',
]) {
  await leg({ label: `embed${p.replace(/\/index\.html$|\.html$/, '').replace(/\//g, '-')}`, path: p, width: 1280, height: 900 });
}

await browser.close();
server.close();

console.log('\n' + '='.repeat(50));
if (failures.length) {
  console.log(`FAILED (${failures.length}):`);
  failures.forEach((f) => console.log('  - ' + f));
  process.exit(1);
}
console.log('PASSED — no CSP violations, all graded headers present, every frame rendered.');
