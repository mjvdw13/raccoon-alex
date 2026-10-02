// Material helpers for seamless 64x64 textures.
import { PixelCanvas, mix, darken, lighten } from './canvas.js';
import { fbm, hash2, cellular, rng, seedFrom } from './noise.js';
import { C } from './pal.js';

export { PixelCanvas, mix, darken, lighten, fbm, hash2, cellular, rng, seedFrom, C };

/** New texture canvas plus a seeded rng and noise helpers bound to its name. */
export function texture(name, w = 64, h = w) {
  const seed = seedFrom(name);
  return { c: new PixelCanvas(w, h), r: rng(seed), seed, w, h };
}

/** Wrapping pixel set for seamless textures. */
export function wset(c, x, y, col) {
  c.set(((Math.floor(x) % c.w) + c.w) % c.w, ((Math.floor(y) % c.h) + c.h) % c.h, col);
}

export function wget(c, x, y) {
  return c.get(((Math.floor(x) % c.w) + c.w) % c.w, ((Math.floor(y) % c.h) + c.h) % c.h);
}

/** Fill with a 2-colour noisy gradient: base colours a→b driven by tileable fbm. */
export function noiseFill(c, seed, a, b, opts = {}) {
  const n = fbm(seed, c.w, { cells: opts.cells ?? 4, octaves: opts.octaves ?? 4, sizeY: c.h, gain: opts.gain ?? 0.55 });
  const grain = opts.grain ?? 0.08;
  c.each((x, y) => {
    let t = n(x, y);
    t += (hash2(x, y, seed + 99) - 0.5) * grain * 2;
    return mix(a, b, Math.max(0, Math.min(1, (t - 0.5) * (opts.contrast ?? 1.6) + 0.5)));
  });
  return c;
}

/** Multiply brightness of every pixel by (1 + amount * (noise - 0.5)). */
export function mottle(c, seed, amount = 0.3, cells = 3) {
  const n = fbm(seed, c.w, { cells, octaves: 3, sizeY: c.h });
  c.eachOpaque((x, y, p) => {
    const f = 1 + amount * (n(x, y) - 0.5) * 2;
    return [p[0] * f, p[1] * f, p[2] * f];
  });
  return c;
}

/** Sprinkle single-pixel specks (lighter and darker). */
export function speckle(c, seed, density = 0.06, amount = 0.25) {
  c.eachOpaque((x, y, p) => {
    const h = hash2(x, y, seed + 7);
    if (h < density / 2) return darken(p, amount);
    if (h > 1 - density / 2) return lighten(p, amount * 0.6);
    return undefined;
  });
  return c;
}

/** Irregular blotch (stain) that wraps around edges. */
export function stain(c, r, { x, y, radius = 8, color, strength = 0.5, ring = 0.3 }) {
  const cx = x ?? r.range(0, c.w);
  const cy = y ?? r.range(0, c.h);
  const n = fbm(Math.floor(r() * 1e9), 64, { cells: 4, octaves: 3 });
  for (let dy = -radius * 1.6; dy <= radius * 1.6; dy++) {
    for (let dx = -radius * 1.6; dx <= radius * 1.6; dx++) {
      const d = Math.hypot(dx, dy) / radius;
      const warp = (n((dx + 64) % 64, (dy + 64) % 64) - 0.5) * 0.9;
      const dd = d + warp;
      if (dd > 1) continue;
      const p = wget(c, cx + dx, cy + dy);
      if (!p) continue;
      let t = strength * (1 - dd * 0.5);
      if (dd > 0.82) t += ring; // darker tide-line at the edge
      wset(c, cx + dx, cy + dy, mix(p, color, Math.min(1, t)));
    }
  }
}

/** Short random scratches. */
export function scratches(c, r, count, color, { maxLen = 6, vertical = false } = {}) {
  for (let i = 0; i < count; i++) {
    let x = r.range(0, c.w);
    let y = r.range(0, c.h);
    const len = r.int(2, maxLen);
    const a = vertical ? Math.PI / 2 + r.range(-0.3, 0.3) : r.range(0, Math.PI);
    for (let k = 0; k < len; k++) {
      const p = wget(c, x, y);
      if (p) wset(c, x, y, mix(p, color, 0.6));
      x += Math.cos(a);
      y += Math.sin(a);
    }
  }
}

/** Vertical drip streaks from the top or from given points (rust, slime, blood). */
export function drips(c, r, count, color, { minLen = 6, maxLen = 30, startY = 0, strength = 0.55, width = 1 } = {}) {
  for (let i = 0; i < count; i++) {
    const x = r.int(0, c.w - 1);
    const len = r.int(minLen, maxLen);
    const y0 = startY + r.int(-2, 4);
    for (let k = 0; k < len; k++) {
      const t = strength * (1 - k / len);
      for (let wx = 0; wx < width; wx++) {
        const p = wget(c, x + wx, y0 + k);
        if (p) wset(c, x + wx, y0 + k, mix(p, color, t));
      }
    }
    // droplet
    const p = wget(c, x, y0 + len);
    if (p) wset(c, x, y0 + len, mix(p, color, strength * 0.8));
  }
}

/** Darken toward the bottom (grime) and/or top (soot). */
export function grimeGradient(c, { bottom = 0.25, top = 0.1, height = 0.35 } = {}) {
  c.eachOpaque((x, y, p) => {
    const ty = y / (c.h - 1);
    let f = 0;
    if (ty > 1 - height) f += bottom * ((ty - (1 - height)) / height);
    if (ty < height) f += top * (1 - ty / height);
    return f ? darken(p, f) : undefined;
  });
  return c;
}

/** Bevelled rectangle (panels, plates): light top/left edge, dark bottom/right. */
export function bevel(c, x, y, w, h, base, { depth = 1, hi = 0.25, lo = 0.35, fill = true } = {}) {
  if (fill) c.rect(x, y, w, h, base);
  for (let d = 0; d < depth; d++) {
    c.rect(x + d, y + d, w - d * 2, 1, lighten(base, hi));
    c.rect(x + d, y + d, 1, h - d * 2, lighten(base, hi * 0.7));
    c.rect(x + d, y + h - 1 - d, w - d * 2, 1, darken(base, lo));
    c.rect(x + w - 1 - d, y + d, 1, h - d * 2, darken(base, lo * 0.8));
  }
}

/** Rivet / screw head. */
export function rivet(c, x, y, base) {
  c.set(x, y, lighten(base, 0.45));
  c.set(x + 1, y, base);
  c.set(x, y + 1, base);
  c.set(x + 1, y + 1, darken(base, 0.5));
}

/** Tiny 3x5 pixel font for signs and labels baked into textures. */
export const GLYPHS = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101111011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
  9: '111101111001110', ':': '000010000010000', '!': '010010010000010', '?': '110001010000010', '-': '000000111000000',
  '.': '000000000000010', ' ': '000000000000000', "'": '010010000000000', '/': '001001010100100', '%': '101001010100101',
  '#': '101111101111101', '$': '011110010011110', '&': '010101010101011', '(': '010100100100010', ')': '010001001001010', ',': '000000000010100', '_': '000000000000111', '*': '101010111010101', '+': '000010111010000', '=': '000111000111000', '<': '001010100010001', '>': '100010001010100',
};

export function tinyText(c, text, x, y, color, { scale = 1, spacing = 1 } = {}) {
  let cx = x;
  for (const ch of String(text).toUpperCase()) {
    const g = GLYPHS[ch] ?? GLYPHS['?'];
    for (let gy = 0; gy < 5; gy++) {
      for (let gx = 0; gx < 3; gx++) {
        if (g[gy * 3 + gx] === '1') c.rect(cx + gx * scale, y + gy * scale, scale, scale, color);
      }
    }
    cx += (3 + spacing) * scale;
  }
  return cx;
}

export function tinyTextWidth(text, { scale = 1, spacing = 1 } = {}) {
  return String(text).length * (3 + spacing) * scale - spacing * scale;
}
