import { useEffect, useRef, useState } from 'react';
import { ScrollTrigger } from '../lib/gsap.js';
import { progress } from '../lib/sceneStore.js';
import './phonestage.css';

/**
 * The provided "Телефон с сайтом MONO" build, embedded 1:1 as an iframe
 * (public/mono-phone/index.html — its own three.js scene: FBX iPhone + CSS3D
 * MONO site). It is placed on the right of the phone act; its background is made
 * transparent so the scene's spheres show through. The inner MONO site is still
 * scrolled by the page (reaching into the nested site), preserving the section's
 * scroll behaviour, and the whole thing fades with the act (driven by useStory).
 */
export default function PhoneStage() {
  const frameRef = useRef(null);
  const [near, setNear] = useState(false);

  // Mount only around the phone act (with lead time to preload) — avoids a
  // second WebGL context running for the whole page.
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: '#act-phone',
      start: 'top 250%',
      end: 'bottom -50%',
      onToggle: (self) => setNear(self.isActive),
    });
    return () => st.kill();
  }, []);

  // Drive the nested MONO site's scroll from the page's phone-act progress.
  useEffect(() => {
    if (!near) return;
    let raf;
    let current = 0;
    let scrollEl = null;
    let tick = 0;

    const findScrollEl = (doc) => {
      const root = doc.scrollingElement || doc.documentElement;
      if (!root) return null;
      let best = root;
      let bestMax = root.scrollHeight - root.clientHeight;
      for (const el of doc.querySelectorAll('div, main, section, article')) {
        const m = el.scrollHeight - el.clientHeight;
        if (m > bestMax) {
          bestMax = m;
          best = el;
        }
      }
      return bestMax > 24 ? best : null;
    };

    const loop = () => {
      try {
        const outerDoc = frameRef.current && frameRef.current.contentDocument;
        const siteIframe = outerDoc && outerDoc.querySelector('iframe');
        const siteDoc = siteIframe && siteIframe.contentDocument;
        if (siteDoc) {
          if (!scrollEl || !scrollEl.isConnected) {
            if (tick++ % 12 === 0) scrollEl = findScrollEl(siteDoc);
          }
          if (scrollEl) {
            if (getComputedStyle(scrollEl).overflowY === 'visible') scrollEl.style.overflowY = 'auto';
            const max = scrollEl.scrollHeight - scrollEl.clientHeight;
            const target = (progress.phoneScroll || 0) * max;
            current += (target - current) * 0.16;
            scrollEl.scrollTop = current;
          }
        }
      } catch {
        /* nested doc not ready yet */
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [near]);

  return (
    <div id="phone-stage" className="phone-stage" aria-hidden>
      {near && (
        <iframe
          ref={frameRef}
          src="/mono-phone/index.html"
          title="MONO phone"
          className="phone-stage__frame"
          tabIndex={-1}
          scrolling="no"
        />
      )}
    </div>
  );
}
