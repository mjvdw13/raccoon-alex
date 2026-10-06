// The Pumpkin King, hand-drawn: a huge, evil, floating pumpkin with Gus's
// face glaring out of a jagged hole carved in its side, lit from below by
// the candle inside. Ribbed orange rind, a twisted stem with a curling tendril, and
// writhing vines dangling underneath instead of legs.
//
// Like Alex's face (ui/face.js), the shapes are laid out by a few lighting
// rules (a ribbed ellipsoid lit from the upper left, the face lit from below
// by the candle), every facial feature is a small hand-drawn grid, and paint()
// then softens the shading into dithered, painted pixels.
//
// Frames (128x128, matching src/content/monsters/pumpkin-king.js): 0-3 float,
// 4-6 attack (grin, roar and fire, grin), 7 pain, 8-10 dying (cracks of
// light, bursting), 11-15 the smashed remains settling.
import { PixelCanvas } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { part, stamp, paint } from '../lib/pixels.js';
import { sheet, flash } from '../lib/sprite.js';
import { hash2, rng, valueNoise } from '../lib/noise.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const norm = (x, y, z) => {
  const n = Math.hypot(x, y, z);
  return [x / n, y / n, z / n];
};
const pick = (ramp, light, shift = 0) => ramp[clamp(Math.round((1 - clamp(light, 0, 1)) * (ramp.length - 1)) + shift, 0, ramp.length - 1)];

// Rind: highlight to deep shadow, the darkest leaning into rust.
const RIND = [
  C('orange', 1),
  C('orange', 0.9),
  C('orange', 0.82),
  C('orange', 0.72),
  C('orange', 0.62),
  C('orange', 0.52),
  C('orange', 0.42),
  C('orange', 0.32),
  C('rust', 0.3),
  C('rust', 0.22),
  C('rust', 0.15),
];
const STEM = [C('olive', 0.62), C('olive', 0.5), C('olive', 0.4), C('olive', 0.3), C('olive', 0.2), C('olive', 0.12)];
const VINE = [C('toxic', 0.5), C('toxic', 0.4), C('toxic', 0.3), C('toxic', 0.2), C('olive', 0.12)];
const SKIN = [0.94, 0.86, 0.78, 0.7, 0.62, 0.54, 0.46, 0.38, 0.3].map((t) => C('skin', t));
const HAIR = [C('rust', 0.5), C('rust', 0.42), C('rust', 0.34), C('rust', 0.27)];
// Candlelight breaking through cracks in the rind, hottest first.
const GLOW = [G('yellow', 0.85), G('yellow', 0.6), G('yellow', 0.4), G('yellow', 0.2)];
const PULP = [C('orange', 0.78), C('orange', 0.6), C('orange', 0.45)];
const SEED = [C('beige', 0.95), C('beige', 0.8)];

const LIGHT = norm(-0.5, -0.6, 0.62);
// The face is lit from below by the candle: campfire-story horror.
const UNDER = norm(-0.1, 0.85, 0.52);
// The dark inside of the pumpkin.
const POCKET = [C('rust', 0.2), C('rust', 0.14), C('rust', 0.09), C('gray', 0.05)];
const FLESH = [C('yellow', 0.8), C('orange', 0.92), C('orange', 0.8), C('orange', 0.66)];
const MOTTLE = valueNoise(17, 128, 128);

const L = {
  K: C('gray', 0.1), // glasses frames
  k: C('gray', 0.05), // pupils
  e: C('beige', 0.86), // eye whites
  i: C('steel', 0.62), // blue eyes
  V: C('skin', 0.36), // lids, creases
  u: C('skin', 0.5),
  h: C('gray', 0.06), // brows
  n: C('skin', 0.42), // nostrils
  S: SKIN[0],
  s: SKIN[1],
  t: SKIN[3],
  U: SKIN[5],
  m: C('flesh', 0.3), // lips
  q: C('skin', 0.6), // lower lip
  w: C('beige', 0.92), // teeth
  r: C('blood', 0.12), // open mouth
  R: G('red', 0.6), // red glint and glowing eyes
  y: G('yellow', 1), // lens glint
  x: C('gray', 0.12), // cracked lens
};
const P = (rows) => part(rows, L);

// ------------------------------------------------------------------ features
// Positions are relative to the face's top-left (the face is 27x35).

const FEAT = {
  // Glasses: rectangular black frames, eyes narrowed behind them.
  glasses: {
    glare: [
      '.KKKKKKKKKKK...KKKKKKKKKKK.',
      'KKR........KKKKKR........KK',
      '.K.VVVVVV..K...K..VVVVVV.K.',
      '.K..eiki...K...K...ikie..K.',
      '.K...uuu...K...K...uuu...K.',
      '..KKKKKKKKK.....KKKKKKKKK..',
    ],
    // Pupils glowing red behind the lenses.
    burn: [
      '.KKKKKKKKKKK...KKKKKKKKKKK.',
      'KKR........KKKKKR........KK',
      '.K.VVVVVV..K...K..VVVVVV.K.',
      '.K..eRRR...K...K...RRRe..K.',
      '.K...uuu...K...K...uuu...K.',
      '..KKKKKKKKK.....KKKKKKKKK..',
    ],
    // Squeezed shut, knocked crooked.
    ouch: [
      '.KKKKKKKKKKK...............',
      'KK.........KKKKKKKKKKKKKKK.',
      '.K.........K...K.........KK',
      '.K..VVVVV..K...K..VVVVV..K.',
      '.K.........K...K.........K.',
      '..KKKKKKKKK....K.........K.',
      '................KKKKKKKKK..',
    ],
    // Cracked lenses, eyes rolled up.
    dead: [
      '.KKKKKKKKKKK...KKKKKKKKKKK.',
      'KK...x.....KKKKK....x....KK',
      '.K..eixe...K...K...exie..K.',
      '.K...ex.x..K...K..x.xe...K.',
      '.K..x...x..K...K.x...x...K.',
      '..KKKKKKKKK.....KKKKKKKKK..',
    ],
  },
  // Thick brows, pulled hard into a V.
  brows: {
    evil: ['hhh.....................hhh', '.hhhhhh.............hhhhhh.', '...hhhhhhh.......hhhhhhh...', '.......hhhh.....hhhh.......'],
    ouch: ['......hhhh.......hhhh......', '...hhhhh...........hhhhh...', '.hhh...................hhh.'],
  },
  nose: P(['..s..', '..St.', '.sSt.', '.SStu', 'nUuUn']),
  // Bags under his eyes, the lines from nose to mouth, the crease under his lip.
  lines: [
    '...uuuu............uuuu....',
    '...........................',
    '...........................',
    '........u.........u........',
    '.......u...........u.......',
    '.......u...........u.......',
    '......u.............u......',
    '...........................',
    '...........................',
    '...........................',
    '..........uuuuuuu..........',
  ],
  mouth: {
    // A sly, lopsided smirk: one corner hooked up.
    smirk: ['.........Um', '..mmmmmmmm.', '.m.qqqqq...'],
    // Wide toothy grin.
    grin: ['m.........m', '.mwwwwwwwm.', '..mmmmmmm..'],
    // Roaring.
    roar: ['.mmmmmmmmm.', 'mwwwwwwwwwm', 'mrrrrrrrrrm', 'mrrrrrrrrrm', '.mwwwwwwwm.', '..mmmmmmm..'],
    ouch: ['...mmmmm...', '..mrrrrrm..', '...mmmmm...'],
  },
};

// ------------------------------------------------------------------ shapes

/** Distance from (x, y) to the polyline pts, with the parameter t (0..1) of the nearest point. */
function nearest(pts, x, y) {
  let best = { d: Infinity, t: 0, sx: 0 };
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, ay] = pts[k];
    const [bx, by] = pts[k + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1;
    const f = clamp(((x - ax) * dx + (y - ay) * dy) / l2, 0, 1);
    const px = ax + dx * f;
    const py = ay + dy * f;
    const d = Math.hypot(x - px, y - py);
    if (d < best.d) best = { d, t: (k + f) / (pts.length - 1), sx: (x - px) * dy - (y - py) * dx < 0 ? -1 : 1 };
  }
  return best;
}

/** A tapered, shaded tube along pts (vines, the stem). */
function tube(c, pts, r0, r1, ramp, { stripes = 0, seed = 1 } = {}) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const pad = Math.max(r0, r1) + 1;
  for (let y = Math.floor(Math.min(...ys) - pad); y <= Math.ceil(Math.max(...ys) + pad); y++) {
    for (let x = Math.floor(Math.min(...xs) - pad); x <= Math.ceil(Math.max(...xs) + pad); x++) {
      const n = nearest(pts, x + 0.5, y + 0.5);
      const r = r0 + (r1 - r0) * n.t;
      if (n.d > r) continue;
      // Lit on the side facing the upper left.
      const across = (n.d / r) * n.sx;
      let light = 0.55 - across * 0.4 - n.t * 0.1;
      if (stripes && Math.abs(Math.sin(across * stripes + seed)) < 0.25) light -= 0.25;
      c.set(x, y, pick(ramp, light));
    }
  }
}

/** A small pointed leaf at (x, y), pointing along angle a. */
function leaf(c, x, y, a, len) {
  for (let yy = Math.floor(y - len); yy <= y + len; yy++) {
    for (let xx = Math.floor(x - len); xx <= x + len; xx++) {
      const dx = xx + 0.5 - x;
      const dy = yy + 0.5 - y;
      const along = dx * Math.cos(a) + dy * Math.sin(a);
      const side = -dx * Math.sin(a) + dy * Math.cos(a);
      if (along < 0 || along > len) continue;
      const w = Math.sin((along / len) * Math.PI) * len * 0.38;
      if (Math.abs(side) > w) continue;
      c.set(xx, yy, pick(VINE, side < 0 ? 0.75 : 0.35));
    }
  }
}

/** A dangling vine from (x, y), swaying with phase. */
function vine(c, x, y, len, phase, dir, seed) {
  const pts = [];
  for (let k = 0; k <= 10; k++) {
    const t = k / 10;
    pts.push([x + Math.sin(t * 4.2 + phase) * 4 * t + dir * t * len * 0.35 + Math.sin(t * 9 + seed) * 1.2 * t, y + t * len]);
  }
  // A curl at the end.
  const [ex, ey] = pts[pts.length - 1];
  for (let k = 1; k <= 6; k++) {
    const a = phase + dir * k * 0.9;
    pts.push([ex + dir * 2.4 * Math.sin(a) * (1 - k / 9), ey + 2.4 * (1 - Math.cos(a)) * (1 - k / 9)]);
  }
  tube(c, pts, 2.2, 0.6, VINE);
  const r = rng(seed);
  for (let k = 3; k < 9; k += 3) {
    const [lx, ly] = pts[k];
    leaf(c, lx, ly, Math.PI / 2 + dir * r.range(0.6, 1.2), r.range(5, 7));
  }
}

// Cracks spreading from the hole: jagged random walks with a few branches.
const CRACKS = (() => {
  const r = rng(61);
  const out = [];
  for (let k = 0; k < 7; k++) {
    const a = k * 0.9 + r.range(-0.3, 0.3) + (k % 2 ? Math.PI : 0);
    let [x, y] = [Math.cos(a) * 19, Math.sin(a) * 22];
    let dir = a;
    const path = new Set();
    for (let n = 0; n < 30; n++) {
      dir += r.range(-0.7, 0.7);
      dir = dir * 0.7 + a * 0.3;
      x += Math.cos(dir) * 1.2;
      y += Math.sin(dir) * 1.2;
      path.add(`${Math.round(x)},${Math.round(y)}`);
      if (n > 10 && r.chance(0.12)) {
        let [bx, by, bd] = [x, y, dir + r.pick([-1, 1]) * 0.9];
        for (let m = 0; m < 8; m++) {
          bd += r.range(-0.5, 0.5);
          bx += Math.cos(bd) * 1.2;
          by += Math.sin(bd) * 1.2;
          path.add(`${Math.round(bx)},${Math.round(by)}`);
        }
      }
    }
    out.push(path);
  }
  return out;
})();
const crackAt = (x, y, n) => CRACKS.slice(0, n).some((p) => p.has(`${x - 2},${y - 3}`));

/**
 * The pumpkin itself at (cx, cy): ribbed rind with a hole in its face.
 * Returns where the face goes and how to light the inside of the hole.
 */
function rind(c, cx, cy, rx, ry, o) {
  const hole = { x: cx + 2, y: cy + 3, rx: 17.8, ry: 21.8 };
  const cracks = o.cracks ?? 0;
  for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 1; y++) {
    for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const dx = (x + 0.5 - cx) / rx;
      // The top is pulled in around the stem.
      const dimple = 0.13 * Math.exp(-((dx / 0.22) ** 2));
      let dy = (y + 0.5 - cy) / ry;
      if (dy < 0) dy /= 1 - dimple;
      const r2 = dx * dx + dy * dy;
      if (r2 > 1) continue;
      // Sideways lobes, converging at the poles.
      const nz = Math.sqrt(1 - r2);
      const theta = Math.atan2(dx, nz);
      const seg = theta / (Math.PI / 6) + 0.5;
      const s = seg - Math.round(seg);
      const pole = Math.sqrt(Math.max(0, 1 - dy * dy));
      const tilt = s * 1.15 * pole;
      const nx = dx * Math.cos(tilt) + nz * Math.sin(tilt);
      const nzz = -dx * Math.sin(tilt) + nz * Math.cos(tilt);
      const [lx, ly, lz] = LIGHT;
      let light = 0.18 + 0.85 * Math.max(0, nx * lx + dy * ly + nzz * lz);
      // Creases between lobes, and shadow under the belly.
      if (Math.abs(s) > 0.42 && Math.abs(dy) < 0.93) light -= 0.22;
      light -= Math.max(0, dy - 0.3) * 0.35;
      // Glints along the lobe tops.
      const spec = Math.max(0, nx * lx + dy * ly + nzz * lz);
      let col = spec > 0.97 && hash2(x, y, 3) < 0.6 ? RIND[0] : pick(RIND, light);
      // The hole.
      const hx = (x + 0.5 - hole.x) / hole.rx;
      const hy = (y + 0.5 - hole.y) / hole.ry;
      const hd = Math.hypot(hx, hy);
      const ang = Math.atan2(hy, hx);
      // Facing the light where the rind turns into the hole.
      const lip = (-(hx * LIGHT[0] + hy * LIGHT[1]) / (hd || 1)) * 0.5 + 0.45;
      // A jagged knife cut: pale flesh on the cut wall, then the dark inside.
      const cut = 1 + 0.07 * Math.sin(ang * 5 + 1) + 0.05 * Math.sin(ang * 11 + 2) + 0.04 * (hash2(Math.round(ang * 9), 0, 6) - 0.5);
      if (hd < cut) col = null;
      else if (hd < cut + 0.13) col = pick(FLESH, lip + 0.1);
      // Cracks of light splitting the rind.
      if (cracks && col && crackAt(x - cx, y - cy, cracks)) col = GLOW[hash2(x, y, 4) < 0.5 ? 0 : 1];
      if (col) c.set(x, y, col);
    }
  }
  return hole;
}

/** Gus's face in the hole, with the dark inside of the pumpkin round it. */
function face(c, hole) {
  const fx = hole.x;
  const fy = hole.y + 0.5;
  const frx = 15.2;
  const fry = 19.6;
  for (let y = Math.floor(hole.y - hole.ry - 3); y <= hole.y + hole.ry + 3; y++) {
    for (let x = Math.floor(hole.x - hole.rx - 3); x <= hole.x + hole.rx + 3; x++) {
      // Only where the rind left the hole open.
      if (c.get(x, y)) continue;
      const hx = (x + 0.5 - hole.x) / hole.rx;
      const hy = (y + 0.5 - hole.y) / hole.ry;
      if (hx * hx + hy * hy > 1.6) continue;
      const ux = (x + 0.5 - fx) / frx;
      const uy = (y + 0.5 - fy) / fry;
      const f2 = ux * ux + uy * uy;
      if (f2 >= 1) {
        // The dark inside of the pumpkin, with strings of pulp hanging down.
        const d = Math.min(1, (Math.sqrt(f2) - 1) * 6);
        let col = POCKET[clamp(Math.round(1 + d * 2 - (hy > 0.5 ? 1 : 0)), 0, 3)];
        if (hy < 0 && Math.abs(Math.sin(x * 1.7)) > 0.93 && hash2(x, 0, 8) < 0.6) col = PULP[2];
        c.set(x, y, col);
        continue;
      }
      const nz = Math.sqrt(1 - f2);
      let light = 0.22 + 0.82 * Math.max(0, ux * UNDER[0] + uy * UNDER[1] + nz * UNDER[2]);
      // The rind overhangs his forehead and shades the edge of his face.
      light -= Math.max(0, -uy - 0.45) * 0.7;
      light -= Math.max(0, f2 - 0.8) * 0.8;
      // Blotchy, tired skin.
      const m = MOTTLE((x - fx) * 3, (y - fy) * 3);
      let shift = 0;
      if (m > 0.66 && ((x + y) & 1) === 0) shift = 1;
      if (m < 0.3 && ((x + y) & 1) === 0) shift = -1;
      // Stubble on the jaw and upper lip.
      if (uy > 0.3 && Math.abs(ux) < 0.85 && ((x + y) & 1) === 0 && hash2(x, y, 9) < 0.6) shift = 1 + (hash2(x, y, 10) < 0.3 ? 1 : 0);
      let col = pick(SKIN, light, shift);
      // Short brown hair, swept across, ragged at the fringe.
      const lx = x + 0.5 - (fx - frx);
      const ly = y + 0.5 - (fy - fry);
      const hairline = 4.6 + lx * 0.1 + (lx > 6 && lx < 22 ? Math.sin(lx * 1.3) * 0.8 : 0) + (hash2(x, 1, 12) - 0.5) * 1.6;
      if (ly < hairline) col = pick(HAIR, light * 0.6 + 0.3 - ly / 14, hash2(x, y, 13) < 0.25 ? 1 : 0);
      c.set(x, y, col);
    }
  }
  return [Math.round(fx - 13.5), Math.round(fy - fry)];
}

/**
 * One frame. o: { bob, sway, lean, cracks, eyes 'glare'|'burn'|'ouch'|'dead',
 * mouth, fire }
 */
function pumpkinFrame(o = {}) {
  const c = new PixelCanvas(128, 128);
  const cx = 64 + (o.lean ?? 0);
  const cy = 56 + (o.bob ?? 0);
  const rx = 45;
  const ry = 37;
  const sway = o.sway ?? 0;
  // Vines writhing underneath, behind the pumpkin.
  [[-24, 20, 1.2, -1], [-9, 26, 2.6, -1], [6, 24, 0.4, 1], [21, 19, 1.9, 1], [-1, 16, 3.3, 1]].forEach(([dx, len, ph, dir], k) => {
    vine(c, cx + dx, cy + ry * 0.78 - Math.abs(dx) * 0.2, len, ph + sway, dir, 31 + k);
  });
  const hole = rind(c, cx, cy, rx, ry, o);
  const [ox, oy] = face(c, hole);
  const at = (rows, x, y) => stamp(c, Array.isArray(rows) ? P(rows) : rows, ox + x, oy + y);
  const eyes = o.eyes ?? 'glare';
  const angry = eyes !== 'ouch' && eyes !== 'dead';
  at(FEAT.brows[angry ? 'evil' : 'ouch'], 0, angry ? 10 : 11);
  at(FEAT.glasses[eyes], 0, 14);
  at(FEAT.lines, 0, 20);
  at(FEAT.nose, 11, 20);
  const mouth = FEAT.mouth[o.mouth ?? 'smirk'];
  at(mouth, 8, mouth.length > 3 ? 26 : 28);
  // The stem: thick, twisted, leaning, with a curling tendril.
  const top = cy - ry * 0.87;
  tube(c, [[cx - 1, top + 5], [cx, top - 2], [cx + 2, top - 9], [cx + 6, top - 15], [cx + 10, top - 18]], 5.2, 2.6, STEM, { stripes: 2.2, seed: 1 });
  const curl = [];
  for (let k = 0; k <= 22; k++) {
    const a = k * 0.42;
    const rr = 7 - k * 0.26;
    curl.push([cx + 5 + k * 0.9 + Math.cos(a + sway * 0.5) * rr * 0.5, top - 2 + Math.sin(a + sway * 0.5) * rr * 0.6 - k * 0.15]);
  }
  tube(c, curl, 1.3, 0.6, VINE);
  leaf(c, cx - 4, top + 1, Math.PI + 0.5, 11);
  const out = paint(c, {
    blend: ['orange', 'rust', 'olive', 'toxic', 'skin'],
    crisp: ['gray', 'steel', 'beige', 'flesh', 'blood', 'glow-yellow', 'glow-red'],
    grain: 0.03,
    seed: 77,
  });
  if (o.fire) flash(out, hole.x, oy + 34, 10, G('yellow', 1), G('red', 0.7));
  return out;
}

// ------------------------------------------------------------------ death

/** The smashed remains: shards of rind, pulp, seeds, the stem and his glasses. */
function remains(level, { fire = 0, seed = 1 } = {}) {
  const c = new PixelCanvas(128, 128);
  const r = rng(90 + seed);
  const ground = 118;
  // Pulp splatter on the ground.
  for (let y = ground - 8; y < ground + 6; y++) {
    for (let x = 14; x < 114; x++) {
      const d = ((x - 64) / 50) ** 2 + ((y - ground) / 6) ** 2;
      if (d < 1 && hash2(x, y, 5) < 0.85 - d * 0.4) c.set(x, y, PULP[d < 0.4 ? 1 : 2]);
    }
  }
  // Shards of rind: curved arcs of shell lying every which way, orange
  // outside and pale flesh along the broken inner edge.
  const heap = Math.max(0, 3 - level);
  for (let k = 0; k < 12; k++) {
    const sx = r.int(22, 106);
    const sy = ground - r.int(0, 5) - (k < 4 ? heap * 3 : 0);
    const R = r.range(7, 13);
    const thick = r.range(2.6, 4);
    const mid = -Math.PI / 2 + r.range(-0.9, 0.9);
    const span = r.range(0.5, 1.1);
    const ox = sx - Math.cos(mid) * R;
    const oy = sy - Math.sin(mid) * R * 0.7;
    for (let y = Math.floor(oy - R - 2); y <= oy + R + 2; y++) {
      for (let x = Math.floor(ox - R - 2); x <= ox + R + 2; x++) {
        const dx = x + 0.5 - ox;
        const dy = (y + 0.5 - oy) / 0.7;
        const d = Math.hypot(dx, dy);
        let da = Math.atan2(dy, dx) - mid;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        if (d > R || d < R - thick || Math.abs(da) > span * (1 - 0.25 * hash2(Math.round(d), 0, k))) continue;
        const inner = d < R - thick + 1.1;
        const lit = 0.75 - Math.sin(da) * 0.25 - (dy > 0 ? 0.2 : 0);
        c.set(x, y, inner ? C('beige', 0.72) : pick(RIND, lit));
      }
    }
  }
  // Stringy pulp and seeds.
  for (let k = 0; k < 26; k++) {
    const x = r.int(16, 112);
    const y = ground - r.int(-4, 6);
    c.set(x, y, SEED[0]);
    c.set(x + 1, y, SEED[1]);
  }
  // The stem, toppled.
  tube(c, [[70, ground - 4], [78, ground - 6], [86, ground - 5]], 3.6, 2.2, STEM, { stripes: 2, seed: 2 });
  // His glasses, lying in the mess.
  stamp(c, P(['.KKKK.KKKK.', 'K.x.KKK.x.K', '.KKKK.KKKK.']), 40, ground - 4);
  const out = paint(c, { blend: ['orange', 'rust', 'olive', 'toxic'], crisp: ['gray', 'beige'], grain: 0.03, seed: 9 + seed });
  // Embers and a last wisp of glow.
  for (let k = 0; k < 9 - level * 2; k++) out.set(r.int(24, 104), ground - r.int(2, 20), GLOW[r.int(0, 2)]);
  if (fire) flash(out, r.int(48, 80), ground - 18, fire, G('yellow', 1), G('red', 0.7));
  return out;
}

/** Mid-burst: the pumpkin blown apart, shards flying out of a ball of light. */
function burst() {
  const c = new PixelCanvas(128, 128);
  const r = rng(51);
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 + r.range(-0.2, 0.2);
    const d = r.range(26, 50);
    const x = 64 + Math.cos(a) * d;
    const y = 60 + Math.sin(a) * d * 0.8;
    const s = r.range(3, 7);
    for (let yy = -s; yy <= s; yy++) {
      for (let xx = -s; xx <= s; xx++) {
        const u = xx * Math.cos(a) + yy * Math.sin(a);
        const v = -xx * Math.sin(a) + yy * Math.cos(a);
        if (Math.abs(u) > s * 0.5 || Math.abs(v) > s) continue;
        c.set(x + xx, y + yy, u < -s * 0.2 ? C('beige', 0.75) : pick(RIND, 0.7 - v / s * 0.3));
      }
    }
  }
  const out = paint(c, { blend: ['orange'], crisp: ['beige'], grain: 0.02, seed: 4 });
  flash(out, 64, 60, 34, G('yellow', 1), G('yellow', 0.5));
  flash(out, 50, 48, 16, G('yellow', 1), G('red', 0.7), 3);
  flash(out, 80, 72, 14, G('yellow', 1), G('red', 0.7), 5);
  return out;
}

export function pumpkinSheet() {
  return sheet([
    pumpkinFrame({ bob: 0, sway: 0 }),
    pumpkinFrame({ bob: -2, sway: 0.8 }),
    pumpkinFrame({ bob: -3, sway: 1.6, lean: 1 }),
    pumpkinFrame({ bob: -1, sway: 2.4 }),
    pumpkinFrame({ mouth: 'grin', eyes: 'burn', sway: 0.4 }),
    pumpkinFrame({ mouth: 'roar', eyes: 'burn', fire: true, bob: -2, sway: 1 }),
    pumpkinFrame({ mouth: 'grin', sway: 1.6 }),
    pumpkinFrame({ mouth: 'ouch', eyes: 'ouch', lean: -3, bob: 2, sway: 3 }),
    pumpkinFrame({ mouth: 'roar', eyes: 'dead', cracks: 4, sway: 3.6 }),
    (() => {
      const f = pumpkinFrame({ mouth: 'roar', eyes: 'dead', cracks: 7, bob: 3, sway: 4.4 });
      flash(f, 40, 40, 12, G('yellow', 1), G('yellow', 0.4), 2);
      flash(f, 92, 66, 10, G('yellow', 1), G('red', 0.7), 4);
      return f;
    })(),
    burst(),
    remains(0, { fire: 16, seed: 1 }),
    remains(1, { fire: 9, seed: 1 }),
    remains(2, { seed: 1 }),
    remains(3, { seed: 1 }),
    remains(4, { seed: 1 }),
  ]);
}

/** The floating pumpkin on its own, for the title screen's sky. */
export const pumpkinPortrait = (o = {}) => pumpkinFrame(o);

export default [{ name: 'pumpkin-king', out: 'assets/sprites/monsters/pumpkin-king.png', draw: pumpkinSheet }];
