import { useEffect } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { progress, setStarted, useScene } from '../lib/sceneStore.js';
import { clamp } from '../lib/math.js';

/** Normalized sub-progress of `p` within the window [a,b]. */
const sub = (p, a, b) => clamp((p - a) / (b - a), 0, 1);

// Where the docked logo mark lands (top-left), in px.
const NAV = { x: 30, y: 26, size: 30 };

/**
 * The scroll "story": plays the logo intro, then wires every act's scroll range
 * to the shared progress store (which the 3D scene reads each frame). Runs once
 * the scene is ready (models loaded).
 */
export function useStory() {
  const { ready } = useScene();

  useEffect(() => {
    if (!ready) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = window.__lenis;

    const ctx = gsap.context(() => {
      const logoInner = document.querySelector('#hero-logo .hero__logo-inner');
      const drawLayer = document.querySelector('#hero-logo [data-bc-draw]');
      const fillLayer = document.querySelector('#hero-logo [data-bc-fill]');
      const strokes = gsap.utils.toArray('#hero-logo [data-bc-draw] path');
      const tagline = document.querySelector('#hero-tagline');
      const phoneCopy = document.querySelector('#phone-copy');
      const contactIntro = document.querySelector('#contact-intro');
      const lighten = document.querySelector('#scene-lighten');
      const macLeft = document.querySelector('#mac-copy-left');
      const macRight = document.querySelector('#mac-copy-right');
      const phoneStage = document.querySelector('#phone-stage');
      const hint = document.querySelector('#scroll-hint');

      /* ---------------- 1. Logo intro (draw → fill → tagline) ----------
         Ported 1:1 from прорисовка логотипа/BotCraft.html (playIntro):
         stroke-dashoffset draw, then reveal the invert-fill layer. */
      strokes.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: reduce ? 0 : len });
      });
      gsap.set(tagline, { opacity: 0 });
      if (reduce) {
        gsap.set(fillLayer, { opacity: 1 });
        gsap.set(drawLayer, { opacity: 0 });
      }

      if (lenis && !reduce) lenis.stop();

      const intro = gsap.timeline({
        delay: 0.5,
        onComplete: () => {
          setStarted(true);
          if (lenis) lenis.start();
          // Hide the hint after the first bit of scrolling.
          ScrollTrigger.create({
            start: 40,
            end: 240,
            onUpdate: (self) => gsap.set(hint, { opacity: 1 - self.progress }),
          });
        },
      });

      if (reduce) {
        gsap.set(tagline, { opacity: 1 });
        intro.to({}, { duration: 0.1 });
      } else {
        intro
          .to(strokes, {
            strokeDashoffset: 0,
            duration: 2.1,
            ease: 'power2.inOut',
            stagger: 0.12,
          })
          .to(fillLayer, { opacity: 1, duration: 0.7, ease: 'power2.out' }, '-=0.35')
          .to(drawLayer, { opacity: 0, duration: 0.7 }, '<')
          .to(tagline, { opacity: 1, duration: 1.4, ease: 'power2.out' }, '-=0.1')
          .to(hint, { opacity: 1, duration: 1.0 }, '-=0.6');
      }

      /* ---------------- 2. Logo docking to the nav ------------------- */
      const dock = { x: 0, y: 0, s: 1 };
      const measure = () => {
        gsap.set(logoInner, { x: 0, y: 0, scale: 1 });
        const r = logoInner.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        dock.x = NAV.x + NAV.size / 2 - cx;
        dock.y = NAV.y + NAV.size / 2 - cy;
        dock.s = NAV.size / r.width;
      };
      measure();

      gsap
        .timeline({
          scrollTrigger: {
            trigger: '#act-hero',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
            invalidateOnRefresh: true,
            onRefreshInit: measure,
          },
        })
        .to(logoInner, { x: () => dock.x, y: () => dock.y, scale: () => dock.s, ease: 'none' }, 0)
        .fromTo('#hero-tagline', { opacity: 1, y: 0 }, { opacity: 0, y: -60, ease: 'none' }, 0)
        .fromTo('#site-nav', { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'none' }, 0.15)
        .set('#hero-logo', { pointerEvents: 'none' }, 0);

      /* ---------------- 3. MacBook act ------------------------------ */
      ScrollTrigger.create({
        trigger: '#act-mac',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          progress.macIn = sub(p, 0.0, 0.12);
          progress.macOpen = sub(p, 0.1, 0.22);
          progress.macScroll = sub(p, 0.24, 0.86);
          progress.macOut = sub(p, 0.9, 1.0);
          // flanking typography: soft appear with the laptop, out as it leaves
          const mv = Math.min(sub(p, 0.05, 0.2), 1) * (1 - sub(p, 0.8, 0.95));
          if (macLeft) {
            macLeft.style.opacity = String(mv);
            macLeft.style.setProperty('--enter', String(mv));
          }
          if (macRight) {
            macRight.style.opacity = String(mv);
            macRight.style.setProperty('--enter', String(mv));
          }
        },
      });

      /* ---------------- 4. iPhone act ------------------------------- */
      ScrollTrigger.create({
        trigger: '#act-phone',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          progress.phoneIn = sub(p, 0.0, 0.14);
          progress.phoneScroll = sub(p, 0.18, 0.86);
          progress.phoneOut = sub(p, 0.9, 1.0);
          const vis = Math.min(sub(p, 0.03, 0.16), 1) * (1 - sub(p, 0.82, 0.96));
          if (phoneCopy) phoneCopy.style.opacity = String(vis);
          // embedded MONO phone build fades with the act
          const pv = Math.min(sub(p, 0.01, 0.14), 1) * (1 - sub(p, 0.86, 0.98));
          if (phoneStage) phoneStage.style.opacity = String(pv);
        },
      });

      /* ---------------- 5. Pricing fly-up ---------------------------
         Animate the whole group (cards keep their own framer transforms). */
      gsap.to('#pricing-cards', {
        yPercent: -22,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '#pricing',
          start: 'center 42%',
          end: 'bottom top',
          scrub: true,
        },
      });

      /* ---------------- 6. Contact act ------------------------------ */
      ScrollTrigger.create({
        trigger: '#act-contact',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          progress.contactIn = sub(p, 0.0, 0.24);
          progress.contactOpen = sub(p, 0.24, 0.5);
          const vis = Math.min(sub(p, 0.04, 0.22), 1) * (1 - sub(p, 0.9, 1.0));
          if (contactIntro) contactIntro.style.opacity = String(vis);
          // background lifts as the finale settles in
          if (lighten) lighten.style.opacity = String(sub(p, 0.1, 0.55));
        },
      });

      // Let everything measure correctly once fonts/layout settle.
      ScrollTrigger.refresh();
    });

    return () => ctx.revert();
  }, [ready]);
}
