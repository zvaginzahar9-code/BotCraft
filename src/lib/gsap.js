import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Sensible global defaults for the whole experience.
gsap.defaults({ ease: 'power3.out', duration: 0.8 });

// A little easier to reason about pixel-perfect pinning on resize.
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger };
