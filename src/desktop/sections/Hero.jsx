import LogoMark from '../components/Logo.jsx';
import './sections.css';

/**
 * Act 1 — pure black stage. The logo draws itself, floods white, then the
 * tagline fades in. On scroll (handled by useStory) the logo docks to the nav.
 * Everything here is fixed/centered; scroll length comes from #act-hero.
 */
export default function Hero() {
  return (
    <div id="hero" className="hero" aria-label="BotCraft">
      <div id="hero-logo" className="hero__logo">
        <div className="hero__logo-inner">
          <LogoMark className="hero__mark" />
        </div>
      </div>

      <p id="hero-tagline" className="hero__tagline">
        Ваш сайт за&nbsp;дни, а&nbsp;не&nbsp;недели
      </p>
    </div>
  );
}
