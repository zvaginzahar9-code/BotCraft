import { useEffect, useRef, useState } from 'react';

/**
 * One-shot in-view flag, the CSS-driven replacement for framer-motion's
 * `whileInView` + `viewport={{ once: true }}`.
 *
 * framer-motion cost ~100 KB raw (~35 KB brotli) on the desktop critical path
 * and was imported in exactly one component. Every property it animated here
 * (opacity, transform, filter) is CSS-animatable, so a class toggle plus a
 * transition reproduces the reveal at a fraction of the weight.
 *
 * `rootMargin` maps directly to framer's `viewport.margin`. Disconnects on the
 * first intersection — these reveals never replay.
 */
export function useInView({ rootMargin = '0px', threshold = 0 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return undefined;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, rootMargin, threshold]);

  return [ref, inView];
}
