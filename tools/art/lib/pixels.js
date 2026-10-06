// Hand-drawn pixel art as text grids. Each character is one pixel, looked up
// in a legend of palette colours ('.' and ' ' are transparent):
//
//   const head = part(['.oo.', 'oOoo', '.oo.'], { o: C('orange', 0.5), O: C('orange', 0.8) });
//   stamp(canvas, head, 10, 4);
//
// Characters are drawn as separate parts (head, body, arms, legs) so poses can
// reuse them; the parts are stamped onto a frame back to front.
import { PixelCanvas } from './canvas.js';
import palette from '../../../src/content/palette.js';
import { mix } from './canvas.js';
import { nearest } from './pal.js';

/** Parse a grid into a part: { w, h, px: (colour | null)[] }. Throws on ragged rows or unknown characters. */
export function part(rows, legend) {
  const w = rows[0].length;
  const px = [];
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`pixel grid row ${y} is ${row.length} wide, expected ${w}: "${row}"`);
    for (const ch of row) {
      if (ch === '.' || ch === ' ') px.push(null);
      else if (legend[ch]) px.push(legend[ch]);
      else throw new Error(`pixel grid row ${y}: no colour for "${ch}"`);
    }
  });
  return { w, h: rows.length, px };
}

/** Draw a part onto a canvas with its top-left corner at (x, y). */
export function stamp(canvas, p, x, y, { flipX = false } = {}) {
  for (let j = 0; j < p.h; j++) {
    for (let i = 0; i < p.w; i++) {
      const c = p.px[j * p.w + (flipX ? p.w - 1 - i : i)];
      if (c) canvas.set(x + i, y + j, c);
    }
  }
  return canvas;
}

/** A new w x h frame with the given parts stamped in order: [[part, x, y, opts?], ...]. */
export function compose(w, h, layers) {
  const c = new PixelCanvas(w, h);
  for (const [p, x, y, opts] of layers) if (p) stamp(c, p, x, y, opts);
  return c;
}

// Where each palette colour sits: { ramp, i, start, count } by "r,g,b".
const RAMP_OF = new Map();
for (const [ramp, [start, count]] of Object.entries(palette.ramps)) {
  for (let i = 0; i < count; i++) {
    const [r, g, b] = palette.colors[start + i];
    const key = `${r},${g},${b}`;
    if (!RAMP_OF.has(key)) RAMP_OF.set(key, { ramp, i, start, count });
  }
}
const rampOf = (c) => (c ? RAMP_OF.get(`${c[0]},${c[1]},${c[2]}`) : null);
const shade = (info, i) => [...palette.colors[info.start + Math.max(0, Math.min(info.count - 1, i))]];
const hash = (x, y, seed) => {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/**
 * Hand-painted finish for a composed frame, so flat cel shading reads as
 * soft, painted pixels:
 * - `blend`: ramps whose shade boundaries are dithered over two pixels (a
 *   checkerboard step, then a sparser one), so bands of colour melt into
 *   each other instead of meeting in hard lines;
 * - `grain`: chance per pixel (in `blend` ramps) of a one-step darker or
 *   lighter fleck, for texture like felt or denim;
 * - edges between different materials (except `crisp` ramps, for small
 *   features like eyes and glasses) get every other pixel mixed halfway;
 * - there's no outline on the lit top and left; along the bottom and right
 *   the sprite gets a soft dark shade of the colour it borders.
 */
export function paint(c, { blend = [], crisp = ['gray'], grain = 0.06, seed = 1, outline = true } = {}) {
  const src = c.clone();
  const soft = new Set(blend);
  const hard = new Set(crisp);
  const at = (x, y) => src.get(x, y);
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      const here = at(x, y);
      const info = rampOf(here);
      if (!info) continue;
      if (soft.has(info.ramp)) {
        let i = info.i;
        for (const [dx, dy] of DIRS) {
          const n1 = rampOf(at(x + dx, y + dy));
          const n2 = rampOf(at(x + 2 * dx, y + 2 * dy));
          const darker = (n) => n && n.ramp === info.ramp && n.i < info.i && info.i - n.i <= 4;
          if (darker(n1)) {
            if (((x + y) & 1) === 0) i = info.i - 1;
            break;
          }
          if (n1 && n1.ramp === info.ramp && n1.i === info.i && darker(n2)) {
            if ((x & 1) === 0 && (y & 1) === 0) i = info.i - 1;
            break;
          }
        }
        const g = hash(x, y, seed);
        if (g < grain) i += g < grain * 0.65 ? -1 : 1;
        if (i !== info.i) {
          c.set(x, y, shade(info, i));
          continue;
        }
      }
      // Soft edges between materials.
      if (hard.has(info.ramp) || ((x + y) & 1) !== 0) continue;
      for (const [dx, dy] of DIRS) {
        const other = at(x + dx, y + dy);
        const n = rampOf(other);
        if (!n || n.ramp === info.ramp || hard.has(n.ramp)) continue;
        c.set(x, y, nearest(mix(here, other, 0.5)));
        break;
      }
    }
  }
  if (!outline) return c;
  const solid = c.clone();
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      if (solid.opaque(x, y)) continue;
      // Only where the sprite is above or to the left of this pixel, i.e.
      // along its bottom and right (the side away from the light).
      const col = solid.get(x, y - 1) ?? solid.get(x - 1, y);
      if (!col) continue;
      const info = rampOf(col);
      c.set(x, y, info ? shade(info, Math.round(info.count * 0.16)) : [20, 18, 20]);
    }
  }
  return c;
}
