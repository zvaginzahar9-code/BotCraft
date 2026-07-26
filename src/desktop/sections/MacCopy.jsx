import './sections.css';

/**
 * Oversized, low-contrast, light-weight typography flanking the MacBook act —
 * part of the composition rather than a text block. Opacity/enter is driven by
 * the mac-act progress in useStory.
 */
export default function MacCopy() {
  return (
    <div className="mac-copy" aria-hidden>
      <p id="mac-copy-left" className="mac-copy__line mac-copy__line--left">
        <span>Ваша</span>
        <span>идея</span>
      </p>
      <p id="mac-copy-right" className="mac-copy__line mac-copy__line--right">
        <span>Наш</span>
        <span>код</span>
      </p>
    </div>
  );
}
