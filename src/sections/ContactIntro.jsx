import './sections.css';

/**
 * Fixed eyebrow/heading that fades in over the final contact act, above the
 * MacBook that displays the contact "OS".
 */
export default function ContactIntro() {
  return (
    <div id="contact-intro" className="contact-intro" aria-hidden>
      <p className="eyebrow">Контакты</p>
    </div>
  );
}
