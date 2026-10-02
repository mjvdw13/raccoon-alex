// First-person weapon sprites ("psprites"), modelled and lit like the monsters.
// Drawn at screen resolution and anchored bottom-centre. Frame layouts match
// src/content/weapons/*.js.
import { darken, lighten, mix } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { Model, MAT } from '../lib/model.js';
import { sheet, flash } from '../lib/sprite.js';
import { hash2 } from '../lib/noise.js';
import { tinyText } from '../lib/tex.js';

const W = (name) => `assets/sprites/weapons/${name}.png`;
const SKIN = C('skin', 0.62);
const SLEEVE = C('beige', 0.82);
const RENDER = { light: [-0.55, -0.7, 0.5], ambient: 0.32, aoStrength: 0.55, bounce: 0.05 };

/** Forearm in a rolled-up white sleeve, entering from off-screen. Returns the wrist point. */
function forearm(m, from, to, r = 8) {
  m.capsule(...from, ...to, r, r * 0.78, SKIN, MAT.skin);
  const t = 0.22;
  const cuff = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t];
  m.capsule(...from, ...cuff, r + 2.2, r + 1.8, SLEEVE, MAT.cloth);
  return to;
}

/** A gripping hand: palm plus four curled fingers wrapping toward `dir` (1 = right). */
function fist(m, x, y, z, r = 7, dir = 1) {
  m.ellipsoid(x, y, z, r, r * 0.85, r * 0.8, SKIN, MAT.skin);
  for (let k = 0; k < 4; k++) {
    const fy = y - r * 0.55 + k * r * 0.38;
    m.capsule(x - dir * r * 0.1, fy, z + r * 0.5, x - dir * r * 0.75, fy + r * 0.12, z + r * 0.75, r * 0.24, r * 0.2, darken(SKIN, 0.04), MAT.skin);
  }
  m.capsule(x + dir * r * 0.3, y - r * 0.6, z + r * 0.4, x - dir * r * 0.25, y - r * 0.95, z + r * 0.85, r * 0.26, r * 0.22, SKIN, MAT.skin); // thumb
}

function render(m) {
  return m.render(RENDER);
}

// ------------------------------------------------------------------ paws

function paw(m, x, y, flip, spread = 0) {
  const s = flip ? -1 : 1;
  const fur = C('gray', 0.4);
  m.capsule(x + s * 22, y + 46, 18, x, y + 6, 6, 12, 9, fur, MAT.fur);
  for (let k = 0; k < 4; k++) {
    const t = 0.25 + k * 0.17;
    const rx = x + s * 22 * (1 - t);
    const ry = y + 6 + 40 * t;
    m.paint(rx, ry, 11, 1.6, C('gray', 0.14)); // raccoon rings
  }
  m.ellipsoid(x, y + 3, 8, 9, 7, 6, C('gray', 0.14), MAT.skin);
  for (let f = -2; f <= 2; f++) {
    const fx = x + f * 4.3 + s * spread * f;
    const tip = y - 9 - (2 - Math.abs(f)) * 2.2;
    m.capsule(x + f * 3, y, 10, fx, tip, 12, 2.1, 1.5, C('gray', 0.12), MAT.skin);
    m.capsule(fx, tip, 12, fx + f * 0.3, tip - 2.6, 13, 0.9, 0.3, C('beige', 0.75), MAT.bone);
  }
}

function pawsFrame(right = [116, 50], left = [42, 56], { swipe = false, spread = 0 } = {}) {
  const m = new Model(160, 80, { seed: 101 });
  paw(m, left[0], left[1], true);
  paw(m, right[0], right[1], false, spread);
  const c = render(m);
  if (swipe) {
    for (let k = 0; k < 4; k++) {
      c.line(118 - k * 2, 18 + k * 6, 52, 30 + k * 7, G('tube', 1));
      c.line(116 - k * 2, 19 + k * 6, 56, 31 + k * 7, C('gray', 0.65));
    }
  }
  return c;
}

function pawsSheet() {
  return sheet([pawsFrame(), pawsFrame([132, 38], undefined, { spread: 0.6 }), pawsFrame([80, 34], undefined, { swipe: true, spread: 0.8 }), pawsFrame([100, 46])]);
}

// ------------------------------------------------------------------ staple gun

function stapleGunFrame({ y: oy = 12, fire = false, squeeze = 0 } = {}) {
  const m = new Model(96, 88, { seed: 103 });
  // Modelled in profile (nose at x = 0, lever on top at negative y), then
  // turned so the nose points up at the crosshair: a three-quarter view.
  const th = (68 * Math.PI) / 180;
  const [ox, oy0] = [41, 4 + oy];
  const T = (x, y) => [ox + x * Math.cos(th) - y * Math.sin(th), oy0 + x * Math.sin(th) + y * Math.cos(th)];
  const poly = (pts) => pts.map(([x, y]) => T(x, y));
  const paint = mix(C('orange', 0.5), C('rust', 0.5), 0.3);
  const body = { ...MAT.metal, spec: 0.35, shine: 18, grain: 0.06 };
  // Body (the magazine) with a chrome nose plate and the staple slot.
  m.slab(poly([[2, 0], [62, 0], [64, 3], [64, 15], [6, 15], [2, 11]]), 12, paint, body, { bevel: 3, thickness: 3 });
  m.slab(poly([[0, -1], [9, -1], [9, 16], [3, 16], [0, 12]]), 14, C('steel', 0.68), MAT.metal, { bevel: 1.5, thickness: 1.5 });
  m.paint(...T(3, 13.5), 2.2, 2.2, C('gray', 0.02));
  // A worn maker's label and a dent.
  m.paintPoly(poly([[22, 4], [44, 4], [44, 11], [22, 11]]), C('beige', 0.7));
  m.paintPoly(poly([[22, 7], [44, 7], [44, 8.5], [22, 8.5]]), C('blood', 0.45));
  m.dent(...T(50, 9), 3, 2.4, 1);
  m.tint((x, y, c) => {
    const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    const r = h - Math.floor(h);
    if (r > 0.985) return mix(c, C('steel', 0.75), 0.6); // chipped paint
    if (r < 0.07) return darken(c, 0.25);
    return undefined;
  });
  // The squeeze lever, hinged at the back, black rubber grip.
  const lift = 3.2 - squeeze;
  const lever = [[61, -1], [46, -2.5 - lift * 0.4], [30, -3 - lift * 0.8], [14, -3.5 - lift]];
  for (let k = 0; k + 1 < lever.length; k++) {
    const [a, b] = [T(...lever[k]), T(...lever[k + 1])];
    m.capsule(a[0], a[1], 16, b[0], b[1], 16, 3.4 - k * 0.3, 3.1 - k * 0.3, k < 2 ? C('gray', 0.1) : C('steel', 0.55), k < 2 ? MAT.leather : MAT.metal);
  }
  m.sphere(...T(61, 0), 18, 2.6, C('steel', 0.6), MAT.metal);
  // Alex's hand: the back of it along the lever, fingers wrapped under the body.
  const sq = squeeze * 0.5;
  const [w0, w1] = [T(58, -4 + sq), T(36, -5 + sq)];
  forearm(m, [106, 112, 24], [w0[0] + 10, w0[1] + 12, 22], 8.5);
  m.capsule(w0[0], w0[1], 22, w1[0], w1[1], 24, 8, 6.8, SKIN, MAT.skin);
  for (let k = 0; k < 4; k++) {
    const [kx, ky] = T(35 + k * 5.4, -7.5 + sq);
    m.sphere(kx, ky, 27, 2.6, lighten(SKIN, 0.04), MAT.skin); // knuckles
    const [fx, fy] = T(35 + k * 5.4, 14);
    m.sphere(fx, fy, 22, 2.5, darken(SKIN, 0.08), MAT.skin); // fingertips curling round
  }
  const [t0, t1] = [T(54, 3), T(30, 4)];
  m.capsule(t0[0], t0[1], 26, t1[0], t1[1], 25, 3, 2.3, SKIN, MAT.skin); // thumb along the near side
  const c = render(m);
  if (fire) {
    const [nx, ny] = T(-2, 13);
    flash(c, nx, ny, 7, G('yellow', 1), G('yellow', 0.45));
  }
  return c;
}

function stapleGunSheet() {
  return sheet([stapleGunFrame(), stapleGunFrame({ fire: true, y: 14, squeeze: 3 }), stapleGunFrame({ y: 20, squeeze: 3 }), stapleGunFrame({ y: 16 })]);
}

// ------------------------------------------------------------------ thumbtack shotgun

function shotgunFrame({ fire = false, pump = 0, kick = 0 } = {}) {
  const m = new Model(128, 96, { seed: 107 });
  const cx = 64;
  const y = 10 + kick;
  // Barrel and the clear magazine tube full of thumbtacks.
  m.capsule(cx, 112, 34, cx, y + 6, 2, 10, 4.6, C('steel', 0.32), MAT.metal);
  m.capsule(cx + 1, 112, 44, cx + 1, y + 22, 8, 8.5, 3.6, C('steel', 0.6), MAT.glass);
  for (let t = 0; t < 10; t++) {
    const ty = y + 26 + t * 7.4;
    const w = 2.4 + t * 0.55;
    m.paint(cx + 1, ty, w, 1.4, [C('blood', 0.6), C('steel', 0.75), C('yellow', 0.7)][t % 3], MAT.plastic);
    m.paint(cx + 1, ty + 1.8, 0.6, 1, C('gray', 0.75), MAT.metal);
  }
  m.paint(cx, y + 6, 3.4, 2, C('gray', 0.04));
  // Wooden pump.
  const py = 52 + pump;
  m.capsule(cx, py, 30, cx, py + 22, 36, 14, 16, C('rust', 0.3), MAT.wood);
  for (let k = 0; k < 4; k++) m.paint(cx, py + 4 + k * 5, 14, 0.7, C('rust', 0.16));
  // Hands.
  forearm(m, [16, 118, 40], [cx - 10, py + 16, 40], 10);
  fist(m, cx - 9, py + 10, 42, 8, 1);
  forearm(m, [120, 120, 40], [cx + 30, 92, 36], 10);
  fist(m, cx + 24, 86, 38, 8.5, -1);
  const c = render(m);
  if (fire) flash(c, cx, y + 2, 20, G('yellow', 1), G('yellow', 0.4));
  return c;
}

function shotgunSheet() {
  return sheet([shotgunFrame(), shotgunFrame({ fire: true, kick: 2 }), shotgunFrame({ kick: 8 }), shotgunFrame({ pump: 14 }), shotgunFrame({ pump: 26 })]);
}

// ------------------------------------------------------------------ chicago typewriter

function typewriterFrame({ fire = 0 } = {}) {
  const m = new Model(128, 96, { seed: 109 });
  const cx = 64;
  const shake = fire ? (fire === 1 ? -1 : 1) : 0;
  // Barrel with a perforated cooling jacket.
  m.capsule(cx + shake, 60, 18, cx + shake, 5, 2, 8, 4.4, C('gray', 0.22), MAT.metal);
  for (let y = 12; y < 52; y += 5) m.paint(cx + shake + (y % 10 ? 1 : -1), y, 1.2, 1, C('gray', 0.04));
  m.paint(cx + shake, 5, 2.6, 1.6, C('gray', 0.02));
  // The day's report, still in the roller.
  m.slab([[cx - 22, 30], [cx + 22, 30], [cx + 24, 54], [cx - 24, 54]], 14, C('beige', 0.88), MAT.paper, { bevel: 1, tilt: [0, -0.8] });
  // Machine body.
  m.slab([[cx - 40, 52], [cx + 40, 52], [cx + 54, 100], [cx - 54, 100]], 22, C('olive', 0.32), MAT.plastic, { bevel: 7, thickness: 6, tilt: [0, -0.5] });
  m.capsule(cx - 46, 52, 22, cx + 46, 52, 22, 4, 4, C('gray', 0.12), MAT.leather); // platen roller
  // Keys.
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 9 + row; k++) {
      const kx = cx - 34 - row * 4 + k * 8;
      const ky = 64 + row * 10 + (fire && (k + row + fire) % 4 === 0 ? 2 : 0);
      m.capsule(kx, ky + 2, 26, kx, ky, 29, 2.6, 2.6, C('gray', 0.12), MAT.metal);
      m.ellipsoid(kx, ky - 0.5, 30, 3, 2.4, 1.2, C('beige', 0.75), MAT.plastic);
    }
  }
  forearm(m, [-6, 112, 30], [14, 78, 28], 11);
  fist(m, 18, 74, 30, 9, 1);
  forearm(m, [134, 112, 30], [114, 78, 28], 11);
  fist(m, 110, 74, 30, 9, -1);
  const c = render(m);
  for (let l = 0; l < 4; l++) {
    for (let x = cx - 18; x < cx + 18; x++) if (hash2(x, l, 5) > 0.3) c.set(x, 35 + l * 4, C('gray', 0.35));
  }
  if (fire) flash(c, cx + shake, 2, 15, G('yellow', 1), G('yellow', fire === 1 ? 0.4 : 0.55));
  return c;
}

function typewriterSheet() {
  return sheet([typewriterFrame(), typewriterFrame({ fire: 1 }), typewriterFrame({ fire: 2 })]);
}

// ------------------------------------------------------------------ toner launcher

function launcherFrame({ fire = false, kick = 0 } = {}) {
  const m = new Model(128, 96, { seed: 113 });
  const cx = 64;
  const y = 14 + kick;
  m.capsule(cx, 118, 34, cx, y + 8, 4, 30, 13, C('gray', 0.52), MAT.plastic);
  for (const t of [0.12, 0.42, 0.78]) {
    const yy = y + 8 + (118 - y - 8) * t;
    m.paint(cx, yy, 30, 1.6, C('gray', 0.18));
  }
  m.paint(cx, y + 42, 15, 5.5, C('blood', 0.45));
  // The muzzle opening.
  m.dent(cx, y + 6, 11, 4, 2);
  m.paint(cx, y + 6, 10, 3.6, C('gray', 0.04));
  m.slab([[cx - 2, y - 5], [cx + 2, y - 5], [cx + 2, y + 4], [cx - 2, y + 4]], 14, C('gray', 0.15), MAT.metal, { bevel: 1 });
  forearm(m, [10, 118, 44], [cx - 26, 82, 40], 11);
  fist(m, cx - 24, 76, 42, 9, 1);
  forearm(m, [124, 112, 44], [cx + 28, 74, 40], 11);
  fist(m, cx + 26, 68, 42, 9, -1);
  const c = render(m);
  tinyText(c, 'TONER', cx - 9, y + 40, C('beige', 0.9));
  if (fire) {
    flash(c, cx, y + 2, 22, G('yellow', 1), G('red', 0.8));
    c.ellipse(cx - 14, y - 2, 6, 4, C('gray', 0.5));
    c.ellipse(cx + 15, y - 5, 5, 4, C('gray', 0.45));
  }
  return c;
}

function launcherSheet() {
  return sheet([launcherFrame(), launcherFrame({ fire: true, kick: 3 }), launcherFrame({ kick: 10 })]);
}

// ------------------------------------------------------------------ B.F.C. 9000

function bfcFrame({ bubble = 0, charge = 0, fire = false, kick = 0 } = {}) {
  const m = new Model(128, 96, { seed: 127 });
  const cx = 64;
  const y = 18 + kick;
  // Chrome housing and nozzle.
  m.slab([[cx - 34, y + 16], [cx + 34, y + 16], [cx + 48, 100], [cx - 48, 100]], 18, C('steel', 0.62), MAT.metal, { bevel: 8, thickness: 6, tilt: [0, -0.4] });
  m.slab([[cx - 30, y + 2], [cx + 30, y + 2], [cx + 32, y + 18], [cx - 32, y + 18]], 16, C('steel', 0.45), MAT.metal, { bevel: 4, thickness: 3, tilt: [0, -0.9] });
  m.capsule(cx, y + 8, 18, cx, y - 8, 10, 7, 5, C('gray', 0.25), MAT.metal);
  m.paint(cx, y - 8, 4, 2, C('gray', 0.03));
  // The carafe of glowing coffee.
  m.ellipsoid(cx, y + 52, 26, 24, 20, 12, C('steel', 0.72), MAT.glass);
  m.paint(cx, y + 56, 21, 15, G('amber', Math.min(1, 0.25 + charge * 0.4)), MAT.glow);
  m.paint(cx, y + 59, 15, 10, G('yellow', Math.min(1, 0.05 + charge * 0.3)), MAT.glow);
  for (let k = 0; k < 6; k++) {
    const bx = cx - 14 + ((k * 11 + bubble * 7) % 28);
    const by = y + 48 + ((k * 5 + bubble * 3) % 16);
    m.paint(bx, by, 1.4, 1.4, G('yellow', 0.85), MAT.glow);
  }
  // Control panel.
  m.slab([[cx - 22, y + 6], [cx + 22, y + 6], [cx + 22, y + 14], [cx - 22, y + 14]], 18, C('gray', 0.1), MAT.plastic, { bevel: 1 });
  forearm(m, [2, 116, 40], [cx - 40, 84, 36], 11);
  fist(m, cx - 38, 78, 38, 9, 1);
  forearm(m, [126, 116, 40], [cx + 40, 84, 36], 11);
  fist(m, cx + 38, 78, 38, 9, -1);
  const c = render(m);
  // Glass highlight and LED readout.
  c.line(cx - 18, y + 40, cx - 12, y + 64, C('steel', 0.95));
  const txt = charge > 0.5 ? G('red', 1) : G('red', 0.5);
  for (let k = 0; k < 8; k++) c.set(cx - 14 + k * 4, y + 10, txt);
  c.set(cx + 19, y + 10, charge > 0 ? G('green', 1) : C('gray', 0.3));
  if (charge > 0.5) for (let k = 0; k < 4; k++) c.ellipse(cx - 12 + k * 8, y - 12 - k * 2, 4, 3, C('steel', 0.85));
  if (fire) {
    flash(c, cx, y - 12, 24, G('yellow', 1), G('amber', 1));
    c.ellipse(cx, y - 12, 9, 7, G('lamp', 1));
  }
  return c;
}

function bfcSheet() {
  return sheet([bfcFrame({ bubble: 0 }), bfcFrame({ bubble: 1 }), bfcFrame({ charge: 1, bubble: 2 }), bfcFrame({ fire: true, charge: 1, kick: 2 }), bfcFrame({ kick: 10, bubble: 3 })]);
}

export default [
  { name: 'paws', out: W('paws'), draw: pawsSheet, dither: 'fs' },
  { name: 'staple-gun', out: W('staple-gun'), draw: stapleGunSheet, dither: 'fs' },
  { name: 'tack-shotgun', out: W('tack-shotgun'), draw: shotgunSheet, dither: 'fs' },
  { name: 'typewriter', out: W('typewriter'), draw: typewriterSheet, dither: 'fs' },
  { name: 'toner-launcher', out: W('toner-launcher'), draw: launcherSheet, dither: 'fs' },
  { name: 'bfc', out: W('bfc'), draw: bfcSheet, dither: 'fs' },
];

export { forearm, fist };
