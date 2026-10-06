// A 3D humanoid skeleton for front-facing sprites. Joints are [x, y, z] with
// x right, y down (screen) and z toward the viewer. Bodies are rendered with
// the clay-model renderer, so limbs overlap correctly and light naturally.
import { Model, MAT, rotatePoints } from './model.js';

const rad = (d) => (d * Math.PI) / 180;
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const unit = (a) => scale(a, 1 / (len(a) || 1));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function limbDir(side, spread, swing) {
  const s = rad(spread);
  const w = rad(swing);
  return [side * Math.sin(s), Math.cos(s) * Math.cos(w), Math.cos(s) * Math.sin(w)];
}

/** Two-bone IK: elbow position for a hand at `target`, bending toward `hint`. */
function solve(shoulder, target, l1, l2, hint) {
  let d = sub(target, shoulder);
  let dist = len(d);
  if (dist > l1 + l2 - 0.01) {
    d = scale(unit(d), l1 + l2 - 0.01);
    dist = l1 + l2 - 0.01;
    target = add(shoulder, d);
  }
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const mid = add(shoulder, unit(d), a);
  const perp = unit(cross(cross(d, hint), d));
  return { elbow: add(mid, perp, h), hand: target };
}

/**
 * Compute joints for a pose.
 * pose: { bob, lean, hunch, headTilt, headLift, x,
 *         armL/armR: { spread, swing, bend, reach: [x,y,z], hint: [out,down,forward] },
 *         legL/legR: { thigh, knee, spread },
 *         fall: radians (topple sideways), crouch }
 * dims: { height: 50, build: 1, shoulders: 7.5, hips: 3.4 }
 */
export function skeleton(w, h, pose = {}, dims = {}) {
  const s = (dims.height ?? 50) / 50;
  const b = dims.build ?? 1;
  const cx = w / 2 + (pose.x ?? 0);
  const floor = h - 2;
  const L = { thigh: 11 * s, shin: 10.5 * s, upper: 8.8 * s, fore: 8.3 * s, torso: 17 * s };
  const hipW = (dims.hips ?? 3.4) * b * s;
  const shW = (dims.shoulders ?? 6.9) * b * s;
  const lean = (pose.lean ?? 0) * s;
  const J = {};

  // Legs with the hip at y = 0, then drop everything so the lower foot touches the floor.
  const legs = {};
  for (const [name, side] of [['L', -1], ['R', 1]]) {
    const lp = pose[`leg${name}`] ?? {};
    const hip = [cx + side * hipW, 0, 0];
    const knee = add(hip, limbDir(side, lp.spread ?? 4, lp.thigh ?? 0), L.thigh);
    const ankle = add(knee, limbDir(side, (lp.spread ?? 4) * 0.5, (lp.thigh ?? 0) - (lp.knee ?? 0)), L.shin);
    legs[name] = { hip, knee, ankle };
  }
  const lowest = Math.max(legs.L.ankle[1], legs.R.ankle[1]);
  const hipY = floor - 2.2 - lowest + (pose.bob ?? 0) + (pose.crouch ?? 0);
  for (const name of ['L', 'R']) {
    for (const k of ['hip', 'knee', 'ankle']) legs[name][k][1] += hipY;
    J[`hip${name}`] = legs[name].hip;
    J[`knee${name}`] = legs[name].knee;
    J[`ankle${name}`] = legs[name].ankle;
    J[`foot${name}`] = add(legs[name].ankle, [0, 1.2 * s, 1.8 * s]);
  }

  // Spine and head.
  const hunch = pose.hunch ?? 0;
  J.pelvis = [cx, hipY - 1 * s, 0];
  J.belly = [cx + lean * 0.4, hipY - 6.5 * s, 0.4 + hunch * 0.3];
  J.chest = [cx + lean * 0.7, hipY - 12 * s, 0.6 + hunch * 0.6];
  J.neck = [cx + lean, hipY - L.torso + hunch * 0.8, 0.4 + hunch];
  J.head = [J.neck[0] + (pose.headTilt ?? 0) * s, J.neck[1] - 4.8 * s - (pose.headLift ?? 0), J.neck[2] + 0.8 + hunch * 0.6];

  // Arms.
  for (const [name, side] of [['L', -1], ['R', 1]]) {
    const ap = pose[`arm${name}`] ?? {};
    const shoulder = [J.neck[0] + side * shW, J.neck[1] + 2.6 * s, J.neck[2] - 0.4];
    let elbow;
    let hand;
    if (ap.reach) {
      // `hint` says which way the elbow points (out, down, toward the viewer).
      const hint = ap.hint ? [side * ap.hint[0], ap.hint[1], ap.hint[2]] : [side, 0.8, -0.5];
      ({ elbow, hand } = solve(shoulder, ap.reach, L.upper, L.fore, hint));
    } else {
      elbow = add(shoulder, limbDir(side, ap.spread ?? 10, ap.swing ?? 0), L.upper);
      hand = add(elbow, limbDir(side, (ap.spread ?? 10) + (ap.spread2 ?? 0), (ap.swing ?? 0) + (ap.bend ?? 15)), L.fore);
    }
    J[`shoulder${name}`] = shoulder;
    J[`elbow${name}`] = elbow;
    J[`hand${name}`] = hand;
  }

  if (pose.fall) {
    // Topple sideways around the feet, then settle on the floor.
    const keys = Object.keys(J);
    const pts = rotatePoints(keys.map((k) => J[k]), -pose.fall, cx, floor);
    let maxY = -Infinity;
    for (const p of pts) maxY = Math.max(maxY, p[1]);
    const tall = 48 * s;
    const dx = Math.sin(pose.fall) * tall * 0.5;
    const dy = floor - 2.5 * s - maxY;
    keys.forEach((k, i) => {
      J[k] = [pts[i][0] + dx, pts[i][1] + Math.max(0, dy), pts[i][2]];
    });
  }
  J.s = s;
  J.b = b;
  return J;
}

/**
 * Model a humanoid from joints. style: colours/materials and optional hooks:
 *   { skin, shirt, sleeve ('short'|'long'), pants, shoes, hair, headShape: {rx, ry, rz},
 *     limbs: {thigh, shin, upper, fore} (thickness multipliers),
 *     face(m, J), clothes(m, J), held(m, J) }
 */
export function body(m, J, style = {}) {
  const s = J.s;
  const b = J.b;
  const skin = style.skin;
  const shirt = style.shirt ?? skin;
  const pants = style.pants ?? shirt;
  const skinMat = style.skinMat ?? MAT.skin;
  const shirtMat = style.shirtMat ?? MAT.cloth;
  const pantsMat = style.pantsMat ?? MAT.cloth;
  const limbs = { thigh: 1, shin: 1, upper: 1, fore: 1, ...style.limbs };

  // Legs.
  for (const n of ['L', 'R']) {
    m.capsule(...J[`hip${n}`], ...J[`knee${n}`], 3.3 * b * s * limbs.thigh, 2.7 * b * s * limbs.thigh, pants, pantsMat);
    m.capsule(...J[`knee${n}`], ...J[`ankle${n}`], 2.6 * b * s * limbs.shin, 1.9 * b * s * limbs.shin, style.shins ?? pants, pantsMat);
    const f = J[`foot${n}`];
    m.ellipsoid(f[0], f[1], f[2], 2.6 * b * s, 1.7 * s, 3.4 * s, style.shoes ?? [40, 30, 24], style.shoeMat ?? MAT.leather);
  }

  // Torso: tapered chest, belly and hips, with sloped trapezius into the shoulders.
  m.ellipsoid(...J.pelvis, 6 * b * s, 3.9 * s, 4.2 * s, pants, pantsMat);
  m.ellipsoid(...J.belly, 5.6 * b * s, 5.4 * s, 4.3 * s, shirt, shirtMat);
  m.ellipsoid(J.chest[0], J.chest[1], J.chest[2], 6.5 * b * s, 6.6 * s, 4.7 * s, shirt, shirtMat);
  for (const n of ['L', 'R']) {
    const sh = J[`shoulder${n}`];
    m.capsule(J.neck[0], J.neck[1] + 1.2 * s, J.neck[2] - 0.6, sh[0], sh[1], sh[2], 2.3 * s, 2.5 * b * s, shirt, shirtMat);
    m.sphere(sh[0], sh[1] + 0.4 * s, sh[2], 2.55 * b * s, shirt, shirtMat);
  }
  m.capsule(...J.chest, ...J.neck, 2.2 * s, 2 * s, skin, skinMat);
  style.clothes?.(m, J);

  // Head.
  const hs = style.headShape ?? { rx: 4.4, ry: 5.2, rz: 4.6 };
  const [hx, hy, hz] = J.head;
  if (style.head) style.head(m, J);
  else {
    m.ellipsoid(hx, hy, hz, hs.rx * s, hs.ry * s, hs.rz * s, skin, skinMat);
    m.ellipsoid(hx, hy + 2.6 * s, hz + 0.6, 3.1 * s, 2.3 * s, 3.4 * s, skin, skinMat); // jaw
    m.sphere(hx - 4 * s, hy + 0.3 * s, hz - 1, 1.1 * s, skin, skinMat); // ears
    m.sphere(hx + 4 * s, hy + 0.3 * s, hz - 1, 1.1 * s, skin, skinMat);
    m.ellipsoid(hx, hy + 0.6 * s, hz + 4.1 * s, 0.9 * s, 1.4 * s, 1.2 * s, skin, skinMat); // nose
    if (style.hair) {
      m.ellipsoid(hx, hy - 2.4 * s, hz - 0.2, 4.5 * s, 3.2 * s, 4.6 * s, style.hair, MAT.hair);
      m.ellipsoid(hx - 3.4 * s, hy - 0.6 * s, hz - 1.2, 1.3 * s, 2.4 * s, 2.4 * s, style.hair, MAT.hair);
      m.ellipsoid(hx + 3.4 * s, hy - 0.6 * s, hz - 1.2, 1.3 * s, 2.4 * s, 2.4 * s, style.hair, MAT.hair);
    }
    // Eye sockets.
    m.dent(hx - 1.7 * s, hy - 0.3 * s, 1.5 * s, 1.1 * s, 1.2);
    m.dent(hx + 1.7 * s, hy - 0.3 * s, 1.5 * s, 1.1 * s, 1.2);
    style.face?.(m, J);
  }

  // Arms.
  // Sleeves: 'short' (shirt on the upper arm), 'long' (shirt to the wrist) or 'none'.
  const bare = style.sleeve === 'none';
  const long = style.sleeve === 'long';
  for (const n of ['L', 'R']) {
    m.capsule(...J[`shoulder${n}`], ...J[`elbow${n}`], 2.5 * b * s * limbs.upper, 2.1 * b * s * limbs.upper, bare ? skin : shirt, bare ? skinMat : shirtMat);
    m.capsule(...J[`elbow${n}`], ...J[`hand${n}`], 2 * b * s * limbs.fore, 1.6 * b * s * limbs.fore, long ? shirt : skin, long ? shirtMat : skinMat);
    m.sphere(...J[`hand${n}`], 1.9 * b * s, style.hands ?? skin, skinMat);
  }
  style.held?.(m, J);
  return m;
}

/** Floor puddle (blood, slime): a glossy flat ellipse lying on the ground. */
export function puddle(m, cx, cy, rx, ry, col, mat = MAT.flesh) {
  m.slab(
    Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * Math.PI * 2;
      const wob = 1 + Math.sin(k * 2.7) * 0.15;
      return [cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob];
    }),
    -20,
    col,
    { ...mat, spec: 0.7, shine: 30 },
    { bevel: 1.5, thickness: 0.5, tilt: [0, -2.5] },
  );
}

export { Model, MAT };
