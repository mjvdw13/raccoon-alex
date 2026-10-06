// The monsters: software bugs that crawled out of the deadline. The
// Off-By-One Ant, the Exception Firefly, the Race Condition Roach, the
// Deadlock Beetle, the Memory Leak Mite and the Garbage Collector. (Their
// queen, the Pumpkin King, is hand-drawn in pumpkin.js.) Modelled with shaded 3D primitives (see lib/model.js) like the rest of
// the sprites, facing the viewer, seen a little from above.
import { mix, darken, lighten } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { Model, MAT } from '../lib/model.js';
import { puddle } from '../lib/rig.js';
import { sheet, flash, rotate, shift } from '../lib/sprite.js';
import { rng } from '../lib/noise.js';

const M = (name) => `assets/sprites/monsters/${name}.png`;
const RENDER = { light: [-0.5, -0.6, 0.62], ambient: 0.3, aoStrength: 0.5 };

/** Glossy chitin. */
const SHELL = { spec: 0.6, shine: 26, grain: 0.04 };
/** Wings: thin, shiny and mostly self-lit so they read as see-through. */
const WING = { spec: 0.9, shine: 40, grain: 0.02, flat: 0.35 };
/** Bug guts. */
const ICHOR = C('toxic', 0.42);

// ------------------------------------------------------------------ shared parts

/** A jointed leg: hip -> knee (raised by `rise`) -> foot, tapering, with a bump at the joint. */
function leg(m, hip, foot, col, { rise = 6, r = 1.4, mat = SHELL } = {}) {
  const knee = [hip[0] + (foot[0] - hip[0]) * 0.6, Math.min(hip[1], foot[1]) - rise, hip[2] + (foot[2] - hip[2]) * 0.6];
  m.capsule(...hip, ...knee, r, r * 0.8, col, mat);
  m.capsule(...knee, ...foot, r * 0.8, r * 0.45, col, mat);
  m.sphere(...knee, r * 0.85, col, mat);
  return knee;
}

/**
 * Pairs of legs mirrored about cx. Each row is [hipDX, hipY, hipZ, footDX, footY, footZ, rise].
 * lift[k] raises leg k (left, right, left, right... front to back) off the floor.
 */
function legPairs(m, cx, rows, col, { lift = [], r = 1.4 } = {}) {
  rows.forEach(([hx, hy, hz, fx, fy, fz, rise = 6], i) => {
    [-1, 1].forEach((side, j) => {
      const l = lift[i * 2 + j] ?? 0;
      leg(m, [cx + side * hx, hy, hz], [cx + side * fx, fy - l, fz + l * 0.6], col, { rise: rise + l * 0.5, r });
    });
  });
}

/** Six-legged tripod gait: front-left, middle-right and back-left move together. */
const TRIPOD = (a, b) => [a, b, b, a, a, b];
const GAIT = (h) => [TRIPOD(h, 0), TRIPOD(0, 0), TRIPOD(0, h), TRIPOD(0, 0)];

/** A thin feeler through a list of points, tapering toward the tip. */
function feeler(m, pts, r, col, mat = SHELL) {
  for (let k = 0; k + 1 < pts.length; k++) {
    const t0 = k / (pts.length - 1);
    const t1 = (k + 1) / (pts.length - 1);
    m.capsule(...pts[k], ...pts[k + 1], r * (1 - t0 * 0.55), r * (1 - t1 * 0.55), col, mat);
  }
}

/**
 * A dead bug on its back: pale belly up, legs curled in the air, lying in ichor.
 * o: { cx, floor, segs: [[dz, rx, ry, rz]...] back to front, shell, belly, legs: pairs, reach, spread, curl, r, pool }
 */
function onBack(m, o) {
  const { cx, floor, shell, belly } = o;
  if (o.pool) puddle(m, cx, floor - 1, o.poolW + o.pool * 4, 2 + o.pool, ICHOR, { spec: 0.6, shine: 30, grain: 0.02 });
  let top = floor;
  for (const [dz, rx, ry, rz] of o.segs) {
    m.ellipsoid(cx, floor - ry, dz, rx, ry, rz, shell, SHELL);
    m.paint(cx, floor - ry * 1.3, rx * 0.8, ry * 0.6, belly, SHELL);
    top = Math.min(top, floor - ry * 1.8);
  }
  const pairs = o.legs ?? 3;
  for (let i = 0; i < pairs; i++) {
    const z = (pairs > 1 ? i / (pairs - 1) - 0.5 : 0) * (o.legZ ?? 8);
    for (const side of [-1, 1]) {
      const curl = (o.curl ?? 0.3) + ((i + (side > 0 ? 1 : 0)) % 2) * 0.15;
      const hip = [cx + side * (o.spread ?? 3), top + 2, z];
      const knee = [cx + side * ((o.spread ?? 3) + o.reach * 0.6 + i), top - o.reach * (0.7 - i * 0.08), z + 1];
      const foot = [knee[0] - side * o.reach * curl, knee[1] - o.reach * 0.35 + curl * 2, z + 2];
      m.capsule(...hip, ...knee, o.r ?? 1.2, (o.r ?? 1.2) * 0.8, shell, SHELL);
      m.capsule(...knee, ...foot, (o.r ?? 1.2) * 0.8, (o.r ?? 1.2) * 0.45, shell, SHELL);
    }
  }
}

/** Render a model and tip it over sideways, still centred and resting on the floor. */
function tipped(model, w, h, angle) {
  const c = rotate(model.render(RENDER), angle, w / 2, h / 2);
  let x0 = w;
  let x1 = 0;
  let y1 = 0;
  c.eachOpaque((x, y) => {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
    return undefined;
  });
  return shift(c, Math.round(w / 2 - (x0 + x1) / 2), h - 2 - y1);
}

/** Drops of ichor flying off a hurt bug. */
function splatter(c, x, y, seed, n = 6) {
  const r = rng(seed);
  for (let k = 0; k < n; k++) c.set(x + r.range(-5, 5), y + r.range(-4, 3), r.chance(0.4) ? C('toxic', 0.6) : ICHOR);
}

// ------------------------------------------------------------------ off-by-one ant
// A worker ant the size of a dog. It spits acid, and it hoards staples.

const ANT = C('rust', 0.16);
const ANT_HI = C('rust', 0.28);
const ANT_BELLY = C('rust', 0.42);

function antModel(m, o = {}) {
  const cx = 32 + (o.lean ?? 0);
  const b = o.bob ?? 0;
  // The gaster, raised behind it, banded.
  m.ellipsoid(cx, 28 + b, -10, 9, 8.5, 8, ANT, SHELL);
  for (const y of [23, 28, 33]) m.stroke(cx - 9, y + b, cx + 9, y + b + 1, 0.9, darken(ANT, 0.5));
  m.sphere(cx, 35 + b, -3, 2.6, ANT, SHELL);
  m.ellipsoid(cx, 39 + b, 1, 5.5, 4.8, 6, ANT_HI, SHELL);
  legPairs(
    m,
    cx,
    [
      [3, 41 + b, 5, 12, 61, 9, 6],
      [4, 41 + b, 1, 18, 60, 1, 8],
      [3.5, 40 + b, -3, 15, 57, -9, 7],
    ],
    ANT,
    { lift: o.lift, r: 1.8 },
  );
  // Head, eyes, feelers and mandibles.
  const hy = 43 + b - (o.head ?? 0);
  m.ellipsoid(cx, hy, 9, 10, 8.5, 7, ANT_HI, SHELL);
  for (const s of [-1, 1]) {
    m.ellipsoid(cx + s * 7.3, hy - 1.5, 13, 2.6, 3, 2.2, C('gray', 0.06), MAT.eye);
    if (!o.dazed) m.paint(cx + s * 7.5, hy - 2, 0.9, 0.9, G('red', 1), MAT.glow);
    const w = (o.wiggle ?? 0) * s;
    feeler(m, [[cx + s * 3, hy - 6, 14], [cx + s * 7, hy - 15, 15], [cx + s * 13 + w, hy - 21 - Math.abs(w), 13]], 1.2, ANT_BELLY);
  }
  const open = o.open ?? 0;
  for (const s of [-1, 1]) m.capsule(cx + s * 4, hy + 5, 15, cx + s * (1 + open * 4), hy + 11 + open, 17, 2, 0.9, ANT_BELLY, SHELL);
  if (open > 0.5) m.paint(cx, hy + 7, 2.4, 1.6, C('toxic', 0.55));
}

function antFrame(o = {}) {
  const m = new Model(64, 64, { seed: 11 });
  antModel(m, o);
  const c = m.render(RENDER);
  if (o.spit) {
    flash(c, 32, 55, 6.5, G('green', 1), G('green', 0.45), 3);
    const r = rng(5);
    for (let k = 0; k < 10; k++) c.set(32 + r.range(-6, 6), 58 + r.range(0, 5), G('green', r.chance(0.5) ? 1 : 0.6));
  }
  if (o.hurt) splatter(c, 30, 40, 13);
  return c;
}

function antDead(pool) {
  const m = new Model(64, 64, { seed: 12 });
  onBack(m, { cx: 32, floor: 62, shell: ANT, belly: ANT_BELLY, segs: [[-9, 9, 6, 8], [0, 5, 4.5, 5], [7, 7, 5, 5]], reach: 9, spread: 3, curl: pool ? 0.55 : 0.35, pool, poolW: 12 });
  return m.render(RENDER);
}

function antSheet() {
  const frames = GAIT(3).map((lift, k) => antFrame({ lift, bob: k % 2 ? -1 : 0, wiggle: [0, 1.5, 0, -1.5][k] }));
  frames.push(antFrame({ head: 2, open: 0.6, bob: -1 }));
  frames.push(antFrame({ head: 2.5, open: 1, bob: -1, spit: true }));
  frames.push(antFrame({ head: -1, lean: -2, open: 0.3, wiggle: 3, hurt: true }));
  const recoil = { head: -2, lean: -3, open: 0.8, wiggle: 4, lift: TRIPOD(3, 2), hurt: true };
  frames.push(antFrame(recoil));
  const m = new Model(64, 64, { seed: 11 });
  antModel(m, { ...recoil, dazed: true });
  frames.push(tipped(m, 64, 64, -1.2));
  frames.push(antDead(0), antDead(1), antDead(2));
  return sheet(frames);
}

// ------------------------------------------------------------------ exception firefly
// Hovers about at head height and throws exceptions: burning ones, from its lantern.

const FLY = C('gray', 0.1);
const FLY_SHIELD = C('orange', 0.5);

function fireflyModel(m, o = {}) {
  const cx = 32 + (o.lean ?? 0);
  const y = 21 + (o.bob ?? 0);
  const flap = o.flap ?? 0.5; // 0 = wings up, 1 = wings down
  // Hind wings, glassy and veined, behind everything.
  for (const s of [-1, 1]) {
    const tx = cx + s * (25 - flap * 5);
    const ty = y - 13 + flap * 17;
    m.slab([[cx + s * 3, y - 3], [tx, ty - 5], [tx + s * 2, ty + 2], [cx + s * 6, y + 5]], -12, C('steel', 0.78), WING, { bevel: 1.5, thickness: 1 });
    m.stroke(cx + s * 4, y, tx, ty - 1.5, 0.6, C('steel', 0.45));
    m.stroke(cx + s * 5, y + 3, tx - s * 4, ty + 1, 0.5, C('steel', 0.5));
  }
  // Wing cases, lifted for flight: black with a pale edge.
  for (const s of [-1, 1]) {
    const ex = cx + s * (12 - flap * 3);
    const ey = y + 5 - flap * 4;
    m.capsule(cx + s * 3, y - 3, -2, ex, ey, -6, 4.2, 3, FLY, SHELL);
    m.stroke(cx + s * 5.5, y - 5, ex + s * 2.4, ey - 1, 0.8, C('yellow', 0.62));
  }
  // The abdomen hangs below, ending in its lantern.
  const lit = o.lantern ?? 0.6;
  m.ellipsoid(cx, y + 13, 2, 6, 9, 5, FLY, SHELL);
  m.stroke(cx - 6, y + 9, cx + 6, y + 9, 0.8, darken(FLY, 0.6));
  if (lit > 0) {
    m.paint(cx, y + 17, 5.8, 5, G('green', lit > 0.7 ? 1 : 0.7), MAT.glow);
    m.paint(cx, y + 17.5, 3.6 + lit, 3.2 + lit, G('pale', 1), MAT.glow);
  } else {
    m.paint(cx, y + 17, 5.8, 5, C('yellow', 0.38));
  }
  // Dangling legs.
  for (let i = 0; i < 3; i++) {
    for (const s of [-1, 1]) {
      const sw = (o.swing ?? 0) * s;
      const hip = [cx + s * 2.5, y + 4, 6 - i * 2];
      const knee = [cx + s * (7 + i * 2) + sw, y + 8 + i, 6 - i * 2];
      const foot = [cx + s * (5 + i * 2.5) + sw * 1.5, y + 14 + i * 2.5, 7 - i * 2];
      m.capsule(...hip, ...knee, 0.9, 0.7, FLY, SHELL);
      m.capsule(...knee, ...foot, 0.7, 0.45, FLY, SHELL);
    }
  }
  // Shield over the head: orange with a black spot and two red ones.
  m.ellipsoid(cx, y - 1, 8, 7.5, 5.5, 4, FLY_SHIELD, SHELL);
  m.paint(cx, y - 1.5, 2.6, 2.2, C('gray', 0.08));
  for (const s of [-1, 1]) m.paint(cx + s * 4.2, y - 0.5, 1.4, 1.2, C('blood', 0.5));
  // Head, big eyes, saw-toothed feelers.
  const hy = y + 4.5;
  m.ellipsoid(cx, hy, 10, 4.5, 3.5, 3, FLY, SHELL);
  for (const s of [-1, 1]) {
    m.ellipsoid(cx + s * 3.4, hy - 0.3, 12, 2.2, 2.4, 1.8, C('gray', 0.05), MAT.eye);
    if (!o.dazed) m.paint(cx + s * 3.6, hy - 0.8, 0.7, 0.7, G('yellow', 0.8), MAT.glow);
    const tw = (o.twitch ?? 0) * s;
    feeler(m, [[cx + s * 1.5, hy - 2, 13], [cx + s * 6, hy - 10, 12], [cx + s * 9 + tw, hy - 17, 10], [cx + s * 13 + tw, hy - 21, 8]], 0.9, FLY);
  }
}

function fireflyFrame(o = {}) {
  const m = new Model(64, 64, { seed: 21 });
  fireflyModel(m, o);
  const c = m.render(RENDER);
  if (o.charge) flash(c, 32 + (o.lean ?? 0), 38 + (o.bob ?? 0), o.charge, G('yellow', 0.8), G('yellow', 0.3), 9);
  if (o.hurt) splatter(c, 32, 30, 23);
  return c;
}

function fireflyDead(pool) {
  const m = new Model(64, 64, { seed: 22 });
  onBack(m, { cx: 32, floor: 62, shell: FLY, belly: C('yellow', 0.4), segs: [[-6, 9, 4.5, 7], [3, 7, 4, 5]], reach: 7, spread: 2.5, r: 0.9, curl: 0.5, pool, poolW: 10 });
  // Crumpled wings either side.
  for (const s of [-1, 1]) m.slab([[32 + s * 6, 56], [32 + s * 22, 55], [32 + s * 20, 60], [32 + s * 7, 60]], -8, C('steel', 0.7), WING, { bevel: 1, thickness: 0.5 });
  const c = m.render(RENDER);
  if (pool) c.ellipse(32, 60, 3, 1.4, G('green', pool > 1 ? 0.35 : 0.7)); // the lantern still glows a little
  return c;
}

function fireflySheet() {
  const flaps = [0, 0.5, 1, 0.5];
  const frames = flaps.map((flap, k) => fireflyFrame({ flap, bob: [0, -1, -2, -1][k], swing: [1, 0, -1, 0][k], twitch: [0, 1, 0, -1][k] }));
  frames.push(fireflyFrame({ flap: 0.2, lantern: 1, bob: -2 }));
  frames.push(fireflyFrame({ flap: 0, lantern: 1, bob: -3, charge: 5 }));
  frames.push(fireflyFrame({ flap: 1, lantern: 1, bob: 0, lean: 1, charge: 9 }));
  frames.push(fireflyFrame({ flap: 0.8, lantern: 0.4, lean: -3, twitch: 3, hurt: true }));
  frames.push(fireflyFrame({ flap: 0.3, lantern: 0.2, lean: -3, bob: 3, twitch: 3, hurt: true, dazed: true }));
  const m = new Model(64, 64, { seed: 21 });
  fireflyModel(m, { flap: 1, lantern: 0, dazed: true });
  frames.push(shift(rotate(m.render(RENDER), 0.9, 32, 30), 0, 16));
  frames.push(fireflyDead(0), fireflyDead(1), fireflyDead(2));
  return sheet(frames);
}

// ------------------------------------------------------------------ race condition roach
// Fast, flat and glossy, and always gets there first. All bite.

const ROACH = C('rust', 0.34);
const ROACH_DARK = C('rust', 0.2);
const ROACH_RIM = C('orange', 0.68);

function roachModel(m, o = {}) {
  const cx = 32 + (o.lean ?? 0);
  const b = o.bob ?? 0;
  const rear = o.rear ?? 0; // rearing up to bite
  // Wings folded over the abdomen, behind.
  m.ellipsoid(cx, 34 + b + rear * 2, -10, 14, 11, 9, ROACH_DARK, SHELL);
  m.stroke(cx, 24 + b + rear * 2, cx, 44 + b, 0.8, darken(ROACH_DARK, 0.5));
  legPairs(
    m,
    cx,
    [
      [5, 47 + b - rear * 5, 6, 19 + rear * 3, 61 - rear * 6, 10, 8],
      [7, 45 + b - rear * 2, 0, 27, 60, 0, 12],
      [6, 42 + b, -6, 24, 55, -12, 10],
    ],
    ROACH_DARK,
    { lift: o.lift, r: 1.6 },
  );
  // The shield over its head, with a pale rim and two dark blotches.
  const sy = 43 + b - rear * 6;
  m.ellipsoid(cx, sy, 4, 14, 8.5, 7, ROACH, SHELL);
  m.paint(cx, sy, 14, 8.5, ROACH_RIM);
  m.paint(cx, sy + 0.5, 11.8, 6.6, ROACH);
  for (const s of [-1, 1]) m.paint(cx + s * 4.2, sy - 0.5, 3, 2.6, ROACH_DARK);
  // Head peeking out from under it.
  const hy = 50 + b - rear * 9;
  m.ellipsoid(cx, hy, 10, 6, 4.5, 4, ROACH_DARK, SHELL);
  for (const s of [-1, 1]) {
    m.ellipsoid(cx + s * 4.3, hy - 1, 12, 1.6, 2.2, 1.2, C('gray', 0.05), MAT.eye);
    if (!o.dazed) m.paint(cx + s * 4.4, hy - 1.4, 0.7, 0.7, G('red', 1), MAT.glow);
    m.capsule(cx + s * 2, hy + 3, 13, cx + s * (4 + rear), hy + 7.5, 14, 0.8, 0.5, ROACH_DARK, SHELL);
    const tw = (o.twitch ?? 0) * s;
    feeler(m, [[cx + s * 2, hy - 3, 13], [cx + s * 9, hy - 19, 12], [cx + s * 17 + tw, 13 + b, 8], [cx + s * 25 + tw * 1.5, 4 + b, 4]], 0.85, ROACH_DARK);
  }
  if (o.bite) {
    m.dent(cx, hy + 3, 2.6, 1.8 + o.bite, 1.4);
    m.paint(cx, hy + 3, 2.4, 1.6 + o.bite, C('blood', 0.2));
    for (const s of [-1, 1]) m.capsule(cx + s * 3, hy + 2, 13, cx + s * (1 - o.bite), hy + 5 + o.bite * 2, 14.5, 1.2, 0.6, darken(ROACH_DARK, 0.4), SHELL);
  }
}

function roachFrame(o = {}) {
  const m = new Model(64, 64, { seed: 31 });
  roachModel(m, o);
  const c = m.render(RENDER);
  if (o.hurt) splatter(c, 30, 42, 33);
  return c;
}

function roachDead(pool, kick = 0) {
  const m = new Model(64, 64, { seed: 32 });
  onBack(m, { cx: 32, floor: 62, shell: ROACH_DARK, belly: C('rust', 0.5), segs: [[-6, 13, 6, 9], [4, 11, 5, 6]], reach: 10 + kick, spread: 5, curl: 0.3 + kick * 0.05, r: 1.3, pool, poolW: 15 });
  return m.render(RENDER);
}

function roachSheet() {
  const frames = GAIT(3).map((lift, k) => roachFrame({ lift, bob: k % 2 ? -1 : 0, twitch: [0, 2, 0, -2][k] }));
  frames.push(roachFrame({ rear: 0.6, bite: 0.4, bob: -1 }));
  frames.push(roachFrame({ rear: 1, bite: 1.2, bob: -2, twitch: 3 }));
  frames.push(roachFrame({ rear: 0.3, bite: 0.2 }));
  frames.push(roachFrame({ lean: -3, twitch: -4, hurt: true, lift: TRIPOD(2, 2) }));
  const m = new Model(64, 64, { seed: 31 });
  roachModel(m, { lean: -2, twitch: 4, dazed: true, bite: 0.8 });
  frames.push(tipped(m, 64, 64, -1.3));
  frames.push(roachDead(0, 3), roachDead(0, -2), roachDead(1), roachDead(2, -1));
  return sheet(frames);
}

// ------------------------------------------------------------------ deadlock beetle
// A stag beetle the size of a desk. Its mandibles cross and lock, and it spits
// glowing acid through the gap.

const STAG = mix(C('purple', 0.22), C('navy', 0.7), 0.45);
const STAG_HI = mix(C('purple', 0.36), C('steel', 0.4), 0.3);
const JAW = C('rust', 0.3);

function beetleModel(m, o = {}) {
  const cx = 40 + (o.lean ?? 0);
  const b = o.bob ?? 0;
  // Domed wing cases behind, mostly hidden by the raised head.
  m.ellipsoid(cx, 46 + b, -16, 18, 12, 12, STAG, SHELL);
  m.stroke(cx, 34 + b, cx, 58 + b, 0.9, darken(STAG, 0.5));
  for (const s of [-1, 1]) m.stroke(cx + s * 8, 36 + b, cx + s * 10, 54 + b, 0.6, lighten(STAG, 0.12));
  legPairs(
    m,
    cx,
    [
      [7, 56 + b, 6, 20, 77, 12, 6],
      [10, 53 + b, -2, 27, 76, -2, 9],
      [9, 48 + b, -10, 24, 70, -16, 8],
    ],
    STAG,
    { lift: o.lift, r: 3 },
  );
  m.ellipsoid(cx, 54 + b, -2, 15, 9, 9, STAG_HI, SHELL);
  // Wide head, reared up, with little glowing eyes on the corners.
  const hy = 47 + b - (o.head ?? 0);
  m.ellipsoid(cx, hy, 10, 13, 7, 7, STAG_HI, SHELL);
  for (const s of [-1, 1]) {
    m.ellipsoid(cx + s * 11.5, hy - 1, 11, 2.6, 2.4, 2, C('gray', 0.06), MAT.eye);
    if (!o.dazed) m.paint(cx + s * 11.7, hy - 1.4, 1.1, 1, G('green', 1), MAT.glow);
    feeler(m, [[cx + s * 7, hy - 3, 13], [cx + s * 13, hy - 9, 14], [cx + s * 17, hy - 8, 13]], 0.9, STAG);
  }
  // The mandibles: up from the front corners of the head like antlers, crossing at the top.
  const open = o.open ?? 0;
  for (const s of [-1, 1]) {
    if (o.broken && s > 0) continue;
    const pts = [
      [cx + s * 8, hy - 1, 16],
      [cx + s * (18 + open * 5), hy - 12, 18],
      [cx + s * (17 + open * 8), hy - 26, 19],
      [cx - s * (3 - open * 14), hy - 33 - open * 2, 19 + s * 1.5],
    ];
    feeler(m, pts, 3.6, JAW);
    for (let k = 0; k < 3; k++) {
      const p = pts[1].map((v, i) => v + (pts[2][i] - v) * (k / 3));
      m.sphere(p[0] - s * 3, p[1], p[2], 1.2, lighten(JAW, 0.2), SHELL);
    }
  }
  if (o.glow) {
    m.dent(cx, hy + 3, 4.5, 2.4, 1.4);
    m.paint(cx, hy + 3, 4.2, 2.2, G('green', o.glow > 1 ? 1 : 0.7), MAT.glow);
  }
}

function beetleFrame(o = {}) {
  const m = new Model(80, 80, { seed: 41 });
  beetleModel(m, o);
  const c = m.render(RENDER);
  if (o.spit) flash(c, 40 + (o.lean ?? 0), 58 + (o.bob ?? 0) - (o.head ?? 0), o.spit, G('green', 1), G('green', 0.45), 4);
  if (o.hurt) splatter(c, 40, 50, 43, 9);
  return c;
}

function beetleDead(pool) {
  const m = new Model(80, 80, { seed: 42 });
  onBack(m, { cx: 40, floor: 78, shell: STAG, belly: STAG_HI, segs: [[-8, 17, 8, 12], [6, 13, 6.5, 7]], reach: 14, spread: 6, r: 2, curl: 0.4 + pool * 0.1, pool, poolW: 20, legZ: 12 });
  // A snapped-off mandible on the floor.
  m.capsule(18, 75, 6, 27, 71, 8, 2.6, 1.2, JAW, SHELL);
  return m.render(RENDER);
}

function beetleSheet() {
  const frames = GAIT(3).map((lift, k) => beetleFrame({ lift, bob: k % 2 ? 1 : 0, lean: [-1, 0, 1, 0][k] }));
  frames.push(beetleFrame({ open: 0.6, head: 2, glow: 1 }));
  frames.push(beetleFrame({ open: 1, head: 3, glow: 2, spit: 5 }));
  frames.push(beetleFrame({ open: 0.8, head: 1, glow: 2, spit: 10, lean: 1 }));
  frames.push(beetleFrame({ open: 0.4, head: -2, lean: -3, hurt: true, lift: TRIPOD(3, 0) }));
  const recoil = { open: 1, head: -3, lean: -4, hurt: true, lift: TRIPOD(4, 2) };
  frames.push(beetleFrame(recoil));
  frames.push(beetleFrame({ ...recoil, broken: true, dazed: true, bob: 2 }));
  const m = new Model(80, 80, { seed: 41 });
  beetleModel(m, { ...recoil, broken: true, dazed: true });
  frames.push(tipped(m, 80, 80, -1.15));
  frames.push(beetleDead(0), beetleDead(1), beetleDead(2));
  return sheet(frames);
}

// ------------------------------------------------------------------ memory leak mite
// Small, swollen and quick, and there are always more of them.

const MITE = mix(C('purple', 0.42), C('flesh', 0.42), 0.5);
const MITE_DARK = darken(MITE, 0.45);

function miteModel(m, o = {}) {
  const cx = 24;
  const b = o.bob ?? 0;
  // Eight short legs.
  for (let i = 0; i < 4; i++) {
    for (const [j, s] of [[0, -1], [1, 1]]) {
      const l = o.lift?.[i * 2 + j] ?? 0;
      leg(m, [cx + s * 6, 20 + b, 4 - i * 3], [cx + s * (11 + i * 3 - (i > 1 ? (i - 1) * 2.5 : 0)), 30 - l - (i > 2 ? 2 : 0), 6 - i * 4], MITE_DARK, { rise: 4 + l * 0.4, r: 0.9 });
    }
  }
  // The swollen body, with pale spots like rows of leaked memory.
  const swell = o.swell ?? 1;
  m.ellipsoid(cx, 16 + b, -1, 10.5 * swell, 9 * swell, 9, MITE, SHELL);
  m.paint(cx, 10.5 + b, 6, 3.5, MITE_DARK);
  for (let r = 0; r < 2; r++) for (let k = -1; k <= 1; k++) m.paint(cx + k * 4.5, 16 + r * 4 + b, 0.9, 0.9, C('beige', 0.7));
  // Tiny head with glowing eyes and fangs.
  m.ellipsoid(cx, 22.5 + b, 8, 3.6, 2.6, 3, MITE_DARK, SHELL);
  if (!o.dazed) for (const s of [-1, 1]) m.paint(cx + s * 1.8, 21.5 + b, 0.6, 0.6, G('red', 1), MAT.glow);
  const open = o.bite ?? 0;
  for (const s of [-1, 1]) m.capsule(cx + s * 1.2, 24 + b, 10, cx + s * (0.8 + open * 1.5), 26.5 + b + open, 11, 0.8, 0.4, C('gray', 0.1), SHELL);
}

function miteFrame(o = {}) {
  const m = new Model(48, 32, { seed: 61 });
  miteModel(m, o);
  const c = m.render(RENDER);
  if (o.hurt) splatter(c, 24, 14, 63, 4);
  return c;
}

function miteDead(pool) {
  const m = new Model(48, 32, { seed: 62 });
  onBack(m, { cx: 24, floor: 30, shell: MITE_DARK, belly: MITE, segs: [[0, 9 - pool * 1.5, 5 - pool, 7]], legs: 4, reach: 5, spread: 3, r: 0.8, curl: 0.5, pool, poolW: 9, legZ: 6 });
  return m.render(RENDER);
}

function miteSheet() {
  const lift = (a, b) => [a, b, b, a, a, b, b, a];
  return sheet([
    miteFrame({ lift: lift(2, 0) }),
    miteFrame({ bob: -1 }),
    miteFrame({ lift: lift(0, 2) }),
    miteFrame({ bob: -2, bite: 1, lift: lift(1, 1) }),
    miteFrame({ bob: 1, bite: 0.4 }),
    miteFrame({ bob: 0, swell: 1.08, hurt: true }),
    shift(rotate(miteFrame({ dazed: true, bite: 1 }), 1.1, 24, 30), 2, 2),
    miteDead(0),
    miteDead(1),
    miteDead(2),
  ]);
}

// ------------------------------------------------------------------ garbage collector
// A dung beetle that rolls the office's garbage into a ball and throws it at you.

const DUNG = mix(C('gray', 0.12), C('toxic', 0.18), 0.3);
const DUNG_HI = mix(C('gray', 0.2), C('teal', 0.3), 0.3);
const BAG = C('olive', 0.13);
const BAG2 = C('gray', 0.13);

/** A ball of garbage: bags, paper, cans and peel, turned by `roll`. */
function garbageBall(m, x, y, z, r, roll = 0, seed = 1) {
  m.ellipsoid(x, y, z, r, r * 0.95, r * 0.8, C('olive', 0.22), MAT.bag);
  const rr = rng(seed);
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2 * 2.3 + roll;
    const d = r * rr.range(0.35, 0.75);
    const px = x + Math.cos(a) * d;
    const py = y + Math.sin(a) * d * 0.95;
    const pz = z + r * 0.8 * Math.sqrt(Math.max(0, 1 - (d / r) ** 2));
    const kind = k % 5;
    if (kind === 0) m.sphere(px, py, pz - 1, r * 0.3, k % 2 ? C('olive', 0.32) : C('teal', 0.3), MAT.bag);
    else if (kind === 1) m.slab([[px - r * 0.24, py - r * 0.16], [px + r * 0.24, py - r * 0.2], [px + r * 0.26, py + r * 0.16], [px - r * 0.22, py + r * 0.18]], pz + 0.5, k % 2 ? C('beige', 0.75) : C('gray', 0.8), MAT.paper, { bevel: 0.6 });
    else if (kind === 2) m.capsule(px - r * 0.17, py, pz, px + r * 0.17, py - r * 0.08, pz, r * 0.14, r * 0.14, k % 2 ? C('steel', 0.6) : C('blood', 0.55), MAT.metal);
    else if (kind === 3) m.capsule(px, py, pz, px + r * 0.2, py - r * 0.22, pz, r * 0.1, r * 0.06, C('yellow', 0.72), MAT.flesh);
    else m.capsule(px, py - r * 0.15, pz, px, py + r * 0.15, pz, r * 0.11, r * 0.11, C('toxic', 0.5), MAT.glass);
  }
}

function collectorModel(m, o = {}) {
  const cx = 40 + (o.lean ?? 0);
  const b = o.bob ?? 0;
  // The great ball of garbage it rolls around, behind it.
  if (!o.noBall) garbageBall(m, cx + (o.ballX ?? 0), 27 + b, -24, 15, o.roll ?? 0, 7);
  // Wing cases and shield, glossy black with a green sheen.
  m.ellipsoid(cx, 48 + b, -6, 19, 13, 11, DUNG, SHELL);
  m.stroke(cx, 36 + b, cx, 60 + b, 0.9, darken(DUNG, 0.6));
  const reach = o.reach; // front legs lifted to hold something: [x, y, z]
  legPairs(
    m,
    cx,
    [
      reach ? null : [8, 63 + b, 6, 21, 78, 10, 6],
      [11, 61 + b, -2, 29, 77, -4, 10],
      [10, 57 + b, -8, 26, 72, -14, 9],
    ].filter(Boolean),
    DUNG,
    { lift: reach ? (o.lift ?? []).slice(2) : o.lift, r: 3 },
  );
  m.ellipsoid(cx, 58 + b, 2, 16, 9, 9, DUNG_HI, SHELL);
  // Trash stuck to its shell.
  m.capsule(cx - 10, 52 + b, 9, cx - 5, 50 + b, 10, 0.9, 0.6, C('yellow', 0.72), MAT.flesh);
  m.slab([[cx + 5, 50 + b], [cx + 11, 49 + b], [cx + 11, 53 + b], [cx + 5, 54 + b]], 9, C('beige', 0.65), MAT.paper, { bevel: 0.6 });
  // Rounded head with a toothed shovel of a lip, a stubby horn and clubbed feelers.
  const hy = 64 + b - (o.head ?? 0);
  m.ellipsoid(cx, hy, 10, 11, 6, 6, DUNG_HI, SHELL);
  const teeth = [];
  for (let k = 0; k <= 6; k++) teeth.push([cx - 9 + k * 3, hy + 7 + (k % 2 ? 1.6 : 0)]);
  m.slab([[cx - 10, hy + 2], [cx + 10, hy + 2], ...teeth.reverse()], 15, DUNG, SHELL, { bevel: 2, thickness: 1.5, tilt: [0, 0.6] });
  m.capsule(cx, hy - 3, 15, cx, hy - 13, 14, 2.6, 0.9, DUNG_HI, SHELL);
  for (const s of [-1, 1]) {
    m.ellipsoid(cx + s * 8.5, hy - 1.5, 14, 2, 1.8, 1.2, C('gray', 0.06), MAT.eye);
    if (!o.dazed) m.paint(cx + s * 8.7, hy - 1.8, 0.9, 0.9, G('green', 0.9), MAT.glow);
    feeler(m, [[cx + s * 6, hy + 1, 15], [cx + s * 13, hy - 1, 15]], 0.9, C('rust', 0.3));
    m.ellipsoid(cx + s * 14.5, hy - 1.5, 15, 1.8, 1.4, 1.2, C('rust', 0.4), SHELL);
  }
  if (reach) {
    for (const s of [-1, 1]) leg(m, [cx + s * 8, 63 + b, 6], [reach[0] + s * 7, reach[1] + 3, reach[2]], DUNG, { rise: 2, r: 3 });
    garbageBall(m, reach[0], reach[1], reach[2], 7, 0.6, 9);
  }
}

function collectorFrame(o = {}) {
  const m = new Model(80, 80, { seed: 71 });
  collectorModel(m, o);
  const c = m.render(RENDER);
  if (o.hurt) splatter(c, 40, 52, 73, 8);
  return c;
}

/** What's left: the ball burst into a heap, with the beetle on its back in it. */
function heapFrame(h, flies, seed, beetle) {
  const m = new Model(80, 80, { seed: 73 });
  const r = rng(seed);
  for (let k = 0; k < 9; k++) {
    m.ellipsoid(r.int(14, 66), 78 - r.int(3, 6 + h), r.range(-8, -2), r.range(5, 9), r.range(3, 4 + h * 0.6), r.range(4, 6), r.chance(0.5) ? BAG : BAG2, MAT.bag);
  }
  m.ellipsoid(24, 72, -1, 5, 4, 4, C('steel', 0.5), MAT.metal);
  m.slab([[54, 72], [60, 71], [60, 74], [54, 75]], 0, C('beige', 0.6), MAT.paper, { tilt: [0, -1] });
  if (beetle) onBack(m, { cx: 40, floor: 77, shell: DUNG, belly: DUNG_HI, segs: [[-4, 14, 7, 10], [6, 11, 5, 6]], reach: 11, spread: 5, r: 2, curl: 0.45, pool: beetle, poolW: 16, legZ: 10 });
  const c = m.render(RENDER);
  for (let k = 0; k < flies; k++) c.set(r.int(20, 60), r.int(46, 64), C('gray', 0.05));
  return c;
}

function collectorSheet() {
  const frames = GAIT(3).map((lift, k) => collectorFrame({ lift, bob: k % 2 ? 1 : 0, lean: [-1, 0, 1, 0][k], roll: k * 0.35 }));
  frames.push(collectorFrame({ reach: [56, 44, 10], ballX: -2, head: 1 }));
  frames.push(collectorFrame({ reach: [40, 16, 4], head: 3, bob: -1 }));
  frames.push(collectorFrame({ head: -1, lean: 2, bob: 1, lift: TRIPOD(0, 3) }));
  frames.push(collectorFrame({ head: -3, lean: -3, hurt: true, roll: 1 }));
  frames.push(collectorFrame({ head: -4, lean: -4, hurt: true, dazed: true, lift: TRIPOD(4, 2), roll: 1.4 }));
  const m = new Model(80, 80, { seed: 71 });
  collectorModel(m, { head: -4, dazed: true, noBall: true });
  const fall = tipped(m, 80, 80, -1.1);
  const behind = new Model(80, 80, { seed: 72 });
  garbageBall(behind, 44, 52, -20, 17, 1.8, 7);
  const ball = behind.render(RENDER);
  ball.blit(fall, 0, 0);
  frames.push(ball);
  frames.push(heapFrame(10, 0, 81, 1), heapFrame(7, 2, 82, 1), heapFrame(5, 4, 83, 2), heapFrame(4, 6, 84, 2));
  return sheet(frames);
}

export default [
  { name: 'ant', out: M('ant'), draw: antSheet, dither: 'fs' },
  { name: 'firefly', out: M('firefly'), draw: fireflySheet, dither: 'fs' },
  { name: 'roach', out: M('roach'), draw: roachSheet, dither: 'fs' },
  { name: 'beetle', out: M('beetle'), draw: beetleSheet, dither: 'fs' },
  { name: 'mite', out: M('mite'), draw: miteSheet, dither: 'fs' },
  { name: 'garbage-collector', out: M('garbage-collector'), draw: collectorSheet, dither: 'fs' },
];

