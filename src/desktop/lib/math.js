/** Clamp v into [min,max]. */
export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Linear interpolate. */
export const lerp = (a, b, t) => a + (b - a) * t;

/** Remap x from [inMin,inMax] to [outMin,outMax], clamped. */
export const mapRange = (x, inMin, inMax, outMin, outMax) => {
  const t = clamp((x - inMin) / (inMax - inMin), 0, 1);
  return outMin + (outMax - outMin) * t;
};

/** Smoothstep 0..1. */
export const smoothstep = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/**
 * Framerate-independent exponential damping (à la three.js MathUtils.damp).
 * `lambda` ~ speed; higher = snappier.
 */
export const damp = (current, target, lambda, dt) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));
