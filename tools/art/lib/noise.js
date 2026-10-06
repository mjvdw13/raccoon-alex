// Seeded, tileable noise functions for procedural textures.

/** Stable string → 32-bit seed (FNV-1a). */
export function seedFrom(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Integer lattice hash → [0, 1). */
export function hash2(x, y, seed = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const smooth = (t) => t * t * (3 - 2 * t);

/**
 * Value noise that tiles with period (px, py) lattice cells.
 * Returns a function (x, y) → [0, 1] where x/y are in lattice units.
 */
export function valueNoise(seed, px = 256, py = px) {
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = smooth(x - xi);
    const fy = smooth(y - yi);
    const w = (v, p) => ((v % p) + p) % p;
    const a = hash2(w(xi, px), w(yi, py), seed);
    const b = hash2(w(xi + 1, px), w(yi, py), seed);
    const c = hash2(w(xi, px), w(yi + 1, py), seed);
    const d = hash2(w(xi + 1, px), w(yi + 1, py), seed);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

/**
 * Tileable fractal noise over a `size`-pixel texture.
 * `cells` = lattice cells across the texture at the lowest octave.
 * Returns (x, y) → [0, 1] for pixel coordinates.
 */
export function fbm(seed, size, { cells = 4, octaves = 4, gain = 0.5, sizeY = size, cellsY } = {}) {
  const cy = cellsY ?? Math.max(1, Math.round((cells * sizeY) / size));
  const layers = [];
  for (let o = 0; o < octaves; o++) {
    const m = 2 ** o;
    layers.push({ fn: valueNoise(seed + o * 7919, cells * m, cy * m), sx: (cells * m) / size, sy: (cy * m) / sizeY, amp: gain ** o });
  }
  const total = layers.reduce((s, l) => s + l.amp, 0);
  return (x, y) => {
    let v = 0;
    for (const l of layers) v += l.fn(x * l.sx, y * l.sy) * l.amp;
    return v / total;
  };
}

/**
 * Tileable cellular (Worley) noise: distance to the nearest feature point,
 * normalized roughly to [0, 1]. Also returns the id of the nearest cell.
 */
export function cellular(seed, size, cells = 6, sizeY = size, cellsY = cells) {
  const cw = size / cells;
  const ch = sizeY / cellsY;
  return (x, y) => {
    const gx = Math.floor(x / cw);
    const gy = Math.floor(y / ch);
    let best = Infinity;
    let second = Infinity;
    let id = 0;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const cx = gx + ox;
        const cyy = gy + oy;
        const wx = ((cx % cells) + cells) % cells;
        const wy = ((cyy % cellsY) + cellsY) % cellsY;
        const fx = (cx + hash2(wx, wy, seed)) * cw;
        const fy = (cyy + hash2(wx, wy, seed + 1)) * ch;
        const d = Math.hypot(x - fx, y - fy);
        if (d < best) {
          second = best;
          best = d;
          id = wy * cells + wx;
        } else if (d < second) second = d;
      }
    }
    return { d: best / Math.max(cw, ch), edge: (second - best) / Math.max(cw, ch), id };
  };
}

/** Seeded random generator for art code (same algorithm as the engine). */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  const next = () => {
    let t = (s = (s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (a, b) => a + (b - a) * next();
  next.int = (a, b) => a + Math.floor(next() * (b - a + 1));
  next.pick = (list) => list[Math.floor(next() * list.length)];
  next.chance = (p) => next() < p;
  return next;
}
