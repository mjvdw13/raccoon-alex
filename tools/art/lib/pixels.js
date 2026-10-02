// Hand-drawn pixel art as text grids. Each character is one pixel, looked up
// in a legend of palette colours ('.' and ' ' are transparent):
//
//   const head = part(['.oo.', 'oOoo', '.oo.'], { o: C('orange', 0.5), O: C('orange', 0.8) });
//   stamp(canvas, head, 10, 4);
//
// Characters are drawn as separate parts (head, body, arms, legs) so poses can
// reuse them; the parts are stamped onto a frame back to front.
import { PixelCanvas } from './canvas.js';

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
