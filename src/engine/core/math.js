export const TAU = Math.PI * 2;

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const deg2rad = (d) => (d * Math.PI) / 180;

/** Wrap an angle into [0, TAU). */
export function normAngle(a) {
  a %= TAU;
  return a < 0 ? a + TAU : a;
}

/** Signed smallest difference (b - a), in (-PI, PI]. */
export function angleDiff(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  else if (d <= -Math.PI) d += TAU;
  return d;
}

export const distance = (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0);

/** Approach `target` from `value` by at most `step`. */
export function approach(value, target, step) {
  if (value < target) return Math.min(value + step, target);
  return Math.max(value - step, target);
}
