/**
 * Constants shared by the version-selecting shell.
 *
 * The mobile site is served as a self-contained static bundle (its own
 * dc-runtime + CDN React) from `public/mobile/`. It is never imported into the
 * desktop bundle, so nothing here pulls mobile code into the desktop chunk.
 */

/** Absolute path to the standalone mobile document served from `public/mobile/`.
 *  Explicit `index.html` so it resolves identically in dev, `vite preview`, and
 *  any static host (no reliance on directory-index behaviour). */
export const MOBILE_URL = '/mobile/index.html';
