import { useEffect, useRef } from 'react';
import './background.css';

/**
 * Fixed, animated background that sits BEHIND the (transparent) WebGL canvas.
 * The visuals come from `public/embeds/bg-scroll.html` (the provided background,
 * reproduced 1:1) but its animation clock is driven purely by scroll progress —
 * static when the user isn't scrolling, advancing only as the page moves.
 */
export default function Background() {
  const frameRef = useRef(null);

  useEffect(() => {
    let raf;
    const tick = () => {
      // Drive the background straight from Lenis' (already-smoothed) scroll
      // progress. It advances only while scrolling and holds an exact value when
      // idle, so the background moves with the scroll and freezes instantly on
      // stop — frame-rate independent (no secondary easing to converge).
      const lenis = window.__lenis;
      let progress;
      if (lenis && typeof lenis.progress === 'number' && isFinite(lenis.progress)) {
        progress = lenis.progress;
      } else {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress = max > 0 ? window.scrollY / max : 0;
      }
      const win = frameRef.current && frameRef.current.contentWindow;
      if (win && win.__setBgProgress) win.__setBgProgress(progress);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <iframe
      ref={frameRef}
      className="bg-layer"
      src="/embeds/bg-scroll.html"
      title="background"
      tabIndex={-1}
      aria-hidden
    />
  );
}
