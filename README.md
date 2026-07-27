# BotCraft — Cinematic 3D Scroll Site

A "dear", minimalist, strictly monochrome (black / white / grey) cinematic scroll
experience for the web studio **BotCraft**. The visitor doesn't just scroll a page —
they move through a story: a logo that draws itself, a giant MacBook that opens to
reveal a **live, scrollable website inside its screen**, an iPhone showing the mobile
version, and a final MacBook that opens onto the real contact channels.

Built to an Apple / Linear / Stripe / Vercel / Awwwards level of polish.

## Stack

- **React 18** + **Vite 5**
- **Three.js** + **@react-three/fiber** + **@react-three/drei**
- **@react-three/postprocessing** (subtle, monochrome)
- **GSAP** + **ScrollTrigger** (scroll story, logo draw via native `stroke-dashoffset`)
- **Lenis** (smooth scroll, synced to ScrollTrigger)
- CSS transitions + `useInView` for the card reveals (framer-motion was removed — see Performance)
- **Inter** + **Space Grotesk** (self-hosted via `@fontsource-variable`)

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview the production build
npm run lint
```

Append `?debug` to the URL (e.g. `http://localhost:5173/?debug`) to enable OrbitControls,
a grid and axes, and disable postprocessing — useful for tuning the 3D placement.

## The scroll story (8 acts)

1. **Hero** — pure black. The real SVG logo (`assets/logo.svg`) draws itself via
   `stroke-dashoffset`, floods white, then the tagline *«Ваш сайт за дни, а не недели»* fades in.
2. **Dock** — on scroll the logo shrinks into the top-left as the nav mark.
3. **MacBook in** — a huge MacBook rises and opens (physical hinge animation).
4. **Laptop site** — a **live** desktop site is rendered inside the screen; scrolling the page
   scrolls the site *inside* the laptop. At the end the MacBook flies up.
5. **iPhone** — a large iPhone appears with left-hand copy; its screen shows the **live** mobile
   site, which you scroll the same way. Then it flies up.
6. **Почему выбирают нас** — reason cards fade/stagger in.
7. **Цены** — tariff cards; they fly up as you pass.
8. **Contact** — a MacBook returns, opens onto a styled "OS" with the real channels:
   Telegram `@Trust7002`, Instagram `botc_raft`, WhatsApp `+7 707 291 11 23`, `example@gmail.com`.

The live screens are real DOM (`drei <Html transform>`), never images/video. Inner scrolling is
deterministic (act progress → `translateY`), so it works identically on desktop and touch.

## Project structure

```
src/
  App.jsx                 # shell: canvas + overlays + scroll-length spacers
  main.jsx
  hooks/useStory.js       # THE scroll orchestration (intro + all acts)
  lib/
    gsap.js  useSmoothScroll.js  sceneStore.js  math.js  useMediaQuery.js
  three/
    Experience.jsx        # <Canvas>, adaptive perf, ?debug
    Stage.jsx             # device choreography across acts (reads sceneStore)
    Macbook.jsx  Iphone.jsx  Lighting.jsx  Effects.jsx
  screens/                # the live sites shown inside devices
    LaptopSite.jsx  PhoneSite.jsx  DeviceIframe.jsx  ContactOS.jsx  screens.css
  sections/               # DOM overlays + flow sections
    Hero.jsx  SiteNav.jsx  PhoneCopy.jsx  WhyUs.jsx  Pricing.jsx  ContactIntro.jsx
  components/
    Logo.jsx  logoPaths.js (auto-generated)  Background.jsx  Preloader.jsx  ScrollHint.jsx
  styles/                 # tokens.css (monochrome), index.css (reset)
public/models/            # laptop-new.glb, phone-new.glb (Sketchfab, normalised on load)
public/embeds/            # provided self-contained pages, iframed 1:1:
    laptop.html (Maison Dorée)  phone.html (MONO)  bg-scroll.html (animated bg)
```

## Tuning the 3D screens

All screen alignment lives in labelled constants at the top of each device file — no magic
numbers buried in logic:

- `src/three/Macbook.jsx` → `SCREEN` (`cx/cy/cz` as fractions of the normalised model, `tiltX`, `scale`).
- `src/three/Iphone.jsx` → `SCREEN` (`cx/cy/cz`, `scale`).
- `src/three/Stage.jsx` → `MAC` / `PHONE` / `CONTACT` layout + the mobile-portrait overrides.

The GLBs are Sketchfab exports whose node matrices (axis-convert + 0.01 scale) make the raw geometry
render tiny, so each device **normalises the model on load** (recentre + scale to a known size) and
places the screen in that space. drei's `<Html transform>` applies a ~1/23 net constant, so
`SCREEN.scale` is **not** `worldWidth/pxWidth` — it was calibrated from the on-screen projected size.
If a site over/underfills its panel, nudge `SCREEN.scale` / `cy`.

## Performance & mobile

- One fixed `<Canvas>`; heavy WebGL is code-split out of the initial bundle.
- `PerformanceMonitor` + `AdaptiveDpr` + `AdaptiveEvents`; DPR capped `[1,1.5]` mobile / `[1,2]` desktop.
- Mobile drops DOF/Bloom (keeps SMAA + vignette), shrinks the wide MacBook and centres/enlarges the
  iPhone — the full 8-act scenario stays intact, only heavy effects degrade.
- `prefers-reduced-motion` disables the smooth scroll + logo draw (logo shows filled immediately).

## Embedded content & background

The device sites and the background are client-provided self-contained HTML pages, served from
`public/embeds/` and shown in isolated `<iframe>`s (kept 1:1). `screens/DeviceIframe.jsx` drives each
inner site's scroll from its act progress (handles both window-scroll and inner-overflow pages).

The animated background (`components/Background.jsx`) is a fixed iframe **behind** the transparent
canvas; its animation is driven by `window.__lenis.progress`, so it advances only while scrolling and
**freezes on the current frame** the instant scrolling stops (never autoplays).

The logo draw-on is ported from the provided animation (`Logo.jsx` + `useStory`): the real
`assets/logo.svg` paths are stroked via `stroke-dashoffset`, then flooded white; the bounding rectangle
is stripped and the fill is transparent (fill-rule) so no box appears over the background.

## Security headers (Vercel)

`vercel.json` sets the headers on every response; JSON can't carry comments, so the reasoning lives
here. Any change to it must be re-verified with `npm run verify:csp` (see below) — CSP breakage is
silent in the build and only shows up in the browser.

Baseline on `/(.*)`: `Strict-Transport-Security` (2y, `includeSubDomains`, `preload`), `nosniff`,
`X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy` (everything off except `accelerometer`/`gyroscope`/`fullscreen`/`autoplay`, which
stay `self` because the mobile iframe declares `allow="accelerometer; gyroscope; fullscreen"` and a
child can never be granted more than the top document holds), and
`Cross-Origin-Opener-Policy: same-origin-allow-popups` (keeps `target="_blank"` links to t.me / wa.me
working). No `Access-Control-Allow-Origin` — nothing here is a cross-origin API.

`X-Frame-Options` is **SAMEORIGIN, not DENY**: the scene frames its own pages (`/embeds`, `/contacts`,
`/pricing-*`, `/mono-phone`) and the shell frames `/mobile`. `DENY` would blank every device screen.

CSP is set in three tiers, on non-overlapping `source` patterns — two CSP headers on one response are
enforced as an *intersection*, so the tiers must never both match a path:

| Tier | Paths | Why it differs |
| --- | --- | --- |
| App | everything else | `script-src 'self' 'wasm-unsafe-eval'` — React/R3F/GSAP/Lenis need no `eval`; three.js compiles a WASM module. `connect-src`/`img-src` allow `blob:` because GLTFLoader fetches textures it extracts from `laptop-new.glb` through blob URLs. `style-src 'unsafe-inline'` for React/`<Html>` inline styles. |
| Background | `/embeds/*` | Self-contained page: one inline `<style>`, one inline `<script>`. No CDN, no eval. |
| dc-runtime pages | `/mobile/*`, `/contacts/*`, `/pricing-*/*`, `/mono-phone/*` | `support.js` compiles components with `new Function()` and loads React/ReactDOM/Babel (and three, via importmap) from unpkg with SRI, plus Google Fonts. `'unsafe-eval'` + `https://unpkg.com` are load-bearing — without them these pages render nothing. |

Verification (needs the production build in `dist/`):

```bash
npm run build
npm run verify:csp       # serves dist/ behind the real vercel.json headers (path-to-regexp — the
                         # same matcher Vercel uses), drives desktop acts, the mobile version and
                         # each embed, and exits non-zero on any CSP violation, missing header,
                         # dead WebGL context or empty iframe. SHOTS=1 also writes screenshots.
npm run grade:headers    # securityheaders.com's ruleset; URL=https://… to score the deployment
```

`scripts/vercel-headers-server.mjs` also runs standalone (`node scripts/vercel-headers-server.mjs
4173`, `NO_HEADERS=1` to serve the same build unprotected) — that A/B is how you tell a CSP break
apart from a pre-existing quirk, e.g. the FBX phone still loading under software WebGL, or the
`{{ c.img }}` placeholder 404s the dc-runtime fires before it hydrates.

## Performance

Measured with headless Edge against `dist/` behind the real `vercel.json` headers
**with brotli** (`tmp/` harnesses; Lighthouse reports in `tmp/lh/`). Desktop numbers are
from the **real GPU** (`--use-angle=d3d11`) — under SwiftShader the same page reports
TBT ~11 s, which is a renderer artefact and will send you chasing ghosts.

| | Desktop before | Desktop after | Mobile before | Mobile after |
| --- | --- | --- | --- | --- |
| Lighthouse | 0.57 | **0.60** | **`null` (NO_FCP)** | **0.84** |
| FCP | 0.9 s | **0.5 s** | never fired | **0.7 s** |
| LCP | 1.2 s | **0.5 s** | never fired | **0.7 s** |
| CLS | 0 | 0 | 0 | 0 |
| Transfer, full journey | 19.05 MB | **2.76 MB** | 3.71 MB | **0.79 MB** |

What moved the numbers, largest first:

- **`mono-phone/site.html` 4.37 MB → 508 KB** (3.21 MB → 334 KB brotli). It carried eight
  photographs as base64 PNG inside a `<script type="__bundler/manifest">` block — base64
  defeats compression, and both versions fetch this file. `scripts/optimize-embedded-images.mjs`
  re-encodes them to WebP at identical pixel dimensions.
- **`laptop-new.glb` 16.9 MB → 2.48 MB** (12.3 MB → 1.74 MB brotli) via
  `scripts/optimize-glb.mjs`: textures to WebP, geometry quantized and Meshopt-compressed.
  **Meshopt, not Draco, is deliberate** — drei's Draco path fetches its decoder from
  `gstatic.com`, which would mean adding a Google CDN to `script-src`. The Meshopt decoder
  ships with three-stdlib and runs under the `'wasm-unsafe-eval'` the app CSP already grants,
  so the asset shrank without touching a single header.
- **NO_FCP fixed.** The mobile version renders one `<iframe>`, and iframe content does not
  count toward the parent's FCP — so the top-level document never painted, Lighthouse nulled
  the whole performance category, and crawlers saw an empty page. `index.html` now paints a
  static branded boot screen (real `<h1>`, tagline, contact links) before any JS runs;
  `main.jsx` fades it out as the app mounts. Final design unchanged.
- **framer-motion removed** — ~100 KB raw for one component. The `motion` chunk went
  245.85 → 134.11 kB raw (87.13 → 50.79 kB gzip) and its script-eval time 370 → 74 ms.
  `useInView` + the `.reveal` CSS reproduce the same easing, durations and stagger.
- **Screen textures to WebP** — `laptop-screen-hi` 1.17 MB → 594 KB (every real-GPU desktop
  downloads it), `laptop-screen-lo` 253 → 143 KB (mobile's largest initial asset).

Tried and **reverted**: lazy-loading `OrbitControls` via `import('@react-three/drei')`. A
dynamic import of the barrel cannot be tree-shaken, so the `r3f` chunk went 259 kB → 1,114 kB
— a 4.3× regression on the critical path to save 15 kB. Kept the static import.

Remaining bottlenecks, in order: desktop TBT ~1.6 s is scene construction and shader
compilation inside the React commit (inherent to WebGL, run-to-run variance ±160 ms);
Speed Index ~6 s is the cinematic intro, i.e. the design; the mono-phone frame still pulls
its own copy of three.js from unpkg (251 KB) alongside the bundled one; `phone.fbx` is still
2.7 MB and would benefit from the same GLB treatment.

## Cloudflare proxy compatibility

The project is ready for orange-cloud proxying — no code depends on Vercel-specific
behaviour — but two settings matter once it is on:

- **Turn Rocket Loader OFF.** It defers and reorders scripts, which breaks the dc-runtime
  documents (`<script type="text/x-dc">`) and the `<script type="importmap">` in
  `mono-phone/index.html`.
- **Leave Auto Minify off for HTML.** `site.html` and the other bundled pages carry their
  assets in a JSON manifest; HTML minification can corrupt it. (Cloudflare retired Auto
  Minify in 2024, so this only applies to older zones.)

Caching is already declared in `vercel.json` and Cloudflare will honour it: content-hashed
`/assets/*` is `immutable` for a year, `/models/*` gets a week with
`stale-while-revalidate`, and every `.html` is `must-revalidate` so deploys propagate
immediately. Brotli is served by the edge either way. HSTS is set with `preload`, so keep
Cloudflare's SSL mode on **Full (strict)** — anything less would strip the guarantee the
header makes.
