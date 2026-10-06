// Office textures: carpet, drop ceilings, cubicles, drywall, 80s wood paneling...
import {
  texture, noiseFill, mottle, speckle, stain, scratches, drips, grimeGradient, bevel, tinyText,
  wset, wget, C, mix, darken, lighten, fbm, hash2,
} from '../lib/tex.js';
import { G } from '../lib/pal.js';

const T = (name) => `assets/textures/${name}.png`;

function carpet(name, a, b, stains = 2) {
  const { c, r, seed } = texture(name);
  noiseFill(c, seed, a, b, { cells: 8, octaves: 3, grain: 0.3, contrast: 1.15 });
  c.eachOpaque((x, y, p) => {
    if ((x + y * 2) % 4 === 0) return darken(p, 0.14);
    if ((x * 3 + y) % 5 === 0) return lighten(p, 0.07);
    return undefined;
  });
  speckle(c, seed, 0.12, 0.3);
  for (let i = 0; i < stains; i++) {
    stain(c, r, { radius: r.range(4, 9), color: C('rust', 0.16), strength: 0.5, ring: 0.25 });
  }
  return c;
}

function ceilingBase(name) {
  const { c, r, seed } = texture(name);
  noiseFill(c, seed, C('beige', 0.33), C('beige', 0.47), { cells: 6, grain: 0.3, contrast: 1.0 });
  // Mineral-fibre fissures.
  for (let i = 0; i < 110; i++) {
    const x = r.int(0, 63);
    const y = r.int(0, 63);
    const p = c.get(x, y);
    c.set(x, y, darken(p, 0.3));
    if (r.chance(0.45)) wset(c, x + 1, y + (r.chance(0.5) ? 1 : 0), darken(p, 0.2));
  }
  return { c, r, seed };
}

function tbar(c, positions) {
  for (const k of positions) {
    for (let t = 0; t < 64; t++) {
      c.set(k, t, C('gray', 0.62));
      c.set(t, k, C('gray', 0.62));
      c.set(k + 1, t, C('gray', 0.38));
      c.set(t, k + 1, C('gray', 0.38));
    }
  }
}

function ceilingTile(name, waterStains) {
  const { c, r } = ceilingBase(name);
  for (let i = 0; i < waterStains; i++) {
    stain(c, r, { radius: r.range(5, 10), color: C('yellow', 0.28), strength: 0.35, ring: 0.3 });
  }
  tbar(c, [0, 32]);
  return c;
}

function ceilingLight(name, { broken = false } = {}) {
  const { c, r } = ceilingBase(name);
  tbar(c, [0]);
  // Troffer housing.
  bevel(c, 6, 10, 52, 44, C('gray', 0.7), { depth: 2 });
  // Prismatic diffuser: fullbright so it glows in the dark.
  for (let y = 13; y < 51; y++) {
    for (let x = 9; x < 55; x++) {
      const prism = (x + y) % 3 === 0 || (x - y + 64) % 3 === 0;
      let col = prism ? G('tube', 1) : G('tube', 0);
      if (y >= 22 && y <= 24) col = G('yellow', 1);
      if (y >= 40 && y <= 42) col = G('yellow', 1);
      if (broken && x > 30) col = prism ? C('steel', 0.42) : C('steel', 0.3);
      c.set(x, y, col);
    }
  }
  // Dead bugs in the diffuser (grim).
  for (let i = 0; i < 9; i++) {
    const x = r.int(10, 53);
    const y = r.int(14, 49);
    c.set(x, y, C('gray', 0.12));
    if (r.chance(0.5)) c.set(x + 1, y, C('gray', 0.2));
  }
  return c;
}

function cubicle(name, fabricA, fabricB, { memo = false, poster = false } = {}) {
  const { c, r, seed } = texture(name);
  noiseFill(c, seed, fabricA, fabricB, { cells: 8, octaves: 2, grain: 0.45, contrast: 1.0 });
  c.eachOpaque((x, y, p) => ((x + y) & 1 ? darken(p, 0.09) : undefined));
  // Aluminium posts and top cap.
  for (const px of [0, 32]) {
    c.rect(px, 0, 2, 64, C('steel', 0.55));
    c.rect(px, 0, 1, 64, C('steel', 0.72));
  }
  bevel(c, 0, 0, 64, 4, C('steel', 0.62));
  // Kick base.
  c.rect(0, 57, 64, 7, C('gray', 0.17));
  c.rect(0, 57, 64, 1, C('gray', 0.32));
  for (let i = 0; i < 18; i++) c.set(r.int(0, 63), r.int(58, 63), C('gray', r.chance(0.5) ? 0.28 : 0.08));
  if (memo) {
    const mx = 40;
    const my = 16;
    c.rect(mx, my, 13, 16, C('beige', 0.88));
    for (let l = 0; l < 6; l++) {
      for (let x = mx + 2; x < mx + 11; x++) if (hash2(x, l, 3) > 0.25) c.set(x, my + 3 + l * 2, C('steel', 0.3));
    }
    c.rect(mx + 6, my - 1, 2, 2, C('blood', 0.8));
    c.rect(mx + 1, my + 15, 12, 1, C('beige', 0.55));
    // Second memo, crooked.
    c.poly([[8, 22], [20, 20], [22, 33], [10, 35]], C('yellow', 0.75));
    tinyText(c, 'TPS', 10, 25, C('blood', 0.55));
  }
  if (poster) {
    // "HANG IN THERE" style motivational poster, with a raccoon.
    bevel(c, 36, 10, 24, 30, C('gray', 0.85), { depth: 1 });
    c.rect(38, 12, 20, 20, C('navy', 0.6));
    // raccoon dangling from a branch
    c.rect(38, 15, 20, 1, C('rust', 0.3));
    c.ellipse(48, 23, 4, 4, C('gray', 0.55));
    c.rect(44, 21, 8, 3, C('gray', 0.12));
    c.set(46, 22, C('gray', 0.95));
    c.set(50, 22, C('gray', 0.95));
    c.rect(47, 16, 1, 4, C('gray', 0.5));
    c.rect(49, 16, 1, 4, C('gray', 0.5));
    tinyText(c, 'HANG', 40, 33, C('gray', 0.15));
  }
  grimeGradient(c, { bottom: 0.32, top: 0.05, height: 0.45 });
  return c;
}

function drywall(name, { base = 0.46, dirt = 1, outlet = false, blood = false } = {}) {
  const { c, r, seed } = texture(name);
  noiseFill(c, seed, C('beige', base - 0.06), C('beige', base + 0.05), { cells: 4, grain: 0.12, contrast: 1.2 });
  mottle(c, seed + 1, 0.12);
  // Rubber cove base.
  c.rect(0, 56, 64, 8, C('gray', 0.14));
  c.rect(0, 56, 64, 1, C('gray', 0.3));
  c.rect(0, 63, 64, 1, C('gray', 0.06));
  // Scuffs from chairs and carts.
  for (let i = 0; i < 16 * dirt; i++) {
    const x = r.int(0, 63);
    const y = r.int(38, 55);
    const len = r.int(2, 6);
    for (let k = 0; k < len; k++) {
      const p = wget(c, x + k, y);
      wset(c, x + k, y, mix(p, C('gray', 0.18), 0.5));
    }
  }
  for (let i = 0; i < 2 * dirt; i++) stain(c, r, { radius: r.range(4, 8), color: C('olive', 0.3), strength: 0.25, ring: 0.15 });
  if (outlet) {
    bevel(c, 28, 46, 7, 9, C('beige', 0.7));
    c.rect(30, 48, 1, 2, C('gray', 0.1));
    c.rect(32, 48, 1, 2, C('gray', 0.1));
    c.rect(30, 51, 1, 2, C('gray', 0.1));
    c.rect(32, 51, 1, 2, C('gray', 0.1));
  }
  if (blood) {
    // A smeared handprint... it's been a long night.
    const hx = 20;
    const hy = 18;
    c.ellipse(hx, hy + 6, 4, 4, C('blood', 0.45));
    for (let f = 0; f < 4; f++) c.capsule(hx - 3 + f * 2, hy + 3, hx - 4 + f * 2.4, hy - 3, 0.8, C('blood', 0.45));
    drips(c, r, 6, C('blood', 0.4), { startY: hy + 8, minLen: 8, maxLen: 26, strength: 0.75 });
  }
  grimeGradient(c, { bottom: 0.18, top: 0.12, height: 0.35 });
  return c;
}

function woodPanel(name, { dark = false } = {}) {
  const { c, r, seed } = texture(name);
  const n = fbm(seed, 64, { cells: 2, octaves: 3 });
  for (let p = 0; p < 4; p++) {
    const shade = r.range(-0.05, 0.05) + (dark ? -0.08 : 0);
    const phase = r.range(0, 10);
    for (let x = p * 16; x < p * 16 + 16; x++) {
      for (let y = 0; y < 64; y++) {
        const v = Math.sin(y * 0.22 + n(x, y) * 9 + phase + x * 0.05);
        const t = 0.22 + shade + (v + 1) * 0.06 + (hash2(x, y, seed) - 0.5) * 0.04;
        c.set(x, y, C('rust', t));
      }
    }
    // groove
    c.rect(p * 16, 0, 1, 64, C('rust', 0.04));
    c.rect(p * 16 + 1, 0, 1, 64, C('rust', 0.12));
  }
  // knots
  for (let i = 0; i < 3; i++) {
    const kx = r.int(3, 60);
    const ky = r.int(3, 60);
    c.ellipse(kx, ky, 2, 3, C('rust', 0.1));
    c.set(kx, ky, C('rust', 0.04));
  }
  grimeGradient(c, { bottom: 0.25, top: 0.1, height: 0.3 });
  return c;
}

function whiteboard(name) {
  const { c, r, seed } = texture(name);
  noiseFill(c, seed, C('beige', 0.4), C('beige', 0.48), { cells: 4, grain: 0.1 });
  bevel(c, 2, 8, 60, 38, C('steel', 0.6), { depth: 1 });
  c.rect(4, 10, 56, 34, C('gray', 0.88));
  // ghosting of erased marker
  for (let i = 0; i < 40; i++) c.set(r.int(5, 58), r.int(11, 42), C('gray', 0.78));
  // A graph going down.
  c.line(8, 40, 8, 14, C('navy', 0.5));
  c.line(8, 40, 34, 40, C('navy', 0.5));
  let y = 18;
  for (let x = 9; x < 33; x += 3) {
    const ny = Math.min(39, y + r.int(0, 4));
    c.line(x, y, x + 3, ny, C('blood', 0.7));
    y = ny;
  }
  tinyText(c, 'DUE', 37, 13, C('blood', 0.7));
  tinyText(c, '9AM', 37, 19, C('blood', 0.7));
  tinyText(c, 'NAP?', 37, 26, C('navy', 0.5));
  c.line(37, 32, 52, 32, C('navy', 0.5));
  // Something summoning-circle-ish doodled in the corner.
  c.ring(52, 21, 6, 1, C('blood', 0.55));
  c.line(47, 24, 57, 18, C('blood', 0.55));
  c.line(47, 18, 57, 24, C('blood', 0.55));
  // Marker tray.
  c.rect(4, 46, 56, 2, C('steel', 0.45));
  c.rect(10, 45, 6, 1, C('blood', 0.6));
  c.rect(20, 45, 6, 1, C('navy', 0.6));
  c.rect(0, 56, 64, 8, C('gray', 0.14));
  c.rect(0, 56, 64, 1, C('gray', 0.3));
  grimeGradient(c, { bottom: 0.15, top: 0.12 });
  return c;
}

function windowNight(name) {
  const { c, r, seed } = texture(name);
  // Wall around the window.
  noiseFill(c, seed, C('beige', 0.36), C('beige', 0.44), { cells: 4, grain: 0.1 });
  // Night city through the glass: fullbright window lights.
  c.rect(4, 6, 56, 44, C('navy', 0.15));
  const n = fbm(seed + 3, 64, { cells: 3, octaves: 2 });
  for (let x = 4; x < 60; x++) {
    const top = 22 + Math.floor(n(x * 2, 0) * 20);
    for (let y = top; y < 50; y++) c.set(x, y, C('navy', 0.05));
  }
  for (let i = 0; i < 26; i++) {
    const x = r.int(5, 58);
    const y = r.int(28, 48);
    if (c.get(x, y) && c.get(x, y)[2] < 30) c.set(x, y, r.chance(0.7) ? G('lamp', r.int(0, 2) / 2) : G('cyan', 0.6));
  }
  // Mini-blinds, half closed and bent.
  for (let y = 6; y < 50; y += 3) {
    const bent = r.chance(0.15);
    for (let x = 4; x < 60; x++) {
      if (y > 30 && !bent) continue;
      c.set(x, y + (bent && x > 30 && x < 40 ? 1 : 0), C('beige', 0.62));
      if (y < 30) c.set(x, y + 1, C('beige', 0.35));
    }
  }
  bevel(c, 2, 4, 60, 48, C('steel', 0.4), { depth: 2, fill: false });
  c.rect(4, 50, 56, 3, C('steel', 0.55));
  c.rect(0, 56, 64, 8, C('gray', 0.14));
  c.rect(0, 56, 64, 1, C('gray', 0.3));
  return c;
}

function vending(name) {
  const { c, r } = texture(name);
  c.fill(C('blood', 0.35));
  bevel(c, 0, 0, 64, 64, C('blood', 0.4), { depth: 2 });
  // Glass front with snacks in coils.
  c.rect(5, 6, 38, 46, C('navy', 0.2));
  for (let row = 0; row < 5; row++) {
    const y = 9 + row * 9;
    c.rect(6, y + 6, 36, 1, C('steel', 0.5));
    for (let k = 0; k < 4; k++) {
      const col = r.pick([C('yellow', 0.7), C('orange', 0.6), C('blood', 0.6), C('teal', 0.6), C('purple', 0.6)]);
      if (r.chance(0.2)) continue; // empty slot, naturally
      c.rect(8 + k * 9, y, 6, 6, col);
      c.rect(8 + k * 9, y, 6, 1, lighten(col, 0.3));
    }
  }
  // Glass glare.
  c.line(8, 50, 26, 8, C('steel', 0.45));
  // Lit panel and coin slot.
  c.rect(46, 6, 14, 10, G('green', 0.6));
  tinyText(c, '$1', 48, 8, G('green', 0));
  for (let k = 0; k < 4; k++) c.rect(47 + (k % 2) * 6, 20 + Math.floor(k / 2) * 6, 4, 4, C('gray', 0.7));
  c.rect(50, 34, 4, 6, C('gray', 0.1));
  c.rect(8, 54, 32, 6, C('gray', 0.08));
  tinyText(c, 'SNAX', 46, 44, C('beige', 0.9));
  grimeGradient(c, { bottom: 0.25, top: 0.05 });
  return c;
}

function linoleum(name) {
  const { c, r, seed } = texture(name);
  const a = C('beige', 0.52);
  const b = C('olive', 0.38);
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const check = ((x >> 4) + (y >> 4)) & 1;
      c.set(x, y, check ? a : b);
    }
  }
  mottle(c, seed, 0.2, 4);
  speckle(c, seed, 0.1, 0.2);
  for (let i = 0; i < 3; i++) stain(c, r, { radius: r.range(3, 7), color: C('rust', 0.2), strength: 0.4, ring: 0.2 });
  scratches(c, r, 25, C('gray', 0.25), { maxLen: 8 });
  return c;
}

export default [
  { name: 'carpet', out: T('carpet'), draw: () => carpet('carpet', C('steel', 0.2), C('steel', 0.34)), dither: 6 },
  { name: 'carpet-red', out: T('carpet-red'), draw: () => carpet('carpet-red', C('blood', 0.28), C('flesh', 0.3), 3), dither: 6 },
  { name: 'carpet-brown', out: T('carpet-brown'), draw: () => carpet('carpet-brown', C('rust', 0.18), C('rust', 0.3), 3), dither: 6 },
  { name: 'ceiling-tile', out: T('ceiling-tile'), draw: () => ceilingTile('ceiling-tile', 1) },
  { name: 'ceiling-stained', out: T('ceiling-stained'), draw: () => ceilingTile('ceiling-stained', 4) },
  { name: 'ceiling-light', out: T('ceiling-light'), draw: () => ceilingLight('ceiling-light') },
  { name: 'ceiling-light-broken', out: T('ceiling-light-broken'), draw: () => ceilingLight('ceiling-light-broken', { broken: true }) },
  { name: 'cubicle', out: T('cubicle'), draw: () => cubicle('cubicle', C('steel', 0.3), C('steel', 0.4)) },
  { name: 'cubicle-memo', out: T('cubicle-memo'), draw: () => cubicle('cubicle-memo', C('steel', 0.3), C('steel', 0.4), { memo: true }) },
  { name: 'cubicle-poster', out: T('cubicle-poster'), draw: () => cubicle('cubicle-poster', C('steel', 0.3), C('steel', 0.4), { poster: true }) },
  { name: 'cubicle-beige', out: T('cubicle-beige'), draw: () => cubicle('cubicle-beige', C('beige', 0.34), C('beige', 0.44)) },
  { name: 'drywall', out: T('drywall'), draw: () => drywall('drywall') },
  { name: 'drywall-outlet', out: T('drywall-outlet'), draw: () => drywall('drywall-outlet', { outlet: true }) },
  { name: 'drywall-blood', out: T('drywall-blood'), draw: () => drywall('drywall-blood', { blood: true, dirt: 2 }) },
  { name: 'wood-panel', out: T('wood-panel'), draw: () => woodPanel('wood-panel') },
  { name: 'wood-panel-dark', out: T('wood-panel-dark'), draw: () => woodPanel('wood-panel-dark', { dark: true }) },
  { name: 'whiteboard', out: T('whiteboard'), draw: () => whiteboard('whiteboard') },
  { name: 'window-night', out: T('window-night'), draw: () => windowNight('window-night') },
  { name: 'vending', out: T('vending'), draw: () => vending('vending') },
  { name: 'linoleum', out: T('linoleum'), draw: () => linoleum('linoleum') },
];

// Helpers reused by other texture modules.
export { carpet, drywall, cubicle };
