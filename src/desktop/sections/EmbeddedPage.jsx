import { useEffect, useRef } from 'react';
import './sections.css';

/**
 * Embeds a standalone static page (served from public/) as a same-origin iframe
 * that auto-sizes to its content height, so it flows in the normal document
 * scroll with no nested scrollbar. Used for the pricing and contact screens —
 * self-contained dc-runtime documents that boot their own CDN React after the
 * iframe 'load' event, so sizing is polled + observed rather than gated on load.
 */
export default function EmbeddedPage({ id, src, title }) {
  const frameRef = useRef(null);

  useEffect(() => {
    const iframe = frameRef.current;
    if (!iframe) return undefined;

    let ro;
    let clicksBound = false;
    let boundDoc = null;
    // External links inside the (self-contained) page must open the whole tab,
    // not navigate the small iframe — and framed Telegram/WhatsApp would be
    // refused outright. In-page hash and mailto/tel links fall through untouched.
    const onExternalClick = (event) => {
      const target = event.target;
      const anchor =
        target && typeof target.closest === 'function' ? target.closest('a[href]') : null;
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      if (/^https?:\/\//i.test(href)) {
        event.preventDefault();
        window.top.location.href = href;
      }
    };
    const bindClicks = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc && !clicksBound) {
          doc.addEventListener('click', onExternalClick, true);
          clicksBound = true;
          boundDoc = doc;
        }
      } catch {
        /* noop */
      }
    };

    let lastH = 0;
    const fit = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc || !doc.body) return;
        const h = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);
        if (h && Math.abs(h - lastH) > 1) {
          lastH = h;
          iframe.style.height = `${h}px`;
        }
      } catch {
        /* same-origin — never throws; guard is defensive */
      }
    };
    const attachRO = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc && doc.body && 'ResizeObserver' in window && !ro) {
          ro = new ResizeObserver(fit);
          ro.observe(doc.body);
        }
      } catch {
        /* noop */
      }
    };
    const tick = () => {
      fit();
      attachRO();
      bindClicks();
    };

    iframe.addEventListener('load', tick);
    tick();
    let n = 0;
    const poll = setInterval(() => {
      tick();
      if (++n > 40) clearInterval(poll); // ~10s to catch the async dc-runtime boot
    }, 250);
    const onResize = () => fit();
    window.addEventListener('resize', onResize);

    return () => {
      clearInterval(poll);
      iframe.removeEventListener('load', tick);
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
      if (boundDoc) boundDoc.removeEventListener('click', onExternalClick, true);
    };
  }, []);

  return (
    <section id={id} className="embed-section">
      <iframe
        ref={frameRef}
        className="embed-frame"
        src={src}
        title={title}
        loading="lazy"
        scrolling="no"
      />
    </section>
  );
}
