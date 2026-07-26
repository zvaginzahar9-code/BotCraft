import EmbeddedPage from './EmbeddedPage.jsx';

/**
 * Pricing — the standalone pricing page authored in
 * "новые цены/Страница цен для BotCraft для пк версии", served verbatim from
 * public/pricing-desktop/ and embedded as an auto-sizing iframe. The #pricing
 * anchor is preserved so the nav ("Цены") keeps working.
 */
export default function Pricing() {
  return <EmbeddedPage id="pricing" src="/pricing-desktop/index.html" title="Цены BotCraft" />;
}
