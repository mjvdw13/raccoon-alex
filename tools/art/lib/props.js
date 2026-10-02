// Helpers for modelling everyday props (boxes, cans, cups) with lib/model.js.
// Objects sit on the floor and are seen from slightly above, so tops show.
import { lighten, darken } from './canvas.js';

export const ellipse = (cx, cy, rx, ry, n = 20) =>
  Array.from({ length: n }, (_, k) => [cx + Math.cos((k / n) * Math.PI * 2) * rx, cy + Math.sin((k / n) * Math.PI * 2) * ry]);

/** A box: front face (x, y, w, h) plus a visible top face `top` pixels deep. */
export function box(m, x, y, w, h, top, col, mat, { topCol, z = 8, bevel = 1.5 } = {}) {
  m.slab([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], z, col, mat, { bevel, thickness: 1 });
  if (top > 0) {
    m.slab([[x + 1, y - top], [x + w - 1, y - top], [x + w, y + 0.5], [x, y + 0.5]], z - 1, topCol ?? lighten(col, 0.12), mat, {
      bevel: 1,
      thickness: 0.5,
      tilt: [0, -2.2],
    });
  }
}

/** An upright cylinder (cans, cups, drums) from y0 (top) to y1 (bottom). */
export function cylinder(m, cx, y0, y1, r, col, mat, { topCol, z = 6, squash = 0.32, open = false, inside } = {}) {
  const ry = r * squash;
  m.capsule(cx, y0 + ry, z, cx, y1 - ry, z, r, r, col, mat);
  m.ellipsoid(cx, y1 - ry, z, r, ry * 1.6, r, col, mat);
  m.slab(ellipse(cx, y0, r, ry), z + r + 0.5, topCol ?? lighten(col, 0.1), mat, { tilt: [0, -2.4], bevel: 1, thickness: 0.4 });
  if (open) m.paint(cx, y0 + 0.3, r * 0.8, ry * 0.7, inside ?? darken(col, 0.7));
}

/** A floor-lying flat ellipse (puddles, rugs, shadows). */
export function flat(m, cx, cy, rx, ry, col, mat, z = -10) {
  m.slab(ellipse(cx, cy, rx, ry), z, col, mat, { tilt: [0, -2.6], bevel: 1, thickness: 0.3 });
}
