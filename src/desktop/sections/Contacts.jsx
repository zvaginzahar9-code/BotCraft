import EmbeddedPage from './EmbeddedPage.jsx';

/**
 * Contacts — the closing screen authored in
 * "конец и контакты/Страница цен для BotCraft/Контакты BotCraft.dc.html",
 * served verbatim from public/contacts/ and embedded as an auto-sizing iframe.
 * The #contact anchor lets the nav ("Связаться") scroll here.
 */
export default function Contacts() {
  return <EmbeddedPage id="contact" src="/contacts/index.html" title="Контакты BotCraft" />;
}
