import { forwardRef } from 'react';
import { LOGO_VIEWBOX, LOGO_GROUP_TRANSFORM, LOGO_PATHS } from './logoPaths.js';
import './logo.css';

// Single compound path (silhouette + interior detail subpaths) so the fill
// preserves the interior negative space instead of flooding it solid.
const FILL_D = LOGO_PATHS.join(' ');

/**
 * LogoMark — reproduces the provided draw-on animation from
 * `прорисовка логотипа/BotCraft.html` one-to-one:
 *   • a "draw" layer — the real SVG paths stroked white (2.4px, non-scaling),
 *     revealed via stroke-dashoffset;
 *   • a "fill" layer — the same shape flooded white, revealed after the draw.
 *
 * We use the rectangle-stripped paths (our source SVG carries a bounding frame
 * the reference logo did not), so there is no opaque box — just the mascot on
 * transparent, with its interior gaps intact.
 *
 * The intro timeline (draw → fill → tagline) is played by useStory.
 */
const LogoMark = forwardRef(function LogoMark(
  { className = '', title = 'BotCraft', filled = false },
  ref,
) {
  // Static filled mode (no draw intro) — used for the docked/finale marks.
  if (filled) {
    return (
      <div ref={ref} className={`logo-mark ${className}`} role="img" aria-label={title}>
        <div className="logo-fill" style={{ opacity: 1 }}>
          <svg viewBox={LOGO_VIEWBOX} preserveAspectRatio="xMidYMid meet">
            <g transform={LOGO_GROUP_TRANSFORM}>
              <path d={FILL_D} fill="#ffffff" fillRule="nonzero" />
            </g>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`logo-mark ${className}`} role="img" aria-label={title}>
      {/* draw layer */}
      <div data-bc-draw className="logo-draw">
        <svg viewBox={LOGO_VIEWBOX} preserveAspectRatio="xMidYMid meet">
          <g transform={LOGO_GROUP_TRANSFORM} fill="none" stroke="#ffffff" strokeWidth={2.4}>
            {LOGO_PATHS.map((d, i) => (
              <path key={i} d={d} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        </svg>
      </div>

      {/* fill layer (revealed after the draw completes) */}
      <div data-bc-fill className="logo-fill">
        <svg viewBox={LOGO_VIEWBOX} preserveAspectRatio="xMidYMid meet">
          <g transform={LOGO_GROUP_TRANSFORM}>
            <path d={FILL_D} fill="#ffffff" fillRule="nonzero" />
          </g>
        </svg>
      </div>
    </div>
  );
});

export default LogoMark;
