import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap.js';

/**
 * Installs Lenis smooth scrolling and wires it into GSAP's ScrollTrigger so
 * both share a single rAF loop / scroll source. Returns nothing — it is a
 * side-effectful hook mounted once at the app root.
 *
 * Honors prefers-reduced-motion by disabling smoothing (native scroll).
 */
export function useSmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reduce,
      syncTouch: false,
      touchMultiplier: 1.2,
      wheelMultiplier: 1,
    });

    // Drive Lenis from GSAP's ticker for a single synchronized loop.
    lenis.on('scroll', ScrollTrigger.update);
    const onTick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Expose for programmatic scrolling (e.g. nav / CTA anchors).
    window.__lenis = lenis;

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);
}

/** Smoothly scroll to a target (selector, element, or offset). */
export function scrollTo(target, options = {}) {
  if (window.__lenis) window.__lenis.scrollTo(target, { duration: 1.2, ...options });
}
