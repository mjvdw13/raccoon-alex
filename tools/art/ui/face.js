// Alex's status-bar face (Doom "mugshot" layout) and the big title portrait,
// hand-drawn from his photo (assets/custom/alex-photo.png): a round, tired
// face, heavy brows, deep-set eyes with dark bags, a broad nose, a thin
// moustache and a downturned mouth, in a white shirt and a loosened red tie.
//
// The head itself is laid out by a few shape rules (an oval lit from the
// upper left, ears, neck, collar and tie, hair with a fringe), and every
// feature is a small hand-drawn grid on top: eyes, brows, nose, mouth, bags,
// the raccoon mask, bruises and blood. paint() then softens the shading.
//
// Sheet layout (24x30 frames): five rows of health tiers (healthy -> wrecked),
// each with 8 frames: [look ahead, look left, look right, turn right, turn left,
// ouch, evil grin, rampage]; then a final row: [well rested (god mode), dead].
import { PixelCanvas } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { part, stamp, paint } from '../lib/pixels.js';

export const FACE_W = 24;
export const FACE_H = 30;

const SKIN = [0.88, 0.79, 0.7, 0.61, 0.52, 0.43].map((t) => C('skin', t));
const HAIR = [0.26, 0.18, 0.12, 0.07].map((t) => C('rust', t));
const SHIRT = [0.97, 0.88, 0.76, 0.62].map((t) => C('beige', t));
const TIE = [C('blood', 0.55), C('blood', 0.42), C('blood', 0.3)];

const L = {
  V: C('flesh', 0.28), // lids, creases, mouth line
  e: C('beige', 0.9), // eye whites
  E: C('flesh', 0.74), // bloodshot
  p: C('rust', 0.1), // pupils
  P: C('blood', 0.45), // rampage pupils
  g: C('skin', 0.46), // bags
  G: C('rust', 0.3),
  h: C('concrete', 0.1), // brows
  k: C('gray', 0.07), // raccoon mask
  f: C('gray', 0.8), // pale fur above the mask
  w: C('beige', 0.95), // teeth
  r: C('blood', 0.15), // open mouth
  B: C('rust', 0.3), // moustache
  l: C('blood', 0.5), // blood
  v: C('purple', 0.4), // bruise
  y: G('yellow', 1), // god-mode glow
  Y: G('yellow', 0.4),
  d: C('rust', 0.07), // hair
  D: C('rust', 0.18),
  S: SKIN[0],
  s: SKIN[1],
  t: SKIN[2],
  u: SKIN[3],
  U: SKIN[4],
};
const P = (rows) => part(rows, L);

// ------------------------------------------------------------------ head

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const LIGHT = (() => {
  const l = [-0.45, -0.5, 0.74];
  const n = Math.hypot(...l);
  return l.map((v) => v / n);
})();
/** Light on an ellipsoid at (u, v): 0 (dark) .. 1 (lit), or -1 outside. */
function lit(u, v, cx, cy, rx, ry) {
  const nx = (u - cx) / rx;
  const ny = (v - cy) / ry;
  const r2 = nx * nx + ny * ny;
  if (r2 > 1) return -1;
  const nz = Math.sqrt(1 - r2);
  return clamp(0.3 + 0.75 * (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]), 0, 1);
}
const pick = (ramp, light, shift = 0) => ramp[clamp(Math.round((1 - light) * (ramp.length - 1)) + shift, 0, ramp.length - 1)];
const hash = (x, y) => {
  const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return h - Math.floor(h);
};

/**
 * The bare head at scale k (1 = 24x30, 1.5 = 36x45), laid out in 24x30 units:
 * shoulders and collar, neck, ears, the face oval, stubble, hair.
 */
function head(k, { turn = 0, tier = 0, pale = false } = {}) {
  const w = Math.round(FACE_W * k);
  const h = Math.round(FACE_H * k);
  const c = new PixelCanvas(w, h);
  const cx = 12 + turn * 0.5;
  const skin = pale ? SKIN.map((col) => [...col].map((v, i) => (i === 2 ? v + 6 : v - 8))) : SKIN;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / k;
      const v = (y + 0.5) / k;
      const du = Math.abs(u - 12);
      let col = null;
      // Shirt: shoulders sloping out, a V at the collar with the tie in it.
      if (v > 24.6 + du * 0.18) {
        const tie = v > 26 && du < 0.9 + (v - 26) * 0.3;
        const open = du < (v - 24.2) * 0.75;
        if (tie) col = TIE[u < 12 ? 0 : v > 28.5 ? 2 : 1];
        else if (open) col = skin[4];
        else col = SHIRT[clamp(Math.floor((u + (v - 25) * 1.5) / 7), 0, 3)];
      }
      // Neck, in the shadow of his jaw.
      if (!col && du < 3.4 && v > 19 && v < 27) col = skin[v < 23 ? 5 : u < 12 ? 3 : 4];
      // Ears.
      for (const ex of [3.8 + turn * 0.7, 20.2 + turn * 0.7]) {
        const e = lit(u, v, ex, 14.6, 1.5, 2.5);
        if (e >= 0) col = pick(skin, e, 1);
      }
      // The face: a full, round oval that narrows a little to the jaw.
      const taper = v > 15 ? 1 - 0.28 * ((v - 15) / 8.8) ** 2 : 1;
      const f = lit(u, v, cx, 13.6, 8 * taper, 10.3);
      if (f >= 0) {
        col = pick(skin, f);
        // Stubble on his jaw and upper lip: a darker grain, worse each tier.
        const jaw = v > 18.6 && Math.abs(u - cx) < 7 && !(Math.abs(u - cx) < 2.4 && v < 20);
        if (jaw && ((x + y) & 1) === 0 && hash(x, y) < 0.45 + tier * 0.1) col = pick(skin, f, 1);
      }
      // Hair: a cap down to the brow, sideburns, a fringe of strands.
      // Short and messy: the hairline recedes at the temples, comes down
      // to just above his ears at the sides, and a few strands fall forward.
      const hl = lit(u, v, cx, 12.2, 8.8, 10.9);
      const side = Math.abs(u - cx);
      const hairline = side > 6.4 ? 11.2 : 7.6 + (side > 3.2 ? 0.5 : 0) - 0.4 * Math.cos(u * 2.1);
      const fringe = v < 9.6 && [8.2, 11.3, 14.6].some((s) => Math.abs(u - (s + turn * 0.5)) < 0.45 + 0.3 / k);
      if (hl >= 0 && (v < hairline || fringe)) col = pick(HAIR, hl);
      if (col) c.set(x, y, col);
    }
  }
  return c;
}

// ------------------------------------------------------------------ features
// Feature grids for the 24x30 face (positions are the grid's top-left).

const SMALL = {
  tufts: P([
    '.......d..D..d.d........',
    '......dd.dDddddd.d......',
    '.....ddddDDdddddddd.....',
  ]),
  wild: P([
    '...d..........D....d....',
    '....d...d...........d...',
  ]),
  // Eyes: a heavy lid over a sliver of white. Pupil left / centre / right.
  eye: {
    L: { '-1': ['VVVV', 'Vpee'], 0: ['VVVV', 'Vepe'], 1: ['VVVV', 'Veep'] },
    R: { '-1': ['VVVV', 'peeV'], 0: ['VVVV', 'epeV'], 1: ['VVVV', 'eepV'] },
  },
  eyeOuch: { L: ['.VV.', 'Vepe', '.VV.'], R: ['.VV.', 'epeV', '.VV.'] },
  eyeGod: { L: ['.VV.', 'VyYy'], R: ['.VV.', 'yYyV'] },
  eyeShut: ['....', 'VVVV'],
  // Bags under the eyes, growing each tier.
  bags: [['ugGu'], ['gGGg'], ['gGGg', 'uggu'], ['gGGg', 'uggu'], ['GGGG', 'gGGg']],
  // The raccoon mask (tiers 3-4): pale fur, then a black band over both eyes.
  mask: [
    P(['....ffffffffffffffff....', '...kkkkkkkkkkkkkkkkkk...', '...kkkkkkkkkkkkkkkkkk...', '....kkkkkkkk.kkkkkkk....', '.....kkkk......kkkk.....']),
    P(['...fffffffffffffffffff..', '..kkkkkkkkkkkkkkkkkkkk..', '..kkkkkkkkkkkkkkkkkkkk..', '..kkkkkkkkkkkkkkkkkkkk..', '...kkkkkkk....kkkkkkk...', '....kkkk........kkkk....']),
  ],
  brows: {
    tired: { L: ['..hhh', 'hh...'], R: ['hhh..', '...hh'] },
    worried: { L: ['...hh', 'hhh..'], R: ['hh...', '..hhh'] },
    angry: { L: ['hhh..', '...hh'], R: ['..hhh', 'hh...'] },
    raised: { L: ['.hhh.', 'h...h'], R: ['.hhh.', 'h...h'] },
  },
  nose: P(['.St', '.St', '.Su', 'SsU', 'uVu']),
  moustache: P(['BBBBBB']),
  mouth: {
    neutral: ['uVVVVu', 'V....V'],
    ouch: ['.VrrV.', '.VrrV.'],
    grin: ['VwwwwV', '.VVVV.'],
    god: ['VwwwyV', '.VVVV.'],
    rampage: ['wVwVwV', 'VVVVVV'],
    dead: ['.VrrV.', '.rrrr.'],
  },
  bruise: P(['vv', 'vv']),
  zz: P(['yyy', '.y.', 'yyy']),
};

/** One status-bar frame. o: { tier 0..4, look -1|0|1, turn -1|0|1, expr }. */
export function faceFrame(o = {}) {
  const tier = o.tier ?? 0;
  const turn = o.turn ?? 0;
  const look = o.look ?? 0;
  const expr = o.expr ?? 'neutral';
  const god = expr === 'god';
  const dead = expr === 'dead';
  const hurt = !god;
  const masked = tier >= 3 && !god && !dead;
  const c = head(1, { turn, tier, pale: dead });
  const at = (p, x, y) => stamp(c, p, x + turn, y);
  at(SMALL.tufts, 0, 0);
  if (tier >= 2 && !god) at(SMALL.wild, 0, 0);

  // Eyes, bags and the mask.
  if (!god && !dead) SMALL.bags[tier].forEach((row, j) => [6, 14].forEach((x) => at(P([row]), x, 14 + j)));
  if (masked) at(SMALL.mask[tier - 3], 0, tier === 3 ? 10 : 9);
  const eyeL = dead ? SMALL.eyeShut : god ? SMALL.eyeGod.L : expr === 'ouch' ? SMALL.eyeOuch.L : SMALL.eye.L[look + turn > 0 ? 1 : look + turn < 0 ? -1 : 0];
  const eyeR = dead ? SMALL.eyeShut : god ? SMALL.eyeGod.R : expr === 'ouch' ? SMALL.eyeOuch.R : SMALL.eye.R[look + turn > 0 ? 1 : look + turn < 0 ? -1 : 0];
  const recolour = (rows) => rows.map((r) => (expr === 'rampage' ? r.replace(/p/g, 'P') : r));
  const bloodshot = (rows, side) => (tier >= 1 && !god && !dead ? rows.map((r, j) => (j === rows.length - 1 ? (side < 0 ? r.replace(/e$/, 'E') : r.replace(/^e/, 'E')) : r)) : rows);
  const ey = expr === 'ouch' ? 11 : 12;
  at(P(bloodshot(recolour(eyeL), -1)), 6, ey);
  at(P(bloodshot(recolour(eyeR), 1)), 14, ey);

  // Brows.
  const brow = god ? 'raised' : expr === 'ouch' ? 'worried' : expr === 'grin' || expr === 'rampage' ? 'angry' : 'tired';
  const by = god || expr === 'ouch' ? 9 : 10;
  at(P(SMALL.brows[brow].L), 5, by - (masked ? 1 : 0));
  at(P(SMALL.brows[brow].R), 14, by - (masked ? 1 : 0));

  // Nose, moustache, mouth.
  at(SMALL.nose, 11, 14);
  at(SMALL.moustache, 9, 19);
  at(P(SMALL.mouth[dead ? 'dead' : expr in SMALL.mouth ? expr : 'neutral']), 9, 20);

  // Damage: a bruise, then blood from the forehead and the lip.
  if (hurt && tier >= 2) at(SMALL.bruise, 16, 16);
  if (hurt && tier >= 3) {
    at(P(['l..', 'l..', '.l.', '.l.', '.l.', '..l']), 15, 4);
    at(P(['l', 'l']), 8, 21);
  }
  if (hurt && tier >= 4) {
    at(P(['l.', 'l.', 'l.', 'l.', '.l']), 8, 3);
    at(P(['l', 'l']), 14, 22);
  }
  if (dead) stamp(c, SMALL.zz, 19, 1);
  return paint(c, {
    blend: ['skin', 'rust', 'beige', 'blood'],
    crisp: ['gray', 'concrete', 'purple', 'flesh', 'glow-yellow'],
    grain: 0.02,
    seed: 401 + tier,
  });
}

export function faceSheet() {
  const sheet = new PixelCanvas(FACE_W * 8, FACE_H * 6);
  const frames = [{ look: 0 }, { look: -1 }, { look: 1 }, { turn: 1, look: 1 }, { turn: -1, look: -1 }, { expr: 'ouch' }, { expr: 'grin' }, { expr: 'rampage' }];
  for (let tier = 0; tier < 5; tier++) {
    frames.forEach((f, i) => sheet.blit(faceFrame({ tier, ...f }), i * FACE_W, tier * FACE_H));
  }
  sheet.blit(faceFrame({ tier: 0, expr: 'god' }), 0, 5 * FACE_H);
  sheet.blit(faceFrame({ tier: 2, expr: 'dead' }), FACE_W, 5 * FACE_H);
  return sheet;
}

// ------------------------------------------------------------------ portrait
// The title screen's ID-badge portrait: the same face at 36x45 with more
// detail (two-tier bags, bloodshot eyes), drawn at 2x to fill 72x90.

const BIG = {
  tufts: P([
    '...........d....D...d...d...........',
    '.........d.dd..dDd.dd..dd.d.........',
    '........dddddDdDDdddddddddddd.......',
    '.......dddddDDDdDdddddddddddd.......',
  ]),
  eyeL: ['VVVVVV', 'VeEppe', 'uVVVVu'],
  eyeR: ['VVVVVV', 'eppEeV', 'uVVVVu'],
  bags: ['ugGGgu', '.gggg.', '..VV..'],
  browL: ['..hhhhhh', 'hhh.....'],
  browR: ['hhhhhh..', '.....hhh'],
  nose: P(['.St..', '.St..', '.Stu.', '.Stu.', 'SsStu', 'sSstU', 'uVsVu']),
  moustache: P(['BBBBBBBBB']),
  mouth: P(['uVVVVVVVu', 'V.......V']),
};

export function alexPortrait() {
  const c = head(1.5, { tier: 1 });
  stamp(c, BIG.tufts, 0, 0);
  for (const [x, eye] of [[9, BIG.eyeL], [21, BIG.eyeR]]) {
    stamp(c, P(BIG.bags), x, 21);
    stamp(c, P(eye), x, 18);
  }
  stamp(c, P(BIG.browL), 7, 15);
  stamp(c, P(BIG.browR), 21, 15);
  stamp(c, BIG.nose, 15, 20);
  stamp(c, BIG.moustache, 13, 28);
  stamp(c, BIG.mouth, 13, 29);
  const small = paint(c, {
    blend: ['skin', 'rust', 'beige', 'blood'],
    crisp: ['gray', 'concrete', 'purple', 'flesh'],
    grain: 0.02,
    seed: 4242,
  });
  return small.scale(2);
}

export default [{ name: 'face', out: 'assets/ui/face.png', draw: faceSheet }];
