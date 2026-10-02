// The underworld: sewers, toxic sludge, garbage and worse.
import {
  texture, noiseFill, mottle, speckle, stain, drips, grimeGradient,
  C, mix, darken, lighten, hash2, fbm, cellular, PixelCanvas, wset,
} from '../lib/tex.js';
import { G } from '../lib/pal.js';
import { brick } from './basement.js';

const T = (name) => `assets/textures/${name}.png`;

function sewerFloor() {
  const { c, r, seed } = texture('sewer-floor');
  const cell = cellular(seed, 64, 4);
  c.each((x, y) => {
    const v = cell(x, y);
    const base = C('olive', 0.18 + hash2(v.id, 1, seed) * 0.1);
    if (v.edge < 0.06) return C('olive', 0.06);
    return mix(base, C('gray', 0.1), hash2(x, y, seed) * 0.3);
  });
  // Puddles with wet highlights.
  for (let i = 0; i < 3; i++) stain(c, r, { radius: r.range(4, 8), color: C('teal', 0.12), strength: 0.6, ring: -0.2 });
  speckle(c, seed, 0.06, 0.3);
  for (let i = 0; i < 20; i++) wset(c, r.int(0, 63), r.int(0, 63), C('teal', 0.45));
  return c;
}

function sewage() {
  const frames = [];
  const n = fbm(91, 64, { cells: 4, octaves: 3 });
  for (let f = 0; f < 4; f++) {
    const { c } = texture('sewage');
    c.each((x, y) => {
      const v = n((x + f * 16) % 64, (y + f * 8) % 64);
      const w = n((x * 2 + 32 - f * 16 + 128) % 64, (y * 2 + f * 16) % 64);
      const t = v * 0.7 + w * 0.3;
      if (t > 0.74) return G('green', 0.05);
      if (t > 0.68) return C('toxic', 0.45);
      if (t > 0.6) return C('toxic', 0.28);
      return mix(C('olive', 0.1), C('toxic', 0.18), Math.max(0, (t - 0.3) * 2));
    });
    // Bubbles.
    for (let k = 0; k < 5; k++) {
      const x = Math.floor(hash2(k, f, 7) * 60) + 2;
      const y = Math.floor(hash2(k, f, 8) * 60) + 2;
      c.set(x, y, G('green', 0.6));
      c.set(x + 1, y, C('toxic', 0.9));
      c.set(x, y + 1, C('toxic', 0.4));
    }
    frames.push(c);
  }
  const out = new PixelCanvas(256, 64);
  frames.forEach((fr, i) => out.blit(fr, i * 64, 0));
  return out;
}

const TRASH = () => [
  [C('olive', 0.12), C('olive', 0.25)], // black-green bags
  [C('gray', 0.08), C('gray', 0.22)], // black bags
  [C('beige', 0.5), C('beige', 0.65)], // cardboard
  [C('blood', 0.45), C('steel', 0.7)], // cans
  [C('toxic', 0.35), C('teal', 0.5)], // bottles
  [C('gray', 0.75), C('beige', 0.85)], // newspaper
  [C('yellow', 0.55), C('orange', 0.5)], // peels
];

function trashWall(name, { flesh = 0 } = {}) {
  const { c, r, seed } = texture(name);
  c.fill(C('gray', 0.05));
  const palette = TRASH();
  for (let i = 0; i < 70; i++) {
    const x = r.range(-6, 70);
    const y = r.range(-6, 70);
    const [a, b] = r.pick(palette);
    const rx = r.range(3, 9);
    const ry = r.range(2, 6);
    for (let dy = -ry; dy <= ry; dy++) {
      for (let dx = -rx; dx <= rx; dx++) {
        if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) > 1) continue;
        const t = 0.5 - dy / ry * 0.35 + (hash2(Math.floor(x + dx), Math.floor(y + dy), seed) - 0.5) * 0.3;
        wset(c, x + dx, y + dy, mix(a, b, Math.max(0, Math.min(1, t))));
      }
    }
    // Shine on plastic.
    wset(c, x - rx * 0.3, y - ry * 0.4, lighten(b, 0.3));
  }
  if (flesh) {
    const n = fbm(seed + 5, 64, { cells: 3, octaves: 3 });
    c.each((x, y, p) => {
      const v = n(x, y);
      if (v < 0.52 - flesh * 0.2) return undefined;
      const vein = Math.abs(Math.sin(x * 0.4 + v * 12)) < 0.12;
      const col = vein ? C('blood', 0.45) : mix(C('flesh', 0.35), C('flesh', 0.6), hash2(x, y, seed) * 0.6 + (v - 0.5));
      return col;
    });
    drips(c, r, 10, C('blood', 0.4), { startY: 0, maxLen: 30, strength: 0.6 });
  }
  grimeGradient(c, { bottom: 0.25, top: 0.25 });
  return c;
}

function fleshEye() {
  const frames = [];
  const looks = [[0, 0], [-2, 0], [2, 1], [0, 0]];
  for (let f = 0; f < 4; f++) {
    const c = trashWall('flesh-eye-base', { flesh: 1 });
    const cx = 32;
    const cy = 30;
    c.ellipse(cx, cy, 14, 10, C('flesh', 0.25));
    if (f === 3) {
      // Blink.
      c.ellipse(cx, cy, 12, 8, C('flesh', 0.5));
      c.rect(cx - 11, cy, 22, 1, C('flesh', 0.15));
    } else {
      c.ellipse(cx, cy, 12, 8, C('beige', 0.88));
      for (let k = 0; k < 6; k++) c.line(cx - 11 + k * 4, cy - 6 + (k % 2) * 12, cx - 6 + k * 2, cy, C('blood', 0.6));
      const [lx, ly] = looks[f];
      c.ellipse(cx + lx, cy + ly, 5, 5, G('red', 0.5));
      c.ellipse(cx + lx, cy + ly, 3, 3, G('red', 1));
      c.ellipse(cx + lx, cy + ly, 1.5, 2.5, C('gray', 0.02));
      c.set(cx + lx - 2, cy + ly - 2, G('yellow', 1));
    }
    frames.push(c);
  }
  const out = new PixelCanvas(256, 64);
  frames.forEach((fr, i) => out.blit(fr, i * 64, 0));
  return out;
}

function landfill(name, { dirt = false } = {}) {
  const { c, r, seed } = texture(name);
  noiseFill(c, seed, C('rust', 0.12), C('olive', 0.22), { cells: 6, grain: 0.4 });
  speckle(c, seed, 0.15, 0.3);
  if (!dirt) {
    const palette = TRASH();
    for (let i = 0; i < 16; i++) {
      const [a, b] = r.pick(palette);
      const x = r.int(0, 63);
      const y = r.int(0, 63);
      const w = r.int(2, 5);
      for (let k = 0; k < w; k++) {
        wset(c, x + k, y, a);
        wset(c, x + k, y + 1, b);
      }
    }
  } else {
    for (let i = 0; i < 25; i++) wset(c, r.int(0, 63), r.int(0, 63), C('concrete', 0.4));
  }
  mottle(c, seed + 2, 0.25);
  return c;
}

function boneWall() {
  const { c, r, seed } = texture('bone-wall');
  noiseFill(c, seed, C('rust', 0.08), C('rust', 0.14), { cells: 4 });
  // Fish skeletons and chicken bones: a raccoon's buffet, fossilized.
  for (let i = 0; i < 9; i++) {
    const x = r.int(4, 56);
    const y = r.int(4, 58);
    const bone = C('beige', r.range(0.6, 0.85));
    if (r.chance(0.5)) {
      // Fish skeleton.
      c.line(x, y, x + 12, y, bone);
      for (let k = 2; k < 11; k += 2) {
        c.set(x + k, y - 2, bone);
        c.set(x + k, y + 2, bone);
        c.set(x + k, y - 1, bone);
        c.set(x + k, y + 1, bone);
      }
      c.ellipse(x - 1, y, 2, 2, bone);
      c.poly([[x + 12, y], [x + 15, y - 3], [x + 15, y + 3]], bone);
    } else {
      // Drumstick bone.
      c.capsule(x, y, x + 8, y + 5, 1.2, bone);
      c.ellipse(x, y, 1.8, 1.8, bone);
      c.ellipse(x + 8, y + 5, 1.8, 1.8, bone);
    }
  }
  c.eachOpaque((x, y, p) => (p[0] > 120 && hash2(x, y, seed) > 0.8 ? darken(p, 0.3) : undefined));
  grimeGradient(c, { bottom: 0.3, top: 0.2 });
  return c;
}

export default [
  { name: 'sewer-brick', out: T('sewer-brick'), draw: () => brick('sewer-brick', { a: C('olive', 0.26), b: C('rust', 0.24), mortar: C('olive', 0.08), moss: true }) },
  {
    name: 'sewer-brick-slime',
    out: T('sewer-brick-slime'),
    draw: () => brick('sewer-brick-slime', { a: C('olive', 0.26), b: C('rust', 0.24), mortar: C('olive', 0.08), moss: true, slime: 0.7 }),
  },
  { name: 'sewer-floor', out: T('sewer-floor'), draw: sewerFloor },
  { name: 'sewage', out: T('sewage'), draw: sewage },
  { name: 'trash-wall', out: T('trash-wall'), draw: () => trashWall('trash-wall') },
  { name: 'flesh-trash', out: T('flesh-trash'), draw: () => trashWall('flesh-trash', { flesh: 0.6 }) },
  { name: 'flesh-eye', out: T('flesh-eye'), draw: fleshEye },
  { name: 'landfill', out: T('landfill'), draw: () => landfill('landfill') },
  { name: 'dirt', out: T('dirt'), draw: () => landfill('dirt', { dirt: true }) },
  { name: 'bone-wall', out: T('bone-wall'), draw: boneWall },
];
