// Palette helpers for art generators. Everything is snapped to the game palette
// before saving, so the PNGs look exactly like they will in-game.
import palette from '../../../src/content/palette.js';

export const PAL = palette;
const RGB = palette.colors;
const FB = palette.fullbrightStart;

/** Colour from a named ramp at relative brightness t (0 = darkest, 1 = brightest). */
export function C(name, t = 0.5) {
  const r = palette.ramps[name];
  if (!r) throw new Error(`Unknown palette ramp "${name}"`);
  const [start, count] = r;
  const i = start + Math.round(Math.max(0, Math.min(1, t)) * (count - 1));
  return [...RGB[i]];
}

/** Glow (fullbright) colour; same as C() but documents intent. */
export const G = (name, t = 1) => C(name.startsWith('glow-') ? name : `glow-${name}`, t);

function dist(r1, g1, b1, r2, g2, b2) {
  const rm = (r1 + r2) * 0.5;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
}

const exact = new Map();
RGB.forEach((c, i) => {
  if (i === 255) return;
  const k = (c[0] << 16) | (c[1] << 8) | c[2];
  if (!exact.has(k)) exact.set(k, i);
});
const cache = new Map();

/** Nearest palette index. Exact glow colours are kept; anything else maps to lit colours only. */
export function nearestIndex(r, g, b) {
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));
  const k = (r << 16) | (g << 8) | b;
  const e = exact.get(k);
  if (e !== undefined) return e;
  const cached = cache.get(k);
  if (cached !== undefined) return cached;
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < FB; i++) {
    const d = dist(r, g, b, RGB[i][0], RGB[i][1], RGB[i][2]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  cache.set(k, best);
  return best;
}

export const nearest = (c) => [...RGB[nearestIndex(c[0], c[1], c[2])]];

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/**
 * Floyd–Steinberg error diffusion inside the opaque area only. Gives shaded
 * sprites the noisy, digitized look of classic 90s shooter art.
 */
function quantizeFS(canvas, strength) {
  const { w, h, data: d } = canvas;
  const err = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const o = i * 4;
      if (d[o + 3] < 128) {
        d[o] = 0;
        d[o + 1] = 0;
        d[o + 2] = 0;
        d[o + 3] = 0;
        continue;
      }
      const exactIdx = exact.get((d[o] << 16) | (d[o + 1] << 8) | d[o + 2]);
      const keep = exactIdx !== undefined && exactIdx >= FB; // glow colours stay exact
      const r = d[o] + (keep ? 0 : err[i * 3]);
      const g = d[o + 1] + (keep ? 0 : err[i * 3 + 1]);
      const b = d[o + 2] + (keep ? 0 : err[i * 3 + 2]);
      const c = keep ? RGB[exactIdx] : RGB[nearestIndex(r, g, b)];
      d[o] = c[0];
      d[o + 1] = c[1];
      d[o + 2] = c[2];
      d[o + 3] = 255;
      if (keep) continue;
      const er = (r - c[0]) * strength;
      const eg = (g - c[1]) * strength;
      const eb = (b - c[2]) * strength;
      const spread = (xx, yy, f) => {
        if (xx < 0 || yy >= h || xx >= w) return;
        const j = yy * w + xx;
        if (d[j * 4 + 3] < 128) return;
        err[j * 3] += er * f;
        err[j * 3 + 1] += eg * f;
        err[j * 3 + 2] += eb * f;
      };
      spread(x + 1, y, 7 / 16);
      spread(x - 1, y + 1, 3 / 16);
      spread(x, y + 1, 5 / 16);
      spread(x + 1, y + 1, 1 / 16);
    }
  }
  return canvas;
}

/**
 * Snap every opaque pixel of a canvas to the palette. `dither` (0..48) adds
 * ordered dithering for a gritty 80s look on smooth gradients; 'fs' uses
 * error diffusion (best for shaded sprites).
 */
export function quantize(canvas, { dither = 0, strength = 0.8 } = {}) {
  if (dither === 'fs') return quantizeFS(canvas, strength);
  const d = canvas.data;
  for (let y = 0; y < canvas.h; y++) {
    for (let x = 0; x < canvas.w; x++) {
      const o = (y * canvas.w + x) * 4;
      if (d[o + 3] < 128) {
        d[o] = 0;
        d[o + 1] = 0;
        d[o + 2] = 0;
        d[o + 3] = 0;
        continue;
      }
      let r = d[o];
      let g = d[o + 1];
      let b = d[o + 2];
      if (dither && exact.get((r << 16) | (g << 8) | b) === undefined) {
        const t = (BAYER4[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * dither;
        r += t;
        g += t;
        b += t;
      }
      const c = RGB[nearestIndex(r, g, b)];
      d[o] = c[0];
      d[o + 1] = c[1];
      d[o + 2] = c[2];
      d[o + 3] = 255;
    }
  }
  return canvas;
}
