import './sections.css';

/**
 * Left-hand copy that accompanies the iPhone act. Fixed; its opacity is driven
 * by the phone act progress in useStory.
 */
export default function PhoneCopy() {
  return (
    <div id="phone-copy" className="phone-copy" aria-hidden>
      <p className="eyebrow">Mobile-first</p>
      <h2 className="phone-copy__title">
        Адаптивные сайты
        <br />
        для ПК и мобильных
        <br />
        устройств
      </h2>
      <p className="phone-copy__text">
        Один и тот&nbsp;же выверенный опыт на&nbsp;любом экране. Пролистайте — и&nbsp;увидите
        мобильную версию вживую.
      </p>
    </div>
  );
}
