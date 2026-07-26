import './scrollhint.css';

/** Subtle scroll cue; opacity is driven by useStory (fades after first scroll). */
export default function ScrollHint() {
  return (
    <div id="scroll-hint" className="scroll-hint" aria-hidden>
      <span className="scroll-hint__label">Листайте</span>
      <span className="scroll-hint__line">
        <span className="scroll-hint__dot" />
      </span>
    </div>
  );
}
