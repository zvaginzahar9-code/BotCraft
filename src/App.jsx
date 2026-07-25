import { Suspense, lazy } from 'react';
import { useSmoothScroll } from './lib/useSmoothScroll.js';
import { useStory } from './hooks/useStory.js';
import Background from './components/Background.jsx';
import Preloader from './components/Preloader.jsx';
import SiteNav from './sections/SiteNav.jsx';
import Hero from './sections/Hero.jsx';
import MacCopy from './sections/MacCopy.jsx';
import PhoneCopy from './sections/PhoneCopy.jsx';
import PhoneStage from './sections/PhoneStage.jsx';
import WhyUs from './sections/WhyUs.jsx';
import Pricing from './sections/Pricing.jsx';
import ContactIntro from './sections/ContactIntro.jsx';
import ScrollHint from './components/ScrollHint.jsx';

// The WebGL layer is heavy — split it out of the initial bundle.
const Experience = lazy(() => import('./three/Experience.jsx'));

export default function App() {
  useSmoothScroll();
  useStory();

  return (
    <>
      <Preloader />

      {/* Animated background, behind the transparent WebGL canvas */}
      <Background />

      {/* Fixed WebGL stage behind everything */}
      <Suspense fallback={null}>
        <Experience />
      </Suspense>

      {/* Soft scene-lighten that fades in for the finale (driven by useStory) */}
      <div id="scene-lighten" className="scene-lighten" aria-hidden />

      {/* Fixed UI overlays driven by the scroll story */}
      <SiteNav />
      <Hero />
      <MacCopy />
      <PhoneCopy />
      <PhoneStage />
      <ContactIntro />
      <ScrollHint />

      {/* Scroll-length content: spacers for 3D acts + real flow sections */}
      <main className="content-layer">
        <section id="act-hero" className="act act--hero" aria-hidden />
        <section id="act-mac" className="act act--mac" aria-label="Демонстрация на ноутбуке" />
        <section id="act-phone" className="act act--phone" aria-label="Мобильная версия" />

        <WhyUs />
        <Pricing />

        <section id="act-contact" className="act act--contact" aria-label="Контакты" />
      </main>

      <div className="grain" aria-hidden />
      <div className="vignette" aria-hidden />
    </>
  );
}
