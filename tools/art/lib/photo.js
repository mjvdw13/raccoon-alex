// Photos for the art tools: load a PNG, shrink it smoothly, sample it, and map
// sprite coordinates onto it from two matching points (usually the eyes).
import fs from 'node:fs';
import { decodePNG } from './png.js';

/** Load a PNG as a float RGB image: { w, h, data: Float32Array(w * h * 3) }. */
export function loadPhoto(file) {
  const png = decodePNG(fs.readFileSync(file));
  const data = new Float32Array(png.width * png.height * 3);
  for (let i = 0; i < png.width * png.height; i++) {
    data[i * 3] = png.data[i * 4];
    data[i * 3 + 1] = png.data[i * 4 + 1];
    data[i * 3 + 2] = png.data[i * 4 + 2];
  }
  return { w: png.width, h: png.height, data };
}

/** Area-averaged resize to w x h (for shrinking without aliasing). */
export function resize(img, w, h) {
  const out = { w, h, data: new Float32Array(w * h * 3) };
  const sx = img.w / w;
  const sy = img.h / h;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * sx);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
      const y0 = Math.floor(y * sy);
      const y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let yy = y0; yy < y1 && yy < img.h; yy++) {
        for (let xx = x0; xx < x1 && xx < img.w; xx++) {
          const i = (yy * img.w + xx) * 3;
          r += img.data[i];
          g += img.data[i + 1];
          b += img.data[i + 2];
          n++;
        }
      }
      const o = (y * w + x) * 3;
      out.data[o] = r / n;
      out.data[o + 1] = g / n;
      out.data[o + 2] = b / n;
    }
  }
  return out;
}

/** Cut out a w x h region starting at (x, y). */
export function crop(img, x, y, w, h) {
  const out = { w, h, data: new Float32Array(w * h * 3) };
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const sx = Math.max(0, Math.min(img.w - 1, x + xx));
      const sy = Math.max(0, Math.min(img.h - 1, y + yy));
      for (let c = 0; c < 3; c++) out.data[(yy * w + xx) * 3 + c] = img.data[(sy * img.w + sx) * 3 + c];
    }
  }
  return out;
}

/** Bilinear sample at (u, v), clamped to the edges. Returns [r, g, b]. */
export function sample(img, u, v) {
  const x = Math.max(0, Math.min(img.w - 1.001, u - 0.5));
  const y = Math.max(0, Math.min(img.h - 1.001, v - 0.5));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const at = (xx, yy, c) => img.data[(yy * img.w + xx) * 3 + c];
  const x1 = Math.min(img.w - 1, x0 + 1);
  const y1 = Math.min(img.h - 1, y0 + 1);
  return [0, 1, 2].map((c) => {
    const top = at(x0, y0, c) * (1 - fx) + at(x1, y0, c) * fx;
    const bot = at(x0, y1, c) * (1 - fx) + at(x1, y1, c) * fx;
    return top * (1 - fy) + bot * fy;
  });
}

/**
 * A similarity transform from sprite coordinates to photo coordinates, given
 * two sprite points [q1, q2] and the photo points [p1, p2] they should land on.
 * The returned function also carries `scale` (photo pixels per sprite pixel).
 */
export function pointMap([q1, q2], [p1, p2]) {
  const qdx = q2[0] - q1[0];
  const qdy = q2[1] - q1[1];
  const pdx = p2[0] - p1[0];
  const pdy = p2[1] - p1[1];
  const scale = Math.hypot(pdx, pdy) / Math.hypot(qdx, qdy);
  const rot = Math.atan2(pdy, pdx) - Math.atan2(qdy, qdx);
  const c = Math.cos(rot) * scale;
  const s = Math.sin(rot) * scale;
  const fn = (x, y) => {
    const ux = x - q1[0];
    const uy = y - q1[1];
    return [p1[0] + c * ux - s * uy, p1[1] + s * ux + c * uy];
  };
  fn.scale = scale;
  return fn;
}

const SKIN_KEYS = [
  [0, [40, 22, 16]],
  [0.35, [112, 66, 46]],
  [0.65, [186, 128, 98]],
  [1, [246, 214, 186]],
];

/** Tint a black-and-white photo pixel with skin tones by its brightness. */
export function skinTone([r, g, b]) {
  const l = Math.max(0, Math.min(1, (r * 0.3 + g * 0.59 + b * 0.11) / 255));
  for (let i = 1; i < SKIN_KEYS.length; i++) {
    const [t1, c1] = SKIN_KEYS[i];
    if (l <= t1) {
      const [t0, c0] = SKIN_KEYS[i - 1];
      const k = (l - t0) / (t1 - t0);
      return [0, 1, 2].map((c) => c0[c] + (c1[c] - c0[c]) * k);
    }
  }
  return SKIN_KEYS[SKIN_KEYS.length - 1][1];
}
