// Humanoid monsters: the Zombie Intern, the Reply-All Imp and the Middle Manager.
// Built from shaded 3D primitives (see lib/model.js and lib/rig.js) for a
// sculpted, digitized look rather than flat cartoon colours.
import { mix, darken, lighten } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { Model, MAT, skeleton, body, puddle } from '../lib/rig.js';
import { sheet, flash } from '../lib/sprite.js';
import { fbm } from '../lib/noise.js';

const M = (name) => `assets/sprites/monsters/${name}.png`;

/** Grime and blood blotches over a region of the model. */
function grime(m, seed, { amount = 0.25, blood = 0, region = () => true } = {}) {
  const n = fbm(seed, 64, { cells: 5, octaves: 3 });
  const bl = fbm(seed + 7, 64, { cells: 4, octaves: 2 });
  m.tint((x, y, c) => {
    if (!region(x, y)) return undefined;
    const f = 1 - amount * Math.max(0, n(x % 64, y % 64) - 0.45) * 2;
    if (blood && bl(x % 64, y % 64) > 1 - blood * 0.5) {
      const b = mix(c, C('blood', 0.35), 0.75);
      return [b[0] * f, b[1] * f, b[2] * f];
    }
    return f;
  });
}

const RENDER = { light: [-0.5, -0.6, 0.62], ambient: 0.3, aoStrength: 0.5 };

// ------------------------------------------------------------------ intern

const ZOMBIE = mix(C('skin', 0.5), C('olive', 0.55), 0.5);
const SHIRT = C('beige', 0.78);
const KHAKI = mix(C('beige', 0.42), C('olive', 0.45), 0.3);

function internFrame(pose, { aim = false, fire = false, gore = 0, stains = 0.4 } = {}) {
  const m = new Model(64, 64, { seed: 11 });
  const J = skeleton(64, 64, pose, { height: 49 });
  body(m, J, {
    skin: ZOMBIE,
    shirt: SHIRT,
    pants: KHAKI,
    shoes: C('rust', 0.12),
    hair: C('rust', 0.1),
    sleeve: 'short',
    clothes(mm, j) {
      const [nx, ny] = j.neck;
      const [bx, by] = j.belly;
      // Loosened red tie.
      mm.stroke(nx, ny + 2.4, (nx + bx) / 2 + 0.6, by + 1.5, 1.7, C('blood', 0.5), MAT.cloth);
      mm.paint(nx, ny + 2.6, 1.2, 0.9, C('blood', 0.4));
      // Open collar.
      mm.paint(nx - 1.7, ny + 1.9, 1.3, 0.9, lighten(SHIRT, 0.1));
      mm.paint(nx + 1.7, ny + 1.9, 1.3, 0.9, lighten(SHIRT, 0.1));
      // Lanyard and ID badge.
      mm.stroke(nx - 2.2, ny + 1.5, nx - 3.6, ny + 7.5, 0.7, C('steel', 0.45), MAT.cloth);
      const [cx, cy, cz] = j.chest;
      mm.slab([[cx - 5.6, cy - 0.6], [cx - 2.4, cy - 0.6], [cx - 2.4, cy + 3.4], [cx - 5.6, cy + 3.4]], cz + 4.4, C('beige', 0.95), MAT.plastic, { bevel: 0.8, thickness: 0.6 });
      mm.paint(cx - 4, cy + 0.4, 1, 0.8, C('skin', 0.5));
      // Belt.
      const [px, py] = j.pelvis;
      mm.stroke(px - 6, py - 2.6, px + 6, py - 2.6, 1.3, C('rust', 0.12), MAT.leather);
      grime(mm, 21, { amount: 0.35, blood: stains, region: (x, y) => y > ny && y < py + 10 });
    },
    face(mm, j) {
      const [hx, hy] = j.head;
      // Sunken, glowing eyes and a slack, bloody mouth.
      mm.paint(hx - 1.7, hy - 0.3, 1.3, 0.9, darken(ZOMBIE, 0.55));
      mm.paint(hx + 1.7, hy - 0.3, 1.3, 0.9, darken(ZOMBIE, 0.55));
      mm.dot(hx - 2, hy - 0.4, G('red', 1), MAT.glow);
      mm.dot(hx + 1.4, hy - 0.4, G('red', 1), MAT.glow);
      mm.dent(hx, hy + 2.8, 1.8, 0.8, 1.4);
      mm.stroke(hx - 1.5, hy + 2.8, hx + 1.5, hy + 3, 0.9, C('blood', 0.15));
      mm.stroke(hx + 1, hy + 3.2, hx + 1.2, hy + 5, 0.6, C('blood', 0.4));
    },
    held(mm, j) {
      if (aim) {
        const [x, y, z] = [(j.handL[0] + j.handR[0]) / 2, (j.handL[1] + j.handR[1]) / 2 - 1.5, Math.max(j.handL[2], j.handR[2]) + 2];
        mm.slab([[x - 3.6, y - 3], [x + 3.6, y - 3], [x + 3.6, y + 2.5], [x - 3.6, y + 2.5]], z, C('orange', 0.55), MAT.plastic, { bevel: 1.5, thickness: 1.2 });
        mm.slab([[x - 2, y - 2], [x + 2, y - 2], [x + 2, y + 1.5], [x - 2, y + 1.5]], z + 0.5, C('gray', 0.12), MAT.metal, { bevel: 0.8 });
        mm.paint(x, y - 0.2, 0.8, 0.8, C('gray', 0.02));
      } else {
        const [x, y, z] = j.handR;
        mm.slab([[x - 1, y - 2], [x + 5, y - 2], [x + 5, y + 1.5], [x - 1, y + 1.5]], z + 1.5, C('orange', 0.55), MAT.plastic, { bevel: 1 });
        mm.slab([[x - 0.5, y + 1], [x + 2, y + 1], [x + 2, y + 4], [x - 0.5, y + 4]], z + 1, C('gray', 0.12), MAT.plastic, { bevel: 0.8 });
      }
    },
  });
  if (gore) puddle(m, 32, 61, 13 + gore * 4, 2.6, C('blood', 0.3));
  const c = m.render(RENDER);
  if (fire) {
    const x = (J.handL[0] + J.handR[0]) / 2;
    const y = (J.handL[1] + J.handR[1]) / 2 - 2;
    flash(c, x, y, 7, G('yellow', 1), G('yellow', 0.5));
  }
  return c;
}

const STEP = [
  { bob: 0, legL: { thigh: 22, knee: 30 }, legR: { thigh: -12, knee: 8 }, armL: { swing: -18, bend: 20 }, armR: { swing: 20, bend: 30 } },
  { bob: -1, legL: { thigh: 4, knee: 8 }, legR: { thigh: 4, knee: 8 }, armL: { swing: 0, bend: 18 }, armR: { swing: 0, bend: 22 } },
  { bob: 0, legL: { thigh: -12, knee: 8 }, legR: { thigh: 22, knee: 30 }, armL: { swing: 20, bend: 30 }, armR: { swing: -18, bend: 20 } },
  { bob: -1, legL: { thigh: 4, knee: 8 }, legR: { thigh: 4, knee: 8 }, armL: { swing: 0, bend: 18 }, armR: { swing: 0, bend: 22 } },
];

/** Recoil, topple, then lie in a growing pool with the limbs settled. */
function falls(frameFn, recoil, n = 5) {
  const angles = [0, 0.55, 1.1, 1.5, 1.57, 1.57];
  const settled = {
    ...recoil,
    armL: { spread: 6, swing: -8, bend: 12 },
    armR: { spread: 8, swing: 8, bend: 16 },
    legL: { thigh: 6, knee: 10, spread: 6 },
    legR: { thigh: -4, knee: 6, spread: 4 },
  };
  const out = [frameFn(recoil, 0)];
  for (let i = 1; i < n; i++) {
    const lying = i >= n - 2;
    const pose = i >= n - 3 ? settled : recoil;
    out.push(frameFn({ ...pose, fall: angles[Math.min(i, angles.length - 1)] }, lying ? (i === n - 1 ? 2 : 1) : 0));
  }
  return out;
}

function internSheet() {
  const frames = STEP.map((p) => internFrame({ ...p, armR: { ...p.armR, bend: 50 } }));
  const aim = {
    legL: { thigh: 4, knee: 6, spread: 6 },
    legR: { thigh: -4, knee: 4, spread: 6 },
    armL: { reach: [30.5, 33, 9] },
    armR: { reach: [33.5, 33, 9] },
  };
  frames.push(internFrame(aim, { aim: true }));
  frames.push(internFrame({ ...aim, lean: -0.5 }, { aim: true, fire: true }));
  frames.push(internFrame({ lean: -3, headTilt: -1.5, headLift: 1, armL: { spread: 40, swing: 10, bend: 30 }, armR: { spread: 45, swing: -10, bend: 40 }, legL: { thigh: 8, knee: 14 }, legR: { thigh: -6, knee: 4 } }));
  const recoil = { lean: -3, headTilt: -2, armL: { spread: 60, swing: 10, bend: 40 }, armR: { spread: 70, swing: 20, bend: 50 }, legL: { thigh: 12, knee: 24 }, legR: { thigh: -4, knee: 10 } };
  frames.push(...falls((p, gore) => internFrame(p, { gore, stains: 0.6 }), recoil));
  return sheet(frames);
}

// ------------------------------------------------------------------ imp

const IMP = mix(C('rust', 0.34), C('blood', 0.38), 0.55);
const SUIT = C('navy', 0.42);

function impFrame(pose, { holding = false, gore = 0, mouth = false } = {}) {
  const m = new Model(64, 64, { seed: 23 });
  const J = skeleton(64, 64, { hunch: 2.5, ...pose }, { height: 47, build: 1.12 });
  body(m, J, {
    skin: IMP,
    skinMat: MAT.flesh,
    shirt: SUIT,
    pants: darken(SUIT, 0.2),
    shoes: darken(IMP, 0.3),
    shoeMat: MAT.flesh,
    sleeve: 'short',
    hands: darken(IMP, 0.15),
    headShape: { rx: 4.4, ry: 4.6, rz: 4.6 },
    clothes(mm, j) {
      const [nx, ny] = j.neck;
      const [cx, cy] = j.chest;
      // Bare chest showing through the shredded jacket.
      mm.paintPoly([[nx - 3.5, ny + 1.5], [nx + 3.5, ny + 1.5], [cx + 1, cy + 6], [cx - 1, cy + 6]], IMP, MAT.flesh);
      mm.stroke(cx - 2.5, cy + 0.5, cx + 2.5, cy + 0.5, 0.6, darken(IMP, 0.4));
      mm.stroke(cx - 1.8, cy + 2.8, cx + 1.8, cy + 2.8, 0.6, darken(IMP, 0.4));
      // Bony shoulder spikes.
      for (const n of ['L', 'R']) {
        const [sx, sy, sz] = j[`shoulder${n}`];
        const side = n === 'L' ? -1 : 1;
        m.capsule(sx, sy - 1, sz + 1, sx + side * 3.5, sy - 6, sz + 1.5, 1.6, 0.3, C('beige', 0.62), MAT.bone);
        m.capsule(sx - side * 1.5, sy - 1.5, sz, sx - side * 0.5, sy - 5, sz + 0.5, 1.1, 0.2, C('beige', 0.55), MAT.bone);
      }
      grime(mm, 31, { amount: 0.4, region: (x, y) => y > ny });
      // Claws.
      for (const n of ['L', 'R']) {
        const [x, y, z] = j[`hand${n}`];
        for (let k = -1; k <= 1; k++) m.capsule(x + k * 1.2, y + 1, z + 1, x + k * 1.6, y + 3.4, z + 1.6, 0.6, 0.15, C('beige', 0.7), MAT.bone);
      }
    },
    face(mm, j) {
      const [hx, hy, hz] = j.head;
      // Curved horns.
      for (const side of [-1, 1]) {
        m.capsule(hx + side * 3, hy - 2.5, hz - 0.5, hx + side * 5.5, hy - 6.5, hz - 1, 1.5, 1, C('beige', 0.6), MAT.bone);
        m.capsule(hx + side * 5.5, hy - 6.5, hz - 1, hx + side * 5, hy - 10, hz - 1.5, 1, 0.25, C('beige', 0.7), MAT.bone);
      }
      // Brow ridge, glowing eyes, fanged mouth.
      m.ellipsoid(hx, hy - 1.6, hz + 2.6, 3.8, 1.1, 1.6, darken(IMP, 0.1), MAT.flesh);
      mm.paint(hx - 1.8, hy - 0.2, 1.3, 0.8, G('yellow', 0.75), MAT.glow);
      mm.paint(hx + 1.8, hy - 0.2, 1.3, 0.8, G('yellow', 0.75), MAT.glow);
      mm.dot(hx - 1.8, hy - 0.3, G('red', 1), MAT.glow);
      mm.dot(hx + 1.4, hy - 0.3, G('red', 1), MAT.glow);
      mm.paint(hx, hy + 2.6, 2.4, mouth ? 1.6 : 0.9, C('gray', 0.06));
      for (const k of [-1.6, 1.2]) mm.dot(hx + k, hy + 2, C('beige', 0.9));
      if (mouth) mm.dot(hx - 0.2, hy + 3.4, C('blood', 0.5));
    },
  });
  if (gore) puddle(m, 32, 61, 12 + gore * 4, 2.5, C('blood', 0.28));
  const c = m.render(RENDER);
  if (holding) envelope(c, J.handR[0] + 1, J.handR[1] - 4);
  return c;
}

/** A burning reply-all email (fullbright glow colours). */
function envelope(c, x, y) {
  c.ellipse(x, y - 2, 4.5, 6, G('yellow', 0.05));
  c.ellipse(x, y - 1, 3.5, 4.5, G('yellow', 0.35));
  c.ellipse(x + 1, y - 4, 1.8, 2.6, G('yellow', 0.7));
  c.rect(x - 3, y - 1, 7, 5, G('lamp', 1));
  c.line(x - 3, y - 1, x, y + 2, G('lamp', 0));
  c.line(x + 3, y - 1, x, y + 2, G('lamp', 0));
  c.set(x, y - 7, G('yellow', 0.9));
  c.set(x - 2, y - 6, G('yellow', 0.55));
}

function impSheet() {
  const frames = STEP.map((p) => impFrame({ ...p, armL: { ...p.armL, spread: 18, bend: 45 }, armR: { ...p.armR, spread: 18, bend: 45 } }));
  frames.push(impFrame({ armL: { spread: 25, swing: 10, bend: 40 }, armR: { spread: 70, swing: -15, bend: 120 }, legL: { thigh: 6, knee: 10, spread: 7 }, legR: { thigh: -6, knee: 6, spread: 7 } }, { holding: true }));
  frames.push(impFrame({ lean: 2, armL: { spread: 30, swing: 20, bend: 40 }, armR: { spread: 85, swing: -30, bend: 120 }, legL: { thigh: 10, knee: 16, spread: 7 }, legR: { thigh: -8, knee: 6, spread: 7 } }, { holding: true, mouth: true }));
  frames.push(impFrame({ lean: -1, armL: { spread: 20, swing: 0, bend: 30 }, armR: { reach: [36, 30, 10] }, legL: { thigh: 14, knee: 18, spread: 6 }, legR: { thigh: -10, knee: 4, spread: 6 } }, { mouth: true }));
  frames.push(impFrame({ lean: -3, headTilt: -2, headLift: 1, armL: { spread: 45, swing: 10, bend: 30 }, armR: { spread: 45, swing: -10, bend: 30 } }, { mouth: true }));
  const recoil = { lean: -3, headTilt: 2, armL: { spread: 70, swing: 15, bend: 40 }, armR: { spread: 70, swing: 15, bend: 40 }, legL: { thigh: 12, knee: 20 } };
  frames.push(...falls((p, gore) => impFrame(p, { gore, mouth: true }), recoil));
  return sheet(frames);
}

// ------------------------------------------------------------------ manager

const GRAY_SKIN = mix(C('skin', 0.5), C('gray', 0.55), 0.4);
const SUIT_GRAY = C('gray', 0.38);

function managerFrame(pose, { orb = false, caseOpen = false, noCase = false, gore = 0, mouth = false } = {}) {
  const m = new Model(64, 80, { seed: 37 });
  const J = skeleton(64, 80, pose, { height: 62, build: 1.12 });
  body(m, J, {
    skin: GRAY_SKIN,
    shirt: SUIT_GRAY,
    pants: darken(SUIT_GRAY, 0.15),
    shoes: C('gray', 0.06),
    shoeMat: MAT.leather,
    sleeve: 'long',
    headShape: { rx: 4.5, ry: 5.2, rz: 4.6 },
    clothes(mm, j) {
      const [nx, ny] = j.neck;
      const [cx, cy] = j.chest;
      // White shirt V, red tie, lapels, pocket square.
      mm.paintPoly([[nx - 3, ny + 1.5], [nx + 3, ny + 1.5], [cx, cy + 5]], C('beige', 0.85), MAT.cloth);
      mm.stroke(nx, ny + 2.3, cx + 0.3, cy + 8, 1.7, C('blood', 0.5));
      mm.stroke(nx - 3, ny + 1.6, cx - 1.3, cy + 5.5, 0.8, darken(SUIT_GRAY, 0.35));
      mm.stroke(nx + 3, ny + 1.6, cx + 1.3, cy + 5.5, 0.8, darken(SUIT_GRAY, 0.35));
      mm.paint(cx + 4.4, cy - 0.5, 1.2, 0.7, C('beige', 0.8));
      grime(mm, 41, { amount: 0.25, region: (x, y) => y > ny });
    },
    face(mm, j) {
      const [hx, hy, hz] = j.head;
      for (const side of [-1, 1]) {
        m.capsule(hx + side * 2.6, hy - 3.5, hz, hx + side * 3.8, hy - 7.5, hz - 0.5, 1.2, 0.3, C('beige', 0.55), MAT.bone);
        m.ellipsoid(hx + side * 4, hy + 0.2, hz - 0.8, 1, 2, 1.6, C('gray', 0.3), MAT.hair);
      }
      mm.paint(hx - 1.8, hy - 0.3, 1.2, 0.6, G('green', 1), MAT.glow);
      mm.paint(hx + 1.8, hy - 0.3, 1.2, 0.6, G('green', 1), MAT.glow);
      m.ellipsoid(hx, hy + 2.3, hz + 3.8, 2.3, 0.7, 1, C('gray', 0.18), MAT.hair); // moustache
      mm.paint(hx, hy + 3.4, 1.5, mouth ? 1.2 : 0.5, C('blood', 0.15));
    },
    held(mm, j) {
      if (noCase) return;
      const [x, y, z] = j.handL;
      mm.slab([[x - 6, y + 1], [x + 4, y + 1], [x + 4, y + 9], [x - 6, y + 9]], z + 1, C('rust', 0.28), MAT.leather, { bevel: 1.4, thickness: 1 });
      mm.slab([[x - 3, y - 0.5], [x + 1, y - 0.5], [x + 1, y + 1.5], [x - 3, y + 1.5]], z + 0.5, C('rust', 0.15), MAT.leather, { bevel: 0.6 });
      mm.paint(x - 1, y + 4, 0.8, 0.8, C('yellow', 0.8), MAT.brass);
      if (caseOpen) mm.paint(x - 1, y + 6, 4, 2.5, C('beige', 0.9), MAT.paper);
    },
  });
  if (gore) {
    puddle(m, 32, 77, 14 + gore * 4, 2.6, C('blood', 0.28));
    for (const [x, y] of [[12, 74], [18, 70], [48, 75]]) m.slab([[x, y], [x + 4, y - 1], [x + 5, y + 2], [x + 1, y + 3]], -10, C('beige', 0.9), MAT.paper, { tilt: [0, -2] });
  }
  const c = m.render(RENDER);
  if (orb) {
    const [x, y] = J.handR;
    c.ellipse(x, y - 4, 4.5, 4.5, G('green', 0.25));
    c.ellipse(x, y - 4, 3, 3, G('green', 0.6));
    c.ellipse(x - 0.5, y - 4.5, 1.5, 1.5, G('green', 1));
    c.set(x - 1, y - 5, G('yellow', 1));
  }
  return c;
}

function managerSheet() {
  const frames = STEP.map((p) => managerFrame({ ...p, armL: { spread: 8, swing: p.armL.swing * 0.5, bend: 10 } }));
  frames.push(managerFrame({ armL: { spread: 8, bend: 10 }, armR: { spread: 50, swing: -10, bend: 110 }, legL: { spread: 6 }, legR: { spread: 6 } }, { orb: true }));
  frames.push(managerFrame({ lean: 2, armL: { spread: 10, bend: 10 }, armR: { spread: 80, swing: -25, bend: 120 }, legL: { thigh: 10, knee: 14, spread: 6 }, legR: { spread: 6 } }, { orb: true, mouth: true }));
  frames.push(managerFrame({ lean: -1, armL: { spread: 8, bend: 10 }, armR: { reach: [36, 40, 11] }, legL: { thigh: 14, knee: 18 }, legR: { thigh: -8, knee: 4 } }, { mouth: true }));
  frames.push(managerFrame({ lean: -3, headTilt: -2, headLift: 1, armL: { spread: 30, bend: 20 }, armR: { spread: 45, swing: -10, bend: 30 } }, { mouth: true }));
  const recoil = { lean: -3, headTilt: -2, armL: { spread: 55, swing: 10, bend: 30 }, armR: { spread: 65, swing: 10, bend: 40 }, legL: { thigh: 10, knee: 18 } };
  frames.push(...falls((p, gore) => managerFrame(p, { noCase: true, gore, mouth: true }), recoil, 6));
  return sheet(frames);
}

export default [
  { name: 'intern', out: M('intern'), draw: internSheet, dither: 'fs' },
  { name: 'imp', out: M('imp'), draw: impSheet, dither: 'fs' },
  { name: 'manager', out: M('manager'), draw: managerSheet, dither: 'fs' },
];

export { grime, RENDER, STEP, falls, envelope };
