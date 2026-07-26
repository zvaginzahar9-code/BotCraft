import { scrollTo } from '../lib/useSmoothScroll.js';
import './sections.css';

/**
 * Persistent top nav. Hidden until the hero logo docks into the top-left
 * corner (useStory fades this in). The docked logo mark itself lives in Hero
 * and animates into place; this bar holds the wordmark + CTA beside it.
 */
export default function SiteNav() {
  return (
    <header id="site-nav" className="nav" role="banner">
      <div className="nav__left">
        {/* space reserved for the docked logo mark */}
        <span className="nav__brand">BotCraft</span>
      </div>
      <nav className="nav__links" aria-label="Основная навигация">
        <button onClick={() => scrollTo('#act-mac')}>Работа</button>
        <button onClick={() => scrollTo('#why')}>Почему мы</button>
        <button onClick={() => scrollTo('#pricing')}>Цены</button>
        <button className="nav__cta" onClick={() => scrollTo('#act-contact')}>
          Связаться
        </button>
      </nav>
    </header>
  );
}
