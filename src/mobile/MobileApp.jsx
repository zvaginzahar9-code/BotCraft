import { useEffect, useRef } from 'react';
import { MOBILE_URL } from '../shared/constants.js';

/**
 * Phone version host.
 *
 * The mobile site is a self-contained static document (dc-runtime + its own
 * CDN-loaded React) living in `public/mobile/`. We mount it verbatim in a
 * full-viewport iframe so it stays byte-for-byte identical — no redesign, no
 * re-implementation, every animation and interaction preserved. It is only ever
 * created on phones, so no mobile code or assets are fetched on desktop, and no
 * desktop code or 3D assets are fetched here.
 *
 * Standalone, the mobile's external links (Telegram, WhatsApp) navigate the
 * whole tab. Inside an iframe a normal click would navigate only the frame, and
 * those sites may refuse to be framed. A single capturing click listener on the
 * same-origin frame reproduces the original behaviour: external links navigate
 * the top window. In-page hash links (#work, #pricing …) are left untouched so
 * they scroll inside the frame exactly as before. The mobile source file itself
 * is never modified.
 */
export default function MobileApp() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return undefined;

    let doc = null;

    const onExternalClick = (event) => {
      const target = event.target;
      const anchor =
        target && typeof target.closest === 'function'
          ? target.closest('a[href]')
          : null;
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      if (/^https?:\/\//i.test(href)) {
        // Full-tab navigation — matches the standalone mobile site.
        event.preventDefault();
        window.top.location.href = href;
      }
    };

    const attach = () => {
      try {
        doc = iframe.contentDocument;
        if (doc) doc.addEventListener('click', onExternalClick, true);
      } catch {
        // same-origin, so this never throws — guard is defensive only.
      }
    };

    iframe.addEventListener('load', attach);
    // In case the frame is already loaded by the time the effect runs.
    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
      attach();
    }

    return () => {
      iframe.removeEventListener('load', attach);
      if (doc) doc.removeEventListener('click', onExternalClick, true);
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={MOBILE_URL}
      title="BotCraft"
      allow="accelerometer; gyroscope; fullscreen"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'block',
        background: '#000',
      }}
    />
  );
}
