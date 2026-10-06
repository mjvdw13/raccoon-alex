// Alex's status-bar face (Doom "mugshot" layout) and the big title portrait,
// hand-drawn pixel art (no photo of him is kept in the repo): a round, tired
// face, heavy brows, deep-set eyes with dark bags, a broad nose, a thin
// moustache and a downturned mouth, peeking out of a fuzzy head-to-toe
// raccoon costume: a hood with round ears and a pale fluffy trim, a grey fur
// suit with a pale belly, and a ringed tail curling up behind his shoulder.
//
// The head and costume are laid out by a few shape rules (ovals lit from the
// upper left), and every feature is a small hand-drawn grid on top: eyes,
// brows, nose, mouth, bags, the raccoon mask, bruises and blood. The costume
// is then laid back over the face so features stay inside the hood's
// opening, and paint() softens the shading.
//
// Sheet layout (24x30 frames): five rows of health tiers (healthy -> wrecked),
// each with 8 frames: [look ahead, look left, look right, turn right, turn left,
// ouch, evil grin, rampage]; then a final row: [well rested (god mode), dead].
import { PixelCanvas } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { part, stamp, paint } from '../lib/pixels.js';

export const FACE_W = 24;
export const FACE_H = 30;

// Pale, slightly pink skin: light to shadow.
const SKIN = [1, 0.94, 0.88, 0.81, 0.73, 0.64].map((t) => C('skin', t));
// Dead and grey.
const PALE = [0.95, 0.88, 0.8, 0.72, 0.64, 0.56].map((t) => C('beige', t));
const HAIR = [C('rust', 0.16), C('rust', 0.11), C('rust', 0.07), C('gray', 0.05)];
// The costume: warm grey fur, a pale trim and belly, near-black tail rings.
const FUR = [0.62, 0.52, 0.44, 0.36, 0.28, 0.2].map((t) => C('concrete', t));
const TRIM = [0.97, 0.9, 0.82, 0.72].map((t) => C('beige', t));
const RING = [C('gray', 0.16), C('gray', 0.1)];
const BAND = [C('concrete', 0.8), C('concrete', 0.66)];

const L = {
  V: C('skin', 0.42), // lids, creases, mouth line
  e: C('beige', 0.84), // eye whites
  E: C('flesh', 0.8), // bloodshot
  p: C('olive', 0.3), // hazel-green eyes
  n: C('skin', 0.55), // nostrils
  q: C('skin', 0.7), // lower lip
  P: C('blood', 0.45), // rampage pupils
  g: C('skin', 0.68), // dark circles and bags
  G: C('skin', 0.56),
  h: C('gray', 0.11), // thick dark brows
  k: C('gray', 0.07), // raccoon mask
  f: C('gray', 0.8), // pale fur above the mask
  w: C('beige', 0.95), // teeth
  r: C('blood', 0.15), // open mouth
  B: C('gray', 0.14), // thin dark moustache
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

// The tail: a cubic curve round his side and up past his right shoulder.
const TAIL = [[24.6, 31.5], [16.2, 28.8], [17, 20.4], [21.8, 17.2]];
const TAIL_PTS = Array.from({ length: 48 }, (_, i) => {
  const t = i / 47;
  const b = [(1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3];
  return [b.reduce((s, w, j) => s + w * TAIL[j][0], 0), b.reduce((s, w, j) => s + w * TAIL[j][1], 0), t];
});

/** The point of the tail nearest its tip covering (u, v), or null. */
function tailAt(u, v, fuzz) {
  let best = null;
  for (const [px, py, t] of TAIL_PTS) {
    if (Math.hypot(u - px, v - py) < 3 - t * 1.3 + fuzz && (!best || t > best.t)) best = { t, side: u - px };
  }
  return best;
}

/** Is (u, v) inside the ellipse? Returns its normalised radius squared. */
const r2 = (u, v, cx, cy, rx, ry) => ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2;

/**
 * Alex in his costume at scale k (1 = 24x30, 1.5 = 36x45), laid out in 24x30
 * units. Returns [frame, suit]: the whole frame, and just the costume (hood,
 * trim, ears, suit, tail) to lay back over the features once they're drawn.
 */
function head(k, { turn = 0, tier = 0, pale = false } = {}) {
  const w = Math.round(FACE_W * k);
  const h = Math.round(FACE_H * k);
  const c = new PixelCanvas(w, h);
  const suit = new PixelCanvas(w, h);
  const cx = 12 + turn * 0.5;
  const skin = pale ? PALE : SKIN;
  // The hood's face opening, and the fluffy trim around it.
  const hole = [cx, 15, 8.7, 10.5];
  const trim = [cx, 14.9, 9.7, 11.5];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / k;
      const v = (y + 0.5) / k;
      const du = Math.abs(u - cx);
      const fuzz = (hash(x, y) - 0.5) * 0.1;
      let col = null;
      let costume = true;
      // Ears: pointed ovals leaning out, pale rims round a dark inside.
      const earAt = (ex) => [u - ex - (v - 4) * 0.3 * Math.sign(ex - cx), v];
      const ear = [cx - 7.3 + turn * 0.2, cx + 7.3 + turn * 0.2].find((ex) => {
        const [eu, ev] = earAt(ex);
        return r2(eu * (1 + Math.max(0, 4 - ev) * 0.16), ev, 0, 4, 2.9, 3.9) < 1 + fuzz;
      });
      // The hood hugs his jaw, narrowing below the cheeks.
      const hoodW = 11.4 * (v > 13.6 ? 1 - 0.35 * ((v - 13.6) / 12.6) ** 2 : 1);
      const tail = tailAt(u, v, fuzz);
      if (ear !== undefined) {
        const [eu, ev] = earAt(ear);
        const inner = r2(eu * (1 + Math.max(0, 4.6 - ev) * 0.2), ev, 0, 4.6, 1.6, 2.6) < 1;
        col = inner ? FUR[ev < 3.5 ? 4 : 5] : pick(TRIM, lit(eu, ev, 0, 4, 2.9, 3.9) * 0.6 + 0.3);
      } else if (r2(u, v, ...hole) < 1) {
        // The face, through the hood's opening.
        costume = false;
        const taper = v > 16 ? 1 - 0.16 * ((v - 16) / 8) ** 2 : 1;
        const f = lit(u, v, cx, 13.8, 8.6 * taper, 10.4);
        if (f >= 0) {
          col = pick(skin, f);
          // Stubble on his jaw and upper lip: a darker grain, worse each tier.
          const jaw = v > 18.6 && du < 7 && !(du < 2.4 && v < 20);
          if (jaw && ((x + y) & 1) === 0 && hash(x, y) < 0.45 + tier * 0.1) col = pick(skin, f, 1);
          // Dark hair peeking out under the hood, a few strands falling forward.
          const fringe = k > 1 && v < 9.2 && [9.4, 12.6, 15.2].some((s) => Math.abs(u - (s + turn * 0.5)) < 0.45 + 0.3 / k);
          if (v < 7.3 - 0.5 * Math.cos(u * 2.1) || fringe) col = pick(HAIR, f);
        } else {
          // His neck, then the shadowed inside of the hood.
          col = du < 3.4 && v > 19 ? skin[5] : FUR[5];
        }
      } else if (r2(u, v, ...trim) < 1 + fuzz) {
        col = pick(TRIM, lit(u, v, cx, 13.6, 11, 12.6) * 0.8 + 0.25);
      } else if (r2(u, v, cx, 13.6, hoodW, 12.6) < 1) {
        col = pick(FUR, lit(u, v, cx, 13.6, hoodW, 12.6));
      } else if (tail) {
        // The tail, curling round his side and up past his shoulder: dark
        // rings and a dark tip.
        const ring = tail.t > 0.86 || Math.floor(tail.t * 8) % 2 === 1;
        col = (ring ? RING : BAND)[tail.side < 0 ? 0 : 1];
      } else if (v > 24.4 + du * 0.2) {
        // The suit: sloping furry shoulders and a pale belly.
        const belly = du < 3.4 - (v - 26) * 0.2;
        col = belly ? TRIM[u < cx ? 1 : 2] : FUR[clamp(Math.floor((u + (v - 25) * 1.5) / 6), 0, 4)];
      }
      if (col) {
        c.set(x, y, col);
        if (costume) suit.set(x, y, col);
      }
    }
  }
  return [c, suit];
}

// ------------------------------------------------------------------ features
// Feature grids for the 24x30 face (positions are the grid's top-left).

const SMALL = {
  // Messy strands escaping the hood onto his forehead.
  wild: P([
    '.......d....D..d........',
    '........d...D...........',
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
  bags: [['.gg.'], ['gggg'], ['gGGg', '.gg.'], ['gGGg', '.gg.'], ['GGGG', 'gGGg']],
  // The raccoon mask (tiers 3-4): pale fur, then a black band over both eyes.
  mask: [
    P(['....ffffffffffffffff....', '...kkkkkkkkkkkkkkkkkk...', '...kkkkkkkkkkkkkkkkkk...', '....kkkkkkkk.kkkkkkk....', '.....kkkk......kkkk.....']),
    P(['...fffffffffffffffffff..', '..kkkkkkkkkkkkkkkkkkkk..', '..kkkkkkkkkkkkkkkkkkkk..', '..kkkkkkkkkkkkkkkkkkkk..', '...kkkkkkk....kkkkkkk...', '....kkkk........kkkk....']),
  ],
  // Thick, dark, low brows, pulled into a frown at the middle.
  brows: {
    tired: { L: ['hhh..', 'hhhhh'], R: ['..hhh', 'hhhhh'] },
    worried: { L: ['..hhh', 'hhhh.'], R: ['hhh..', '.hhhh'] },
    angry: { L: ['hh...', 'hhhhh'], R: ['...hh', 'hhhhh'] },
    raised: { L: ['.hhhh', 'hh...'], R: ['hhhh.', '...hh'] },
  },
  // A long, broad nose with a round tip.
  nose: P(['.St.', '.St.', '.Stu', 'sSSu', 'SSsu', 'nUun']),
  moustache: P(['BBBBBB']),
  mouth: {
    neutral: ['VVVVVV', '.qqqq.'],
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
  const [c, suit] = head(1, { turn, tier, pale: dead });
  const at = (p, x, y) => stamp(c, p, x + turn, y);
  if (tier >= 2 && !god) at(SMALL.wild, 0, 6);

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
  at(SMALL.nose, 10, 13);
  at(SMALL.moustache, 9, 19);
  at(P(SMALL.mouth[dead ? 'dead' : expr in SMALL.mouth ? expr : 'neutral']), 9, 21);

  // Damage: a bruise, then blood from the forehead and the lip.
  if (hurt && tier >= 2) at(SMALL.bruise, 16, 16);
  if (hurt && tier >= 3) {
    at(P(['l..', 'l..', '.l.', '.l.', '..l']), 14, 5);
    at(P(['l', 'l']), 8, 22);
  }
  if (hurt && tier >= 4) {
    at(P(['l.', 'l.', 'l.', '.l']), 9, 5);
    at(P(['l', 'l']), 14, 22);
  }
  c.blit(suit, 0, 0);
  if (dead) stamp(c, SMALL.zz, 19, 1);
  return paint(c, {
    blend: ['skin', 'rust', 'beige', 'blood', 'concrete'],
    crisp: ['gray', 'purple', 'flesh', 'glow-yellow'],
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
  eyeL: ['VVVVVV', 'VeppeE', '.uuuu.'],
  eyeR: ['VVVVVV', 'EeppeV', '.uuuu.'],
  bags: ['gggggg', '.gGGg.', '..gg..'],
  browL: ['hhhhh...', 'hhhhhhhh', '.hhhhhhh'],
  browR: ['...hhhhh', 'hhhhhhhh', 'hhhhhhh.'],
  nose: P(['..St..', '..St..', '..Stu.', '..Stu.', '.sStu.', '.SSstu', 'sSSstu', 'uSSsuU', 'nUuuUn']),
  moustache: P(['BBBBBBBBBBBB']),
  mouth: P(['.VVVVVVVV.', 'V.uuuuuu.V']),
};

export function alexPortrait() {
  const [c, suit] = head(1.5, { tier: 1 });
  for (const [x, eye] of [[9, BIG.eyeL], [21, BIG.eyeR]]) {
    stamp(c, P(BIG.bags), x, 21);
    stamp(c, P(eye), x, 18);
  }
  stamp(c, P(BIG.browL), 7, 15);
  stamp(c, P(BIG.browR), 21, 15);
  stamp(c, BIG.nose, 15, 19);
  stamp(c, BIG.moustache, 12, 29);
  stamp(c, BIG.mouth, 13, 31);
  c.blit(suit, 0, 0);
  const small = paint(c, {
    blend: ['skin', 'rust', 'beige', 'blood', 'concrete'],
    crisp: ['gray', 'purple', 'flesh'],
    grain: 0.02,
    seed: 4242,
  });
  return small.scale(2);
}

export default [{ name: 'face', out: 'assets/ui/face.png', draw: faceSheet }];
