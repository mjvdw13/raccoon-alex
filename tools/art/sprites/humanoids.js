// Monsters built on the two-legged rig: the Zombie Intern, the Reply-All Imp and the Middle Manager.
// Built from shaded 3D primitives (see lib/model.js and lib/rig.js) for a
// sculpted, digitized look rather than flat cartoon colours.
import { mix, darken } from '../lib/canvas.js';
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

/** Offsets from a joint that follow the body when it topples over (skeleton `fall`). */
function along(pose) {
  const a = -(pose.fall ?? 0);
  const c = Math.cos(a);
  const s = Math.sin(a);
  return (p, dx, dy, dz = 0) => [p[0] + dx * c - dy * s, p[1] + dx * s + dy * c, p[2] + dz];
}

// ------------------------------------------------------------------ intern
// What's left of an unpaid intern: a rotting, shambling corpse with a staple gun.

const ROT = mix(C('olive', 0.4), C('toxic', 0.32), 0.4);
const ROT_DARK = darken(ROT, 0.55);
const BONE = C('beige', 0.74);
const SHIRT = mix(C('beige', 0.8), C('olive', 0.6), 0.15);
const KHAKI = mix(C('beige', 0.4), C('olive', 0.42), 0.35);

function internFrame(pose, { aim = false, fire = false, gore = 0, stains = 0.5 } = {}) {
  const m = new Model(64, 64, { seed: 11 });
  const J = skeleton(64, 64, { hunch: 1.8, ...pose }, { height: 49, build: 0.86 });
  const at = along(pose);
  const xy = (p, dx, dy) => at(p, dx, dy).slice(0, 2);
  const lit = (pose.fall ?? 0) < 1; // the glow goes out once they hit the floor
  body(m, J, {
    skin: ROT,
    skinMat: MAT.flesh,
    shirt: SHIRT,
    pants: KHAKI,
    shoes: C('rust', 0.12),
    sleeve: 'short',
    head(mm, j) {
      const h = j.head;
      // A shrunken, half-bare skull with the jaw hanging loose.
      mm.ellipsoid(...at(h, 0, -0.8, -0.2), 4, 4.3, 4.2, ROT, MAT.flesh);
      mm.ellipsoid(...at(h, 0, 1.8, 0.9), 2.9, 2, 3.2, ROT, MAT.flesh);
      mm.ellipsoid(...at(h, -1.3, -3.2, 1.2), 2.1, 1.4, 2.5, BONE, MAT.bone);
      mm.ellipsoid(...at(h, 0.6, 4.5, 1.4), 2.4, 1.3, 2.6, BONE, MAT.bone);
      mm.sphere(...at(h, 3.9, 0.4, -1), 1, ROT, MAT.flesh);
      // The face has rotted down to the bone: empty sockets (one still glows),
      // a hole for a nose and a lipless grin.
      mm.paint(...xy(h, 0, 0.9), 3, 2.9, mix(ROT, BONE, 0.6), MAT.bone);
      for (const side of [-1, 1]) {
        mm.dent(...xy(h, side * 1.7, -0.2), 1.5, 1.3, 1.7);
        mm.paint(...xy(h, side * 1.7, -0.2), 1.25, 1.05, C('gray', 0.03));
      }
      mm.dot(...xy(h, -1.9, -0.3), lit ? G('red', 1) : C('blood', 0.2), lit ? MAT.glow : MAT.flesh);
      mm.paintPoly([xy(h, -0.7, 1.8), xy(h, 0.7, 1.8), xy(h, 0, 0.7)], C('gray', 0.05));
      mm.paint(...xy(h, 0.3, 3.5), 2.3, 1.1, C('gray', 0.04));
      for (const k of [-1.5, -0.5, 0.5, 1.5]) {
        mm.dot(...xy(h, k, 2.8), BONE, MAT.bone);
        mm.dot(...xy(h, k + 0.6, 4.2), BONE, MAT.bone);
      }
      for (const [x0, y0, x1, y1] of [[2.4, -3.6, 3.6, -1], [1.2, -4.4, 2.6, -2.6], [-3.6, -2, -3.9, 0.6]]) mm.stroke(...xy(h, x0, y0), ...xy(h, x1, y1), 0.6, C('rust', 0.1));
    },
    clothes(mm, j) {
      // The shirt is torn open: rotten skin and bare ribs show through.
      mm.paintPoly([xy(j.chest, 0.2, -4.2), xy(j.chest, 4.6, -3.6), xy(j.chest, 5.2, 1.6), xy(j.chest, 3.6, 4.8), xy(j.chest, 0.6, 3.2)], ROT_DARK, MAT.flesh);
      for (let r = 0; r < 4; r++) mm.stroke(...xy(j.chest, 0.9, -2.8 + r * 1.8), ...xy(j.chest, 4.5, -2.2 + r * 1.8), 0.65, BONE, MAT.bone);
      // A ragged hem over a rotten belly.
      mm.paintPoly([xy(j.belly, -4.6, 2.4), xy(j.belly, -1.5, 0.6), xy(j.belly, 0.8, 2.8), xy(j.belly, 3.4, 0.9), xy(j.belly, 5, 3.4), xy(j.belly, 4.4, 6), xy(j.belly, -4.4, 6)], ROT, MAT.flesh);
      // What's left of the tie, and the intern badge on its lanyard.
      mm.stroke(...xy(j.neck, 0, 2.4), ...xy(j.chest, -0.8, 3.6), 1.6, C('blood', 0.45), MAT.cloth);
      mm.stroke(...xy(j.neck, -2.2, 1.5), ...xy(j.chest, -3.8, 0.4), 0.7, C('steel', 0.45), MAT.cloth);
      const cz = j.chest[2];
      mm.slab([xy(j.chest, -5.6, -0.6), xy(j.chest, -2.4, -0.6), xy(j.chest, -2.4, 3.4), xy(j.chest, -5.6, 3.4)], cz + 4.4, C('beige', 0.95), MAT.plastic, { bevel: 0.8, thickness: 0.6 });
      mm.paint(...xy(j.chest, -4, 0.4), 1, 0.8, ROT);
      mm.stroke(...xy(j.pelvis, -6, -2.6), ...xy(j.pelvis, 6, -2.6), 1.3, C('rust', 0.12), MAT.leather);
      grime(mm, 21, { amount: 0.5, blood: stains, region: (x, y) => y > j.neck[1] - 2 });
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
  // A bare bone for a left forearm, and a trouser leg torn away to the knee.
  m.capsule(...at(J.elbowL, 0, 0, 1.3), ...at(J.handL, 0, 0, 1.3), 0.75, 0.55, BONE, MAT.bone);
  m.capsule(...at(J.kneeR, 0, 2.2, 0.4), ...at(J.ankleR, 0, -0.5, 0.4), 2.2, 1.6, ROT, MAT.flesh);
  m.capsule(...at(J.kneeR, 0.3, 2.4, 1.8), ...at(J.ankleR, 0.2, -0.8, 1.6), 0.6, 0.5, BONE, MAT.bone);
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

/** A shambling walk: short dragging steps, swaying, the head lolling to one side. */
const SHAMBLE = [
  { bob: 0, lean: -0.8, headTilt: 1.1, legL: { thigh: 16, knee: 22 }, legR: { thigh: -8, knee: 12 } },
  { bob: -0.6, headTilt: 1.5, legL: { thigh: 4, knee: 10 }, legR: { thigh: 2, knee: 14 } },
  { bob: 0, lean: 0.8, headTilt: 1.9, legL: { thigh: -8, knee: 12 }, legR: { thigh: 14, knee: 24 } },
  { bob: -0.6, headTilt: 1.5, legL: { thigh: 2, knee: 14 }, legR: { thigh: 4, knee: 10 } },
];

function internSheet() {
  const frames = SHAMBLE.map((p, k) =>
    internFrame({ ...p, armL: { reach: [27 + [0, 0.5, 1, 0.5][k], 31 - [0, 0.6, 0, 0.6][k], 13] }, armR: { spread: 12, swing: [12, 0, -10, 0][k], bend: 55 } }),
  );
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
  frames.push(...falls((p, gore) => internFrame(p, { gore, stains: 0.7 }), recoil));
  return sheet(frames);
}

// ------------------------------------------------------------------ imp
// A hunched, spiny demon with a whip of a tail that hurls flaming reply-all emails.

const HIDE = mix(C('rust', 0.3), C('blood', 0.36), 0.5);
const HIDE_DARK = darken(HIDE, 0.4);
const BELLY = mix(C('beige', 0.46), C('rust', 0.42), 0.55);
const HORN = C('beige', 0.6);

function impFrame(pose, { holding = false, gore = 0, mouth = false } = {}) {
  const m = new Model(64, 64, { seed: 23 });
  const legs = { legL: { spread: 7, ...pose.legL }, legR: { spread: 7, ...pose.legR } };
  const J = skeleton(64, 64, { hunch: 3, ...pose, ...legs }, { height: 46, build: 1.18, shoulders: 7.4, hips: 3.8 });
  const at = along(pose);
  const xy = (p, dx, dy) => at(p, dx, dy).slice(0, 2);
  const lit = (pose.fall ?? 0) < 1;
  // The tail curls out from behind the left hip and ends in a barb.
  const tail = [[-1.5, 2.5, -3], [-7, 6.5, -3.2], [-12.5, 5.5, -2.6], [-15.5, 1, -2], [-15, -3.5, -1.6]].map(([dx, dy, dz]) => at(J.pelvis, dx, dy, dz));
  for (let k = 0; k < tail.length - 1; k++) m.capsule(...tail[k], ...tail[k + 1], 1.8 - k * 0.3, 1.5 - k * 0.3, HIDE, MAT.flesh);
  const tip = tail[tail.length - 1];
  m.capsule(...tip, ...at(tip, 0.8, -2.8), 1.1, 0.2, HORN, MAT.bone);
  body(m, J, {
    skin: HIDE,
    skinMat: MAT.flesh,
    shirt: HIDE,
    shirtMat: MAT.flesh,
    pants: HIDE,
    pantsMat: MAT.flesh,
    shins: HIDE_DARK,
    shoes: darken(HIDE, 0.55),
    shoeMat: MAT.bone,
    sleeve: 'none',
    hands: HIDE_DARK,
    head(mm, j) {
      const h = j.head;
      // A low, wide skull with a heavy brow and a jutting, fanged jaw.
      mm.ellipsoid(...at(h, 0, -0.4), 4.6, 3.9, 4.4, HIDE, MAT.flesh);
      mm.ellipsoid(...at(h, 0, 2.4, 1.3), 3.6, 2.3, 3.4, HIDE, MAT.flesh);
      mm.ellipsoid(...at(h, 0, -1.7, 2.8), 4.1, 1.1, 1.6, HIDE_DARK, MAT.flesh);
      for (const side of [-1, 1]) {
        // Horns sweeping up and out, and pointed ears.
        const a = at(h, side * 2.8, -2.6, -0.4);
        const b = at(h, side * 5.6, -5.6, -1);
        mm.capsule(...a, ...b, 1.6, 1.1, HORN, MAT.bone);
        mm.capsule(...b, ...at(h, side * 6, -9.6, -1.4), 1.1, 0.25, HORN, MAT.bone);
        mm.capsule(...at(h, side * 4, 0, -0.6), ...at(h, side * 6.8, -1.6, -1.2), 1.1, 0.25, HIDE, MAT.flesh);
      }
      const mat = lit ? MAT.glow : MAT.flesh;
      for (const side of [-1, 1]) mm.paint(...xy(h, side * 1.8, -0.3), 1.3, 0.6, lit ? G('yellow', 0.8) : C('yellow', 0.2), mat);
      mm.dot(...xy(h, -1.8, -0.4), lit ? G('red', 1) : C('blood', 0.2), mat);
      mm.dot(...xy(h, 1.4, -0.4), lit ? G('red', 1) : C('blood', 0.2), mat);
      // Slit nostrils and a wide mouth full of teeth.
      mm.dot(...xy(h, -0.6, 1.3), C('gray', 0.05));
      mm.dot(...xy(h, 0.6, 1.3), C('gray', 0.05));
      mm.paint(...xy(h, 0, 3), 3, mouth ? 1.7 : 1, C('gray', 0.05));
      for (let k = -2.5; k <= 2.5; k += 1) mm.dot(...xy(h, k, mouth ? 2 : 2.5), C('beige', 0.9), MAT.bone);
      if (mouth) for (let k = -2; k <= 2; k += 1) mm.dot(...xy(h, k, 4), C('beige', 0.85), MAT.bone);
    },
    clothes(mm, j) {
      // Pale belly plates, a ridged chest, bony spikes on the shoulders.
      for (let k = 0; k < 4; k++) mm.paint(...xy(j.belly, 0, -3.6 + k * 2.1), 2.7 - k * 0.25, 0.75, BELLY, MAT.bone);
      for (const side of [-1, 1]) mm.stroke(...xy(j.chest, side * 0.6, -3.5), ...xy(j.chest, side * 4.2, -1.4), 0.6, HIDE_DARK);
      for (const n of ['L', 'R']) {
        const side = n === 'L' ? -1 : 1;
        const sh = j[`shoulder${n}`];
        mm.capsule(...at(sh, 0, -1, 1), ...at(sh, side * 3.5, -6, 1.5), 1.6, 0.3, HORN, MAT.bone);
        mm.capsule(...at(sh, -side * 1.5, -1.5, 0), ...at(sh, -side * 0.5, -5, 0.5), 1.1, 0.2, HORN, MAT.bone);
      }
      grime(mm, 31, { amount: 0.4, region: (x, y) => y > j.neck[1] });
    },
    held(mm, j) {
      for (const n of ['L', 'R']) {
        const side = n === 'L' ? -1 : 1;
        // Spines down the outside of the forearms, long claws, clawed feet.
        const e = j[`elbow${n}`];
        const hd = j[`hand${n}`];
        const mid = [e[0] + (hd[0] - e[0]) * 0.4, e[1] + (hd[1] - e[1]) * 0.4, e[2] + (hd[2] - e[2]) * 0.4];
        mm.capsule(...at(mid, side * 1.4, 0), ...at(mid, side * 3.6, -1.4), 0.8, 0.15, HORN, MAT.bone);
        for (let k = -1; k <= 1; k++) mm.capsule(...at(hd, k * 1.3, 1, 1), ...at(hd, k * 1.9 + side * 0.4, 4.4, 1.8), 0.65, 0.15, HORN, MAT.bone);
        const f = j[`foot${n}`];
        for (let k = -1; k <= 1; k++) mm.capsule(...at(f, k * 1.3, 0, 2), ...at(f, k * 1.8, 1, 4), 0.6, 0.15, HORN, MAT.bone);
      }
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
// A hulking, goat-legged brute with ram horns. It still wears its tie and
// carries its briefcase.

const BRUTE = mix(C('purple', 0.42), C('concrete', 0.42), 0.45);
const BRUTE_DARK = darken(BRUTE, 0.42);
const FUR = mix(C('rust', 0.2), C('gray', 0.18), 0.3);
const RAM = mix(C('beige', 0.48), C('gray', 0.4), 0.4);

function managerFrame(pose, { orb = false, caseOpen = false, noCase = false, gore = 0, mouth = false } = {}) {
  const m = new Model(64, 80, { seed: 37 });
  const J = skeleton(64, 80, { hunch: 2.5, ...pose }, { height: 62, build: 1.3, shoulders: 7.8 });
  const at = along(pose);
  const xy = (p, dx, dy) => at(p, dx, dy).slice(0, 2);
  const lit = (pose.fall ?? 0) < 1;
  body(m, J, {
    skin: BRUTE,
    skinMat: MAT.flesh,
    shirt: BRUTE,
    shirtMat: MAT.flesh,
    pants: FUR,
    pantsMat: MAT.fur,
    shins: FUR,
    shoes: C('gray', 0.07),
    shoeMat: MAT.bone,
    sleeve: 'none',
    hands: BRUTE_DARK,
    limbs: { thigh: 1.1, shin: 0.62, upper: 1.15, fore: 1.1 },
    head(mm, j) {
      const h = j.head;
      // A heavy, bull-like head: wide skull, long snout, ram horns, tusks.
      mm.ellipsoid(...at(h, 0, -1, 0), 4.8, 4.4, 4.6, BRUTE, MAT.flesh);
      mm.ellipsoid(...at(h, 0, 2.6, 2.6), 3, 2.8, 3.4, BRUTE, MAT.flesh);
      mm.ellipsoid(...at(h, 0, -2.1, 3.2), 4.2, 1.2, 1.6, BRUTE_DARK, MAT.flesh);
      for (const side of [-1, 1]) {
        const curl = [[3.4, -3.4, -0.5], [7, -5.6, -1], [9.4, -3, -1.2], [8.6, 0.6, -0.8], [6.6, 1.8, 0]].map(([dx, dy, dz]) => at(h, side * dx, dy, dz));
        for (let k = 0; k < curl.length - 1; k++) mm.capsule(...curl[k], ...curl[k + 1], 2 - k * 0.4, 1.7 - k * 0.4, RAM, MAT.bone);
        mm.capsule(...at(h, side * 4.4, 0.6, -0.8), ...at(h, side * 6.2, 2, -1.2), 1, 0.4, BRUTE, MAT.flesh); // ears
        mm.capsule(...at(h, side * 1.7, 4.6, 4.4), ...at(h, side * 2.6, 2.4, 4.8), 0.6, 0.15, C('beige', 0.85), MAT.bone); // tusks
      }
      const glow = lit ? G('green', 1) : C('olive', 0.25);
      for (const side of [-1, 1]) mm.paint(...xy(h, side * 2, -0.9), 1.1, 0.55, glow, lit ? MAT.glow : MAT.flesh);
      for (const side of [-1, 1]) mm.dot(...xy(h, side * 0.9, 2.9), C('gray', 0.04));
      mm.paint(...xy(h, 0, 4.9), 2.4, mouth ? 1.2 : 0.45, C('gray', 0.05));
    },
    clothes(mm, j) {
      // Slabs of muscle.
      for (const side of [-1, 1]) mm.stroke(...xy(j.chest, side * 0.4, -0.6), ...xy(j.chest, side * 6, 1.6), 0.7, BRUTE_DARK);
      for (let k = 0; k < 3; k++) mm.stroke(...xy(j.belly, -2.6, -2.8 + k * 2.4), ...xy(j.belly, 2.6, -2.8 + k * 2.4), 0.5, BRUTE_DARK);
      mm.stroke(...xy(j.belly, 0, -4), ...xy(j.belly, 0, 4.4), 0.5, BRUTE_DARK);
      // The collar and tie are all that's left of the suit.
      mm.stroke(...xy(j.neck, -3, 1.4), ...xy(j.neck, 3, 1.4), 0.9, C('beige', 0.85), MAT.cloth);
      mm.paint(...xy(j.neck, 0, 2.5), 1.3, 1, C('blood', 0.42), MAT.cloth);
      mm.stroke(...xy(j.neck, 0, 3.2), ...xy(j.chest, 0.4, 7), 1.8, C('blood', 0.5), MAT.cloth);
      // Bony spurs on the shoulders, shaggy fur at the hips.
      for (const n of ['L', 'R']) {
        const side = n === 'L' ? -1 : 1;
        const sh = j[`shoulder${n}`];
        mm.capsule(...at(sh, 0, -1.4, 1), ...at(sh, side * 3.4, -7, 1.2), 1.9, 0.3, RAM, MAT.bone);
        mm.capsule(...at(sh, side * 2, -0.6, 1), ...at(sh, side * 6, -4, 1), 1.5, 0.25, RAM, MAT.bone);
      }
      // Shaggy goat legs: clumps of fur down to the knees.
      mm.ellipsoid(...j.pelvis, 6.6 * 1.3, 2.4, 4.6, FUR, MAT.fur);
      for (const n of ['L', 'R']) {
        const side = n === 'L' ? -1 : 1;
        const hip = j[`hip${n}`];
        const knee = j[`knee${n}`];
        for (let k = 0; k <= 4; k++) {
          const t = k / 4;
          const p = [hip[0] + (knee[0] - hip[0]) * t, hip[1] + (knee[1] - hip[1]) * t, hip[2] + (knee[2] - hip[2]) * t];
          mm.ellipsoid(...at(p, side * (0.8 + (k % 2) * 0.9), 0.6, 0.4), 4.6 - t * 1.2, 3.4, 4.2 - t, k % 2 ? darken(FUR, 0.15) : FUR, MAT.fur);
        }
        mm.ellipsoid(...at(knee, side * 0.6, 1.6, 0.6), 3.4, 2.6, 3.2, FUR, MAT.fur);
        for (let k = -2; k <= 2; k++) mm.stroke(...xy(hip, k * 1.6, 1), ...xy(knee, k * 1.9 + side * 0.4, 3.4), 0.45, darken(FUR, 0.4));
      }
      grime(mm, 41, { amount: 0.25, region: (x, y) => y > j.neck[1] });
    },
    held(mm, j) {
      // Claws, split hooves and tufts of fur above them.
      for (const n of ['L', 'R']) {
        const hd = j[`hand${n}`];
        for (let k = -1; k <= 1; k++) mm.capsule(...at(hd, k * 1.5, 1.4, 1.4), ...at(hd, k * 2, 4.6, 2.2), 0.75, 0.15, C('beige', 0.7), MAT.bone);
        const f = j[`foot${n}`];
        mm.ellipsoid(...at(j[`ankle${n}`], 0, 0, 0.6), 3, 1.8, 3, FUR, MAT.fur);
        mm.stroke(...xy(f, 0, -1), ...xy(f, 0, 1.6), 0.5, C('gray', 0.02));
      }
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
