// Sub-basement: concrete, pipes, rust, brick and a roaring boiler.
import {
  texture, noiseFill, mottle, speckle, stain, drips, grimeGradient, bevel, rivet, tinyText,
  C, mix, darken, lighten, hash2, cellular, PixelCanvas, wset,
} from '../lib/tex.js';
import { G } from '../lib/pal.js';

const T = (name) => `assets/textures/${name}.png`;

function cracks(c, r, count, color) {
  for (let i = 0; i < count; i++) {
    let x = r.range(0, 64);
    let y = r.range(0, 64);
    let a = r.range(0, Math.PI * 2);
    const len = r.int(6, 18);
    for (let k = 0; k < len; k++) {
      wset(c, x, y, color);
      a += r.range(-0.6, 0.6);
      x += Math.cos(a);
      y += Math.sin(a);
    }
  }
}

function concrete(name, { dark = false } = {}) {
  const { c, r, seed } = texture(name);
  const base = dark ? 0.22 : 0.4;
  noiseFill(c, seed, C('concrete', base - 0.08), C('concrete', base + 0.08), { cells: 5, grain: 0.35, contrast: 1.1 });
  speckle(c, seed, 0.12, 0.25);
  // Form-tie holes from the poured walls.
  for (const y of [12, 44]) {
    for (const x of [12, 44]) {
      c.ellipse(x, y, 1.6, 1.6, C('concrete', 0.08));
      c.set(x - 1, y - 1, C('concrete', base + 0.15));
    }
  }
  c.rect(0, 31, 64, 1, C('concrete', base - 0.12));
  cracks(c, r, 3, C('concrete', 0.08));
  for (let i = 0; i < 3; i++) stain(c, r, { radius: r.range(5, 10), color: C('olive', 0.15), strength: 0.3, ring: 0.1 });
  drips(c, r, 8, C('rust', 0.25), { startY: 0, maxLen: 40, strength: 0.35 });
  grimeGradient(c, { bottom: 0.3, top: 0.15 });
  return c;
}

function concreteFloor() {
  const { c, r, seed } = texture('concrete-floor');
  noiseFill(c, seed, C('concrete', 0.26), C('concrete', 0.38), { cells: 6, grain: 0.35 });
  speckle(c, seed, 0.14, 0.3);
  for (let i = 0; i < 3; i++) stain(c, r, { radius: r.range(5, 11), color: C('gray', 0.08), strength: 0.55, ring: 0.15 }); // oil
  cracks(c, r, 4, C('concrete', 0.1));
  c.rect(0, 0, 64, 1, C('concrete', 0.18));
  c.rect(0, 0, 1, 64, C('concrete', 0.18));
  return c;
}

function concreteStripe() {
  const c = concrete('concrete-stripe');
  for (let y = 44; y < 56; y++) {
    for (let x = 0; x < 64; x++) {
      const p = c.get(x, y);
      const stripe = ((x + y) >> 3) & 1 ? C('yellow', 0.72) : C('gray', 0.08);
      c.set(x, y, mix(stripe, p, 0.25));
    }
  }
  c.rect(0, 43, 64, 1, C('concrete', 0.15));
  c.rect(0, 56, 64, 1, C('concrete', 0.15));
  return c;
}

function pipes() {
  const { c, r, seed } = texture('pipes');
  noiseFill(c, seed, C('concrete', 0.2), C('concrete', 0.28), { cells: 4, grain: 0.3 });
  const pipe = (y, h, ramp, t) => {
    for (let yy = 0; yy < h; yy++) {
      const f = yy / (h - 1);
      const shade = 0.55 + Math.sin(f * Math.PI) * 0.45 - f * 0.25;
      c.rect(0, y + yy, 64, 1, C(ramp, t * shade + 0.05));
    }
    c.rect(0, y + h, 64, 1, C('gray', 0.04));
  };
  pipe(6, 9, 'rust', 0.6);
  pipe(22, 6, 'orange', 0.55);
  pipe(36, 12, 'steel', 0.55);
  pipe(54, 5, 'rust', 0.5);
  // Brackets and flanges.
  for (const x of [10, 42]) {
    c.rect(x, 4, 3, 56, C('gray', 0.18));
    c.rect(x, 4, 1, 56, C('gray', 0.32));
  }
  c.rect(24, 34, 4, 16, C('steel', 0.35));
  bevel(c, 54, 20, 8, 10, C('blood', 0.45));
  c.ellipse(58, 25, 3, 3, C('blood', 0.6)); // valve wheel
  drips(c, r, 8, C('olive', 0.3), { startY: 15, maxLen: 20, strength: 0.4 });
  drips(c, r, 6, C('rust', 0.35), { startY: 48, maxLen: 12, strength: 0.4 });
  grimeGradient(c, { bottom: 0.25, top: 0.15 });
  return c;
}

function metalGrate() {
  const { c, seed } = texture('metal-grate');
  noiseFill(c, seed, C('rust', 0.18), C('rust', 0.28), { cells: 4, grain: 0.2 });
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const gx = x % 8;
      const gy = y % 8;
      if (gx >= 2 && gy >= 2) c.set(x, y, C('gray', gx === 2 || gy === 2 ? 0.06 : 0.02));
      else if (gx === 0 || gy === 0) c.set(x, y, lighten(c.get(x, y), 0.15));
    }
  }
  mottle(c, seed + 1, 0.2);
  return c;
}

function rustPanel() {
  const { c, r, seed } = texture('rust-panel');
  for (let x = 0; x < 64; x++) {
    const corr = Math.sin((x / 64) * Math.PI * 8);
    for (let y = 0; y < 64; y++) c.set(x, y, C('steel', 0.3 + corr * 0.06));
  }
  const n = cellular(seed, 64, 5);
  c.eachOpaque((x, y, p) => {
    const v = n(x, y);
    const rust = Math.max(0, 0.55 - v.d) * 0.9 + hash2(x, y, seed) * 0.2 + (y / 64) * 0.25;
    return mix(p, C('rust', 0.28 + hash2(x, y, 3) * 0.15), Math.min(0.85, rust));
  });
  c.rect(0, 0, 64, 2, C('steel', 0.5));
  c.rect(0, 62, 64, 2, C('steel', 0.15));
  for (let x = 4; x < 64; x += 15) {
    rivet(c, x, 4, C('steel', 0.55));
    rivet(c, x, 58, C('steel', 0.55));
  }
  drips(c, r, 12, C('rust', 0.25), { startY: 4, maxLen: 50, strength: 0.4 });
  grimeGradient(c, { bottom: 0.2, top: 0.05 });
  return c;
}

function brick(name, { mortar = C('concrete', 0.15), a = C('rust', 0.32), b = C('blood', 0.35), slime = 0, moss = false } = {}) {
  const { c, r, seed } = texture(name);
  const bh = 8;
  const bw = 16;
  for (let y = 0; y < 64; y++) {
    const row = Math.floor(y / bh);
    const off = row % 2 ? bw / 2 : 0;
    for (let x = 0; x < 64; x++) {
      const bx = Math.floor((x + off) / bw);
      const inX = (x + off) % bw;
      const inY = y % bh;
      if (inY === 0 || inX === 0) {
        c.set(x, y, mortar);
        continue;
      }
      const tone = hash2(bx, row, seed);
      let col = mix(a, b, tone);
      col = mix(col, C('gray', 0.1), hash2(x, y, seed + 4) * 0.25);
      if (inY === 1) col = lighten(col, 0.12);
      if (inY === bh - 1) col = darken(col, 0.25);
      c.set(x, y, col);
    }
  }
  if (moss) {
    c.eachOpaque((x, y, p) => (hash2(x >> 1, y >> 1, seed + 9) > 0.8 && y % 8 > 4 ? mix(p, C('olive', 0.35), 0.6) : undefined));
  }
  if (slime) drips(c, r, 14, C('toxic', 0.55), { startY: 0, maxLen: 48, strength: slime, width: 2 });
  grimeGradient(c, { bottom: 0.3, top: 0.2 });
  return c;
}

function boiler() {
  const frames = [];
  for (let f = 0; f < 3; f++) {
    const { c, seed } = texture('boiler');
    noiseFill(c, seed, C('rust', 0.2), C('rust', 0.3), { cells: 4, grain: 0.2 });
    // Riveted shell.
    for (let y = 0; y < 64; y += 16) {
      c.rect(0, y, 64, 1, C('rust', 0.12));
      for (let x = 2; x < 64; x += 6) rivet(c, x, y + 2, C('rust', 0.4));
    }
    // Firebox door with a glowing grate.
    bevel(c, 18, 26, 28, 24, C('gray', 0.2), { depth: 2 });
    for (let y = 30; y < 46; y++) {
      for (let x = 22; x < 42; x++) {
        if (x % 4 === 0) {
          c.set(x, y, C('gray', 0.1));
          continue;
        }
        const h = hash2(x, y + f * 17, seed);
        const heat = (y - 30) / 16 + h * 0.5;
        c.set(x, y, heat > 1.1 ? G('yellow', 0.9) : heat > 0.7 ? G('yellow', 0.4) : heat > 0.45 ? G('yellow', 0) : G('red', 0.5));
      }
    }
    // Gauges.
    for (const [gx, gy] of [[12, 12], [52, 12]]) {
      c.ellipse(gx, gy, 5, 5, C('gray', 0.6));
      c.ellipse(gx, gy, 4, 4, C('beige', 0.85));
      c.line(gx, gy, gx + (f === 1 ? 3 : 2), gy - 2, C('blood', 0.6));
    }
    tinyText(c, 'DANGER', 20, 54, C('yellow', 0.7));
    frames.push(c);
  }
  const out = new PixelCanvas(64 * 3, 64);
  frames.forEach((fr, i) => out.blit(fr, i * 64, 0));
  return out;
}


export default [
  { name: 'concrete', out: T('concrete'), draw: () => concrete('concrete') },
  { name: 'concrete-dark', out: T('concrete-dark'), draw: () => concrete('concrete-dark', { dark: true }) },
  { name: 'concrete-floor', out: T('concrete-floor'), draw: concreteFloor },
  { name: 'concrete-stripe', out: T('concrete-stripe'), draw: concreteStripe },
  { name: 'pipes', out: T('pipes'), draw: pipes },
  { name: 'metal-grate', out: T('metal-grate'), draw: metalGrate },
  { name: 'rust-panel', out: T('rust-panel'), draw: rustPanel },
  { name: 'brick-dirty', out: T('brick-dirty'), draw: () => brick('brick-dirty') },
  { name: 'boiler', out: T('boiler'), draw: boiler },
];

export { brick, concrete };
