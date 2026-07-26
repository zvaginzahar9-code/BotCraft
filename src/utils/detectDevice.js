/**
 * Decide which version of the site to render, computed once before React mounts.
 *
 * Rule (per product spec):
 *   - Phones            -> 'mobile'
 *   - Tablets / laptops / desktops -> 'desktop'
 *
 * Strategy, most reliable first:
 *   1. User-Agent Client Hints (`navigator.userAgentData.mobile`) — Chromium.
 *      `mobile` is `true` only for phones, `false` for tablets and desktops.
 *   2. Explicit tablet detection -> desktop (iPad, Android non-"Mobile", etc.).
 *   3. Phone User-Agent regex.
 *   4. Coarse-pointer + small physical screen fallback for phones whose UA we
 *      don't recognise.
 *
 * Note: modern iPadOS reports a desktop ("Macintosh") UA, which correctly
 * resolves to 'desktop' — tablets get the desktop version by design.
 */
export function detectDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'desktop';
  }

  const ua = navigator.userAgent || '';
  const uaData = navigator.userAgentData;

  // 1. Client Hints — authoritative when present.
  if (uaData && typeof uaData.mobile === 'boolean') {
    return uaData.mobile ? 'mobile' : 'desktop';
  }

  // 2. Tablets always get the desktop version.
  const isTablet =
    /iPad/i.test(ua) ||
    (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
    /(tablet|playbook|silk)/i.test(ua);
  if (isTablet) return 'desktop';

  // 3. Phone User-Agent.
  const isPhoneUA =
    /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|BB10|Opera Mini|IEMobile/i.test(
      ua,
    );

  // 4. Fallback: coarse pointer on a physically small screen.
  const coarsePointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  const screen = window.screen || {};
  const shortSide = Math.min(screen.width || Infinity, screen.height || Infinity);
  const isSmallTouch = coarsePointer && shortSide <= 480;

  return isPhoneUA || isSmallTouch ? 'mobile' : 'desktop';
}
