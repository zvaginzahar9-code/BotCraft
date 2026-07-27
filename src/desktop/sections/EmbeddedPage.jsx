import { useEffect, useRef, useState } from 'react';
import './sections.css';

/**
 * Embeds a standalone static page (served from public/) as a same-origin iframe
 * that auto-sizes to its content height, so it flows in the normal document
 * scroll with no nested scrollbar. Used for the pricing and contact screens —
 * self-contained dc-runtime documents that boot their own CDN React after the
 * iframe 'load' event, so sizing is polled + observed rather than gated on load.
 *
 * Loading is driven by an IntersectionObserver rather than `loading="lazy"`.
 * Native lazy loading deadlocked here: an unloaded iframe is only 150px tall, so
 * both sections collapsed to the bottom of the document, never came far enough
 * into view to trigger their own load, and therefore never grew — leaving
 * pricing and contacts permanently blank. The section reserves a viewport of
 * height up front, which breaks that cycle and doubles as CLS insurance, and a
 * timeout backstop guarantees the frame loads even if the observer never fires.
 */
export default function EmbeddedPage({ id, src, title }) {
  const frameRef = useRef(null);
  const sectionRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Load once the section is within ~1.5 viewports, with a hard backstop.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || shouldLoad) return undefined;

    let io;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) setShouldLoad(true);
        },
        { rootMargin: '150% 0px' },
      );
      io.observe(section);
    } else {
      setShouldLoad(true);
    }
    // Backstop: never let these sections stay empty, whatever the observer does.
    const backstop = setTimeout(() => setShouldLoad(true), 8000);

    return () => {
      if (io) io.disconnect();
      clearTimeout(backstop);
    };
  }, [shouldLoad]);

  useEffect(() => {
    const iframe = frameRef.current;
    if (!iframe || !shouldLoad) return undefined;

    let ro;
    let boundDoc = null;
    // External links inside the (self-contained) page must open a new tab, not
    // navigate the small iframe — framed Telegram/WhatsApp are refused outright
    // ("refused to connect"). In-page hash and mailto/tel links fall through.
    const onExternalClick = (event) => {
      const target = event.target;
      const anchor =
        target && typeof target.closest === 'function' ? target.closest('a[href]') : null;
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      if (!/^https?:\/\//i.test(href)) return;
      // Retarget the anchor and let the browser perform the navigation itself.
      // Calling window.open here does not work: with 'noopener' it returns null
      // by specification, so any "popup blocked" fallback fires on every click
      // and navigates the top window away on top of opening the new tab.
      // Mutating the anchor during capture is also popup-blocker safe, since the
      // browser still sees a genuine user gesture on a link.
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    };
    // Rebind whenever the frame swaps documents. The initial contentDocument is
    // a same-origin about:blank, so binding once attached the listener to a
    // document that is thrown away the moment the real page arrives — which is
    // exactly how the contact links stopped working.
    const bindClicks = () => {
      const doc = iframe.contentDocument;
      if (!doc || doc === boundDoc) return;
      if (boundDoc) boundDoc.removeEventListener('click', onExternalClick, true);
      doc.addEventListener('click', onExternalClick, true);
      boundDoc = doc;
    };

    let lastH = 0;
    const fit = () => {
      const doc = iframe.contentDocument;
      if (!doc || !doc.body) return;
      const h = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);
      if (h && Math.abs(h - lastH) > 1) {
        lastH = h;
        iframe.style.height = `${h}px`;
        // Real height is known — drop the reservation so there is no gap.
        if (sectionRef.current) sectionRef.current.style.minHeight = '0px';
      }
    };
    const attachRO = () => {
      const doc = iframe.contentDocument;
      if (doc && doc.body && 'ResizeObserver' in window && !ro) {
        ro = new ResizeObserver(fit);
        ro.observe(doc.body);
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
  }, [shouldLoad]);

  return (
    <section id={id} ref={sectionRef} className="embed-section">
      {shouldLoad && (
        <iframe ref={frameRef} className="embed-frame" src={src} title={title} scrolling="no" />
      )}
    </section>
  );
}
