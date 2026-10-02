import { IndexedImage, downscale, quantize } from '../gfx/image.js';
import { FACE } from './face.js';

/**
 * Turn a photo into a full status-bar face sheet (same layout as the drawn
 * one) plus a title-screen portrait. The photo is cropped, shrunk, crunched
 * into the palette with ordered dithering, and then "damaged" per health tier
 * with procedural eye bags, a raccoon mask, bruises and blood.
 *
 * hero.face options (all optional except photo):
 *   photo: 'assets/custom/alex.jpg'
 *   crop:  [x, y, w, h] in photo pixels (default: centred, 4:5)
 *   eyes:  [[x, y], [x, y]] positions within the crop, 0..1 (default ~[0.35,0.45], [0.65,0.45])
 *   mouth: [x, y] within the crop, 0..1 (default [0.5, 0.76])
 */

const W = 24;
const H = 30;

function defaultCrop(img) {
  const iw = img.width;
  const ih = img.height;
  let w = iw;
  let h = Math.round((iw * 5) / 4);
  if (h > ih) {
    h = ih;
    w = Math.round((ih * 4) / 5);
  }
  return [Math.round((iw - w) / 2), Math.round((ih - h) / 2), w, h];
}

class Rgba {
  constructor(src) {
    this.w = src.width;
    this.h = src.height;
    this.d = new Float32Array(src.data);
  }

  clone() {
    const c = Object.create(Rgba.prototype);
    c.w = this.w;
    c.h = this.h;
    c.d = new Float32Array(this.d);
    return c;
  }

  get(x, y) {
    x = Math.max(0, Math.min(this.w - 1, Math.round(x)));
    y = Math.max(0, Math.min(this.h - 1, Math.round(y)));
    const o = (y * this.w + x) * 4;
    return [this.d[o], this.d[o + 1], this.d[o + 2]];
  }

  set(x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const o = (y * this.w + x) * 4;
    this.d[o] = c[0];
    this.d[o + 1] = c[1];
    this.d[o + 2] = c[2];
    this.d[o + 3] = 255;
  }

  /** Blend toward a colour inside an ellipse. */
  tint(cx, cy, rx, ry, color, amount) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const f = 1 - (dx * dx + dy * dy);
        if (f <= 0 || x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
        const o = (y * this.w + x) * 4;
        const a = amount * Math.min(1, f * 2);
        for (let k = 0; k < 3; k++) this.d[o + k] += (color[k] - this.d[o + k]) * a;
      }
    }
  }

  map(fn) {
    for (let i = 0; i < this.w * this.h; i++) {
      const o = i * 4;
      const [r, g, b] = fn(this.d[o], this.d[o + 1], this.d[o + 2], i % this.w, Math.floor(i / this.w));
      this.d[o] = r;
      this.d[o + 1] = g;
      this.d[o + 2] = b;
    }
  }

  shear(amount) {
    const src = this.clone();
    for (let y = 0; y < this.h; y++) {
      const off = Math.round(amount * (1 - y / this.h));
      for (let x = 0; x < this.w; x++) this.set(x, y, src.get(x - off, y));
    }
  }

  shiftBox(cx, cy, rx, ry, dx) {
    const src = this.clone();
    for (let y = Math.round(cy - ry); y <= Math.round(cy + ry); y++) {
      for (let x = Math.round(cx - rx); x <= Math.round(cx + rx); x++) this.set(x, y, src.get(x - dx, y));
    }
  }

  toImageData() {
    const out = new Uint8ClampedArray(this.d.length);
    for (let i = 0; i < this.d.length; i++) out[i] = this.d[i];
    return { width: this.w, height: this.h, data: out };
  }
}

const BLOOD = [150, 12, 8];
const BAG = [60, 30, 60];
const MASK = [16, 14, 16];

function variant(base, { tier = 0, look = 0, turn = 0, expr = 'neutral' }, eyes, mouth) {
  const f = base.clone();
  const [[lx, ly], [rx, ry]] = eyes;
  const [mx, my] = mouth;
  if (expr === 'god') {
    for (const [x, y] of eyes) f.tint(x, y + 2, 2.5, 1.5, [255, 230, 200], 0.35);
  } else if (expr !== 'dead') {
    if (tier >= 3) {
      const top = Math.min(ly, ry) - 2;
      const bot = Math.max(ly, ry) + (tier >= 4 ? 3 : 2);
      for (let y = top; y <= bot; y++) for (let x = lx - 4; x <= rx + 4; x++) f.tint(x, y, 1, 1, MASK, 0.85);
      for (let x = lx - 3; x <= rx + 3; x++) f.tint(x, top - 1, 1, 1, [200, 200, 195], 0.6);
    } else {
      const amt = [0.4, 0.55, 0.7][tier];
      for (const [x, y] of eyes) f.tint(x, y + 2, 3, 1.6 + tier * 0.3, BAG, amt);
    }
  }
  if (look) for (const [x, y] of eyes) f.shiftBox(x, y, 2, 1, look);
  if (turn) {
    f.shear(turn * 2);
    f.map((r, g, b, x) => {
      const far = turn > 0 ? x < 8 : x > 15;
      return far ? [r * 0.8, g * 0.8, b * 0.8] : [r, g, b];
    });
  }
  if (tier >= 2 && expr !== 'god') {
    f.tint(rx + 2, ry + 5, 1.5, 1.3, [90, 40, 90], 0.5);
  }
  if (tier >= 3 && expr !== 'god') {
    for (let y = Math.round(ly - 6); y < ly - 1; y++) f.set(lx + 4, y, BLOOD);
    f.set(mx - 4, my + 1, BLOOD);
  }
  if (tier >= 4 && expr !== 'god') {
    f.tint(lx - 2, my - 2, 1.5, 1.5, BLOOD, 0.8);
    for (let y = Math.round(my); y < my + 4; y++) f.set(mx + 3, y, BLOOD);
  }
  switch (expr) {
    case 'ouch':
      f.tint(mx, my + 0.5, 2, 1.8, [40, 8, 8], 0.9);
      break;
    case 'grin':
      f.tint(mx, my, 3, 1.2, [235, 225, 210], 0.85);
      break;
    case 'rampage':
      f.map((r, g, b) => [r * 1.1 + 20, g * 0.85, b * 0.85]);
      f.tint(mx, my, 3, 1, [230, 220, 200], 0.8);
      break;
    case 'dead':
      f.map((r, g, b) => {
        const v = (r + g + b) / 3;
        return [v * 0.7, v * 0.7, v * 0.75];
      });
      for (const [x, y] of eyes) for (let k = -2; k <= 2; k++) f.set(x + k, y, [30, 25, 25]);
      break;
    default:
      break;
  }
  return f;
}

/**
 * @param {import('../assets.js').Assets} assets
 * @param {import('../gfx/palette.js').Palette} palette
 * @param {*} cfg hero.face
 * @returns {Promise<{sheet: IndexedImage, portrait: IndexedImage}>}
 */
export async function buildPhotoFace(assets, palette, cfg) {
  const full = await assets.loadRGBA(cfg.photo);
  const crop = cfg.crop ?? defaultCrop(full);
  const cropped = {
    width: crop[2],
    height: crop[3],
    data: new Uint8ClampedArray(crop[2] * crop[3] * 4),
  };
  for (let y = 0; y < crop[3]; y++) {
    for (let x = 0; x < crop[2]; x++) {
      const sx = Math.min(full.width - 1, Math.max(0, crop[0] + x));
      const sy = Math.min(full.height - 1, Math.max(0, crop[1] + y));
      const so = (sy * full.width + sx) * 4;
      const o = (y * crop[2] + x) * 4;
      cropped.data[o] = full.data[so];
      cropped.data[o + 1] = full.data[so + 1];
      cropped.data[o + 2] = full.data[so + 2];
      cropped.data[o + 3] = 255;
    }
  }
  const small = new Rgba(downscale(cropped, W, H));
  // Gritty grade: lift contrast a touch and cool the shadows.
  small.map((r, g, b) => {
    const c = (v) => Math.max(0, Math.min(255, (v - 128) * 1.15 + 128));
    return [c(r), c(g), c(b) + 4];
  });
  const eyesRel = cfg.eyes ?? [
    [0.35, 0.45],
    [0.65, 0.45],
  ];
  const eyes = eyesRel.map(([x, y]) => [x * (W - 1), y * (H - 1)]);
  const mouthRel = cfg.mouth ?? [0.5, 0.76];
  const mouth = [mouthRel[0] * (W - 1), mouthRel[1] * (H - 1)];

  const sheet = new IndexedImage(W * FACE.PER_TIER, H * 6);
  const place = (img, col, row) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) sheet.pixels[(row * H + y) * sheet.width + col * W + x] = img.pixels[y * W + x];
  };
  const frames = [{ look: 0 }, { look: -1 }, { look: 1 }, { turn: 1 }, { turn: -1 }, { expr: 'ouch' }, { expr: 'grin' }, { expr: 'rampage' }];
  for (let tier = 0; tier < FACE.TIERS; tier++) {
    frames.forEach((fr, i) => {
      const v = variant(small, { tier, ...fr }, eyes, mouth);
      place(quantize(v.toImageData(), palette, { dither: 22, litOnly: true }), i, tier);
    });
  }
  const god = quantize(variant(small, { expr: 'god' }, eyes, mouth).toImageData(), palette, { dither: 22, litOnly: true });
  for (const [x, y] of eyes) god.pixels[Math.round(y) * W + Math.round(x)] = palette.ramp('glow-yellow', 1);
  place(god, 0, 5);
  const dead = quantize(variant(small, { tier: 2, expr: 'dead' }, eyes, mouth).toImageData(), palette, { dither: 22, litOnly: true });
  const z = palette.ramp('glow-yellow', 1);
  for (const [x, y] of [[19, 1], [20, 1], [21, 1], [20, 2], [19, 3], [20, 3], [21, 3]]) dead.pixels[y * W + x] = z;
  place(dead, 1, 5);

  const portraitRgba = downscale(cropped, 72, 90);
  const portrait = quantize(portraitRgba, palette, { dither: 26, litOnly: true });
  return { sheet, portrait };
}
