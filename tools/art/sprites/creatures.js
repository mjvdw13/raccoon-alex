// Non-human monsters, modelled and lit like the humanoids: the Alarm Clock,
// the Sewer Rat, the Garbage Golem and the Alarm King.
import { PixelCanvas, mix, darken, lighten } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { Model, MAT, rotatePoints } from '../lib/model.js';
import { puddle } from '../lib/rig.js';
import { sheet, flash } from '../lib/sprite.js';
import { rng } from '../lib/noise.js';

const M = (name) => `assets/sprites/monsters/${name}.png`;
const RENDER = { light: [-0.5, -0.6, 0.62], ambient: 0.3, aoStrength: 0.5 };
const circle = (cx, cy, r, n = 24) => Array.from({ length: n }, (_, k) => [cx + Math.cos((k / n) * Math.PI * 2) * r, cy + Math.sin((k / n) * Math.PI * 2) * r]);

// ------------------------------------------------------------------ alarm clock

/**
 * A demonic twin-bell alarm clock. o: { legs: [liftL, liftR], mouth 0..1, eyes 'angry'|'closed'|'x',
 * shake, spin, crack, caseColor, noLegs, unit }
 */
function clockModel(m, cx, cy, r, o = {}) {
  const u = o.unit ?? 1; // scales fixed-size details (strokes, teeth) for big renders
  const caseCol = o.caseColor ?? C('blood', 0.45);
  const z = 0;
  const painted = { ...MAT.metal, spec: 0.45, shine: 20, grain: 0.04 };
  // Legs and feet.
  if (!o.noLegs) {
    (o.legs ?? [0, 0]).forEach((lift, i) => {
      const side = i ? 1 : -1;
      const hx = cx + side * r * 0.42;
      m.capsule(hx, cy + r * 0.75, z - 1, hx + side * r * 0.08, cy + r * 1.42 - lift, z + 1, r * 0.13, r * 0.11, C('gray', 0.25), MAT.metal);
      m.ellipsoid(hx + side * r * 0.12, cy + r * 1.5 - lift, z + 2, r * 0.22, r * 0.11, r * 0.28, C('gray', 0.15), MAT.metal);
    });
  }
  // Bells, hammer and carrying ring.
  const by = cy - r * 0.95;
  for (const side of [-1, 1]) {
    const bx = cx + side * (r * 0.62 + (o.shake ?? 0) * side);
    m.ellipsoid(bx, by, z - 1, r * 0.42, r * 0.38, r * 0.4, C('yellow', 0.5), MAT.brass);
    m.capsule(bx, by + r * 0.2, z - 1, cx, cy - r * 0.6, z - 1, r * 0.06, r * 0.06, C('steel', 0.5), MAT.metal);
  }
  m.capsule(cx, by - r * 0.1, z - 1, cx, cy - r * 0.8, z - 1, r * 0.06, r * 0.06, C('steel', 0.6), MAT.metal);
  m.sphere(cx, by - r * 0.15, z - 0.5, r * 0.1, C('steel', 0.6), MAT.metal);
  circle(cx, cy - r * 1.1, r * 0.48, 14).forEach((p, i, arr) => {
    const q = arr[(i + 1) % arr.length];
    if (p[1] < cy - r * 1.0) m.capsule(p[0], p[1], z - 2, q[0], q[1], z - 2, r * 0.05, r * 0.05, C('steel', 0.55), MAT.metal);
  });
  // Case and bezel.
  m.ellipsoid(cx, cy, z, r, r, r * 0.42, caseCol, painted);
  m.slab(circle(cx, cy, r * 0.83), z + r * 0.42, lighten(caseCol, 0.15), painted, { bevel: r * 0.12, thickness: 1 });
  // Face.
  m.slab(circle(cx, cy, r * 0.74), z + r * 0.44, C('beige', 0.82), MAT.paper, { bevel: u, thickness: 0.3 * u });
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const rr = r * 0.64;
    m.paint(cx + Math.sin(a) * rr, cy - Math.cos(a) * rr, (k % 3 ? 0.5 : 0.9) * u, (k % 3 ? 0.5 : 0.9) * u, C('gray', 0.12));
  }
  const spin = o.spin ?? 0;
  m.stroke(cx, cy, cx + Math.sin(-0.5 + spin) * r * 0.36, cy - Math.cos(-0.5 + spin) * r * 0.36, 1.1 * u, C('gray', 0.08));
  m.stroke(cx, cy, cx + Math.sin(2.1 + spin * 3) * r * 0.55, cy - Math.cos(2.1 + spin * 3) * r * 0.55, 0.8 * u, C('gray', 0.08));
  // Eyes.
  const ey = cy - r * 0.3;
  for (const side of [-1, 1]) {
    const ex = cx + side * r * 0.3;
    if (o.eyes === 'closed') m.stroke(ex - r * 0.15, ey, ex + r * 0.15, ey + side * 0.5 * u, 0.9 * u, C('gray', 0.1));
    else if (o.eyes === 'x') {
      m.stroke(ex - r * 0.1, ey - r * 0.1, ex + r * 0.1, ey + r * 0.1, 0.8 * u, C('gray', 0.1));
      m.stroke(ex - r * 0.1, ey + r * 0.1, ex + r * 0.1, ey - r * 0.1, 0.8 * u, C('gray', 0.1));
    } else {
      m.dent(ex, ey, r * 0.2, r * 0.15, 1.2);
      m.paint(ex, ey, r * 0.17, r * 0.12, C('blood', 0.15));
      m.paint(ex, ey, r * 0.09, r * 0.08, G('red', 1), MAT.glow);
      m.stroke(ex - side * r * 0.24, ey - r * 0.2, ex + side * r * 0.1, ey - r * 0.1, 1.1 * u, C('gray', 0.15));
    }
  }
  // Toothy mouth carved into the face.
  const mouth = o.mouth ?? 0;
  const my = cy + r * 0.32;
  const mw = r * 0.5;
  const mh = 1.2 * u + mouth * r * 0.45;
  m.dent(cx, my, mw, mh, 1.6);
  m.paint(cx, my, mw, mh, C('blood', 0.12));
  for (let x = -mw + u; x < mw - 0.5 * u; x += 2.2 * u) {
    m.paintPoly([[cx + x, my - mh + 0.4 * u], [cx + x + 2 * u, my - mh + 0.4 * u], [cx + x + u, my - mh + 2.6 * u]], C('beige', 0.9));
    if (mouth > 0.3) m.paintPoly([[cx + x, my + mh - 0.4 * u], [cx + x + 2 * u, my + mh - 0.4 * u], [cx + x + u, my + mh - 2.6 * u]], C('beige', 0.9));
  }
  if (o.crack) {
    m.stroke(cx - r * 0.5, cy - r * 0.6, cx + r * 0.1, cy, 0.6 * u, C('gray', 0.35));
    m.stroke(cx + r * 0.1, cy, cx - r * 0.1, cy + r * 0.7, 0.6 * u, C('gray', 0.35));
    m.stroke(cx + r * 0.1, cy, cx + r * 0.6, cy + r * 0.2, 0.6 * u, C('gray', 0.35));
  }
}

function spring(c, x, y, length, angle, col = C('steel', 0.7)) {
  for (let k = 0; k < length; k++) {
    const t = k / length;
    const wob = Math.sin(t * Math.PI * 8) * 2;
    c.set(x + Math.cos(angle) * k + Math.cos(angle + Math.PI / 2) * wob, y + Math.sin(angle) * k + Math.sin(angle + Math.PI / 2) * wob, k % 3 ? col : darken(col, 0.4));
  }
}

function gearModel(m, x, y, z, r, col) {
  m.slab(circle(x, y, r, 16).map(([px, py], k) => (k % 2 ? [px, py] : [x + (px - x) * 1.25, y + (py - y) * 1.25])), z, col, MAT.brass, { bevel: r * 0.4, thickness: 0.8, tilt: [0, -1.2] });
  m.paint(x, y, r * 0.3, r * 0.3, C('gray', 0.1));
}

function clockFrame(o, { rot = 0, debris = 0, seed = 1 } = {}) {
  const m = new Model(64, 64, { seed: 51 });
  if (!debris) clockModel(m, 32 + (o.lean ?? 0), 34 + (o.bob ?? 0), 17, o);
  if (debris) {
    const r = rng(seed);
    puddle(m, 30, 60, 16, 2.5, C('gray', 0.15), MAT.metal);
    for (let k = 0; k < 7; k++) gearModel(m, r.int(16, 48), r.int(53, 59), r.range(0, 3), r.range(2, 3.6), r.chance(0.5) ? C('yellow', 0.5) : C('steel', 0.55));
    m.ellipsoid(24, 56, 0, 8, 3.5, 4, C('blood', 0.42), MAT.metal);
    m.ellipsoid(41, 56, 1, 5, 3, 4, C('yellow', 0.5), MAT.brass);
    m.slab(circle(33, 53, 5.5), 2, C('beige', 0.8), MAT.paper, { tilt: [0, -1.5] });
  }
  let c = m.render(RENDER);
  if (rot) {
    const out = new PixelCanvas(64, 64);
    const ca = Math.cos(-rot);
    const sa = Math.sin(-rot);
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const dx = x + 0.5 - 32;
        const dy = y + 0.5 - 62;
        const col = c.get(Math.floor(32 + dx * ca - dy * sa), Math.floor(62 + dx * sa + dy * ca));
        if (col) out.set(x, y, col);
      }
    }
    c = out;
  }
  return c;
}

function alarmClockSheet() {
  const frames = [
    clockFrame({ legs: [4, 0], bob: -1, shake: 0.8 }),
    clockFrame({ legs: [0, 0], bob: 0, shake: -0.8 }),
    clockFrame({ legs: [0, 4], bob: -1, shake: 0.8 }),
    clockFrame({ legs: [0, 0], bob: 0, shake: -0.8 }),
    clockFrame({ legs: [0, 0], mouth: 0.5, shake: 1.6 }),
    clockFrame({ legs: [2, 2], mouth: 1, bob: -3, shake: -1.6 }),
    clockFrame({ legs: [0, 0], mouth: 0.2 }),
    clockFrame({ legs: [0, 0], eyes: 'closed', spin: 1.5, lean: -2 }),
  ];
  const d1 = clockFrame({ eyes: 'x', crack: true, mouth: 0.6 });
  spring(d1, 40, 22, 14, -0.9);
  const d2 = clockFrame({ eyes: 'x', crack: true, mouth: 0.8 }, { rot: 0.5 });
  spring(d2, 20, 20, 16, -2.2);
  spring(d2, 44, 26, 12, -0.5);
  const d3 = clockFrame({ eyes: 'x', crack: true, mouth: 0.8, noLegs: true }, { rot: 1.2 });
  spring(d3, 44, 44, 14, -1.2);
  const d4 = clockFrame({}, { debris: 1, seed: 41 });
  spring(d4, 30, 50, 12, -1.6);
  const d5 = clockFrame({}, { debris: 1, seed: 43 });
  frames.push(d1, d2, d3, d4, d5);
  return sheet(frames);
}

// ------------------------------------------------------------------ rat

function ratFrame(o = {}) {
  const m = new Model(48, 32, { seed: 61 });
  const fur = mix(C('rust', 0.22), C('gray', 0.3), 0.5);
  const pink = C('flesh', 0.55);
  const bob = o.bob ?? 0;
  const cx = 24;
  if (o.dead) {
    m.ellipsoid(cx, 25, 0, 12, 4.5, 5, fur, MAT.fur);
    m.ellipsoid(cx + 11, 25, 1, 5, 3.6, 4, fur, MAT.fur);
    m.ellipsoid(cx - 1, 23, 2, 7, 2.5, 3, lighten(fur, 0.2), MAT.fur);
    for (const x of [16, 21, 27, 32]) m.capsule(x, 22, 2, x + 1, 16 + (x % 2), 3, 0.8, 0.6, pink, MAT.flesh);
    for (let k = 0; k < 8; k++) m.capsule(cx - 11 - k * 1.3, 26 - Math.sin(k * 0.7) * 1.5, 0, cx - 12.3 - k * 1.3, 26 - Math.sin((k + 1) * 0.7) * 1.5, 0, 0.7, 0.6, pink, MAT.flesh);
    if (o.pool) puddle(m, cx, 29, 12 + o.pool * 3, 2.2, C('blood', 0.3));
    return m.render(RENDER);
  }
  // Tail.
  const sway = o.sway ?? 0;
  for (let k = 0; k < 12; k++) {
    const t0 = k / 12;
    const t1 = (k + 1) / 12;
    const p = (t) => [cx + 8 + t * 15, 16 - Math.sin(t * Math.PI + sway) * 6 - t * 3 + bob, -3 - t * 2];
    m.capsule(...p(t0), ...p(t1), 1 - t0 * 0.5, 1 - t1 * 0.5, pink, MAT.flesh);
  }
  m.ellipsoid(cx + 3, 15 + bob, -2, 10.5, 7.5, 7, fur, MAT.fur);
  // Legs.
  for (const [lx, lift] of [[cx - 7, o.legs?.[0] ?? 0], [cx + 9, o.legs?.[1] ?? 0]]) {
    m.capsule(lx, 19 + bob, 1, lx, 27 - lift, 3, 1.5, 1.1, darken(fur, 0.2), MAT.fur);
    m.ellipsoid(lx, 28 - lift, 4, 1.8, 0.9, 1.8, pink, MAT.flesh);
  }
  // Head toward the viewer.
  m.ellipsoid(cx - 2, 19 + bob, 4, 7.5, 6.2, 6, fur, MAT.fur);
  m.ellipsoid(cx - 2, 23 + bob, 8, 4, 3.2, 4, lighten(fur, 0.12), MAT.fur);
  for (const side of [-1, 1]) {
    m.ellipsoid(cx - 2 + side * 5.8, 12.5 + bob, 3, 2.8, 3, 1.2, pink, MAT.flesh);
    m.dent(cx - 2 + side * 5.8, 12.5 + bob, 1.6, 1.8, 1);
    m.paint(cx - 2 + side * 3, 18.6 + bob, 1, 1, G('red', 1), MAT.glow);
  }
  m.sphere(cx - 2, 22 + bob, 11.5, 1.2, C('flesh', 0.35), MAT.flesh);
  if (o.bite) {
    m.dent(cx - 2, 26 + bob, 3, 2.2, 1.5);
    m.paint(cx - 2, 26 + bob, 2.6, 2, C('blood', 0.15));
    m.paint(cx - 3, 24.6 + bob, 0.5, 1, C('beige', 0.95));
    m.paint(cx - 1, 24.6 + bob, 0.5, 1, C('beige', 0.95));
  } else {
    m.paint(cx - 2.5, 25.4 + bob, 1, 1, C('beige', 0.9));
  }
  if (o.pain) m.paint(cx + 3, 13 + bob, 1.2, 1.2, C('blood', 0.5));
  const c = m.render(RENDER);
  for (const side of [-1, 1]) {
    c.line(cx - 2 + side * 3, 23.5 + bob, cx - 2 + side * 11, 21.5 + bob, C('gray', 0.55));
    c.line(cx - 2 + side * 3, 24.5 + bob, cx - 2 + side * 11, 25.5 + bob, C('gray', 0.45));
  }
  return c;
}

function rotateCanvas(src, a, px, py) {
  const out = new PixelCanvas(src.w, src.h);
  const ca = Math.cos(-a);
  const sa = Math.sin(-a);
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const dx = x + 0.5 - px;
      const dy = y + 0.5 - py;
      const col = src.get(Math.floor(px + dx * ca - dy * sa), Math.floor(py + dx * sa + dy * ca));
      if (col) out.set(x, y, col);
    }
  }
  return out;
}

function ratSheet() {
  return sheet([
    ratFrame({ bob: 0, legs: [2, 0], sway: 0 }),
    ratFrame({ bob: -1, legs: [0, 0], sway: 0.6 }),
    ratFrame({ bob: 0, legs: [0, 2], sway: 1.2 }),
    ratFrame({ bob: -2, bite: true, legs: [1, 1] }),
    ratFrame({ bob: 1, bite: true }),
    ratFrame({ bob: 0, pain: true, sway: 2 }),
    rotateCanvas(ratFrame({ pain: true }), 0.8, 24, 28),
    rotateCanvas(ratFrame({ pain: true }), 1.9, 24, 24),
    ratFrame({ dead: true, pool: 1 }),
    ratFrame({ dead: true, pool: 2 }),
  ]);
}

// ------------------------------------------------------------------ garbage golem

const BAG = C('olive', 0.13);
const BAG2 = C('gray', 0.13);

function golemModel(m, o = {}) {
  const cx = 40 + (o.lean ?? 0);
  const bob = o.bob ?? 0;
  const base = 78;
  // Legs of stacked bags.
  for (const [side, lift] of [[-1, o.legs?.[0] ?? 0], [1, o.legs?.[1] ?? 0]]) {
    m.ellipsoid(cx + side * 9, base - 13 - lift, 0, 7, 9, 6, BAG2, MAT.bag);
    m.ellipsoid(cx + side * 10, base - 4 - lift, 3, 8, 4, 7, BAG, MAT.bag);
  }
  // Body heap.
  m.ellipsoid(cx, 46 + bob, 0, 16, 15, 10, BAG, MAT.bag);
  m.ellipsoid(cx - 8, 36 + bob, 3, 10, 9, 8, BAG2, MAT.bag);
  m.ellipsoid(cx + 9, 38 + bob, 2, 10, 10, 8, BAG, MAT.bag);
  m.ellipsoid(cx, 55 + bob, 4, 12, 7, 8, BAG2, MAT.bag);
  // Knots and tie-handles on the bags.
  m.sphere(cx - 8, 28 + bob, 7, 1.6, BAG2, MAT.bag);
  m.sphere(cx + 10, 29 + bob, 6, 1.6, BAG, MAT.bag);
  // Junk poking out.
  m.slab([[cx - 13, 45 + bob], [cx - 6, 44 + bob], [cx - 6, 49 + bob], [cx - 13, 50 + bob]], 10, C('beige', 0.55), MAT.paper, { bevel: 0.8 });
  m.capsule(cx + 6, 51 + bob, 11, cx + 13, 46 + bob, 9, 1.3, 1, C('toxic', 0.45), MAT.glass);
  m.capsule(cx - 2, 31 + bob, 10, cx + 1, 28 + bob, 9, 0.8, 0.5, C('yellow', 0.7), MAT.flesh); // banana peel
  m.slab([[cx + 1, 58 + bob], [cx + 8, 57 + bob], [cx + 8, 60 + bob], [cx + 1, 61 + bob]], 12, C('gray', 0.75), MAT.paper, { bevel: 0.6 });
  // Arms.
  const arm = (side, a) => {
    const s = [cx + side * 15, 34 + bob, 2];
    const h = a.hand ? [a.hand[0], a.hand[1], a.hand[2] ?? 8] : [s[0] + side * (a.out ?? 6), s[1] + (a.down ?? 18), 6];
    const e = [(s[0] + h[0]) / 2 + side * 2, (s[1] + h[1]) / 2, 5];
    m.capsule(...s, ...e, 5.5, 4.6, BAG2, MAT.bag);
    m.capsule(...e, ...h, 4.6, 4, BAG, MAT.bag);
    m.ellipsoid(h[0], h[1] + 2, h[2] + 2, 4.5, 4, 4, C('steel', 0.45), MAT.metal); // crushed-can fist
    m.paint(h[0], h[1] + 2, 3.5, 0.8, C('blood', 0.45));
    return h;
  };
  arm(-1, o.armL ?? {});
  const right = arm(1, o.armR ?? {});
  // Tin-can head.
  const hx = cx + (o.headTilt ?? 0);
  const hy = 22 + bob;
  m.ellipsoid(hx, hy, 4, 7, 8.5, 6, C('steel', 0.5), MAT.metal);
  m.slab(circle(hx, hy - 8, 6.2, 16).map(([x, y]) => [x, hy - 8 + (y - (hy - 8)) * 0.4]), 9, C('steel', 0.65), MAT.metal, { tilt: [0, -2], bevel: 1 });
  for (let y = hy - 5; y < hy + 8; y += 3) m.stroke(hx - 7, y, hx + 7, y, 0.6, C('steel', 0.32));
  m.paint(hx, hy + 1, 6.5, 2.2, C('blood', 0.38));
  m.capsule(hx - 5, hy - 9, 8, hx + 3, hy - 14, 6, 0.7, 0.5, C('steel', 0.65), MAT.metal); // jagged lid
  m.dent(hx - 2.5, hy - 3, 1.8, 1.4, 1.4);
  m.dent(hx + 2.5, hy - 3, 1.8, 1.4, 1.4);
  m.paint(hx - 2.5, hy - 3, 1.2, 0.9, o.dead ? C('gray', 0.1) : G('green', 0.9), o.dead ? undefined : MAT.glow);
  m.paint(hx + 2.5, hy - 3, 1.2, 0.9, o.dead ? C('gray', 0.1) : G('green', 0.9), o.dead ? undefined : MAT.glow);
  m.stroke(hx - 4, hy + 4.5, hx + 4, hy + 4.5, 0.9, C('gray', 0.06));
  if (o.holding) {
    const [x, y, z] = o.holding === 'up' ? [cx, 8 + bob, 6] : right;
    m.ellipsoid(x, y - 3, z + 4, 7, 6, 6, C('toxic', 0.28), MAT.bag);
    m.capsule(x, y - 9, z + 4, x, y - 11, z + 4, 1, 0.6, C('toxic', 0.4), MAT.bag);
  }
}

function golemFrame(o = {}, { rot = 0 } = {}) {
  const m = new Model(80, 80, { seed: 71 });
  golemModel(m, o);
  const c = m.render(RENDER);
  return rot ? rotateCanvas(c, rot, 40, 78) : c;
}

function heapFrame(h, flies, seed) {
  const m = new Model(80, 80, { seed: 73 });
  const r = rng(seed);
  for (let k = 0; k < 9; k++) {
    m.ellipsoid(r.int(18, 62), 78 - r.int(3, 6 + h), r.range(0, 4), r.range(5, 9), r.range(3, 4 + h * 0.6), r.range(4, 6), r.chance(0.5) ? BAG : BAG2, MAT.bag);
  }
  m.ellipsoid(30, 72, 6, 5, 4, 4, C('steel', 0.5), MAT.metal);
  m.slab([[44, 72], [50, 71], [50, 74], [44, 75]], 8, C('beige', 0.6), MAT.paper, { tilt: [0, -1] });
  const c = m.render(RENDER);
  for (let k = 0; k < flies; k++) c.set(r.int(20, 60), r.int(50, 66), C('gray', 0.05));
  return c;
}

function golemSheet() {
  return sheet([
    golemFrame({ legs: [3, 0], lean: -1, armL: { down: 18, out: 4 }, armR: { down: 15, out: 8 } }),
    golemFrame({ legs: [0, 0], bob: 1, armL: { down: 17, out: 6 }, armR: { down: 17, out: 6 } }),
    golemFrame({ legs: [0, 3], lean: 1, armL: { down: 15, out: 8 }, armR: { down: 18, out: 4 } }),
    golemFrame({ legs: [0, 0], bob: 1, armL: { down: 17, out: 6 }, armR: { down: 17, out: 6 } }),
    golemFrame({ armL: { down: 16, out: 6 }, armR: { down: 10, out: 12 }, holding: 'hand' }),
    golemFrame({ armL: { hand: [30, 12, 6] }, armR: { hand: [50, 12, 6] }, holding: 'up', bob: -1 }),
    golemFrame({ armL: { hand: [33, 36, 14] }, armR: { hand: [47, 36, 14] }, lean: 2 }),
    golemFrame({ headTilt: -3, lean: -3, armL: { down: 10, out: 12 }, armR: { down: 10, out: 12 } }),
    golemFrame({ dead: true, armL: { down: 12, out: 10 }, armR: { down: 12, out: 10 } }),
    golemFrame({ dead: true, armL: { down: 12, out: 10 }, armR: { down: 12, out: 10 } }, { rot: 0.4 }),
    heapFrame(10, 0, 81),
    heapFrame(7, 2, 82),
    heapFrame(5, 4, 83),
    heapFrame(4, 6, 84),
  ]);
}

// ------------------------------------------------------------------ the alarm king

function kingModel(m, o = {}) {
  const cx = 64 + (o.lean ?? 0);
  const bob = o.bob ?? 0;
  const skin = mix(C('rust', 0.3), C('blood', 0.3), 0.4);
  // Legs.
  for (const [side, lift] of [[-1, o.legs?.[0] ?? 0], [1, o.legs?.[1] ?? 0]]) {
    m.capsule(cx + side * 12, 84 + bob, 0, cx + side * 16, 104 - lift, 2, 8, 6.5, skin, MAT.flesh);
    m.capsule(cx + side * 16, 104 - lift, 2, cx + side * 17, 119 - lift, 3, 6.5, 5, darken(skin, 0.1), MAT.flesh);
    m.ellipsoid(cx + side * 18, 122 - lift, 7, 9, 4, 8, C('gray', 0.15), MAT.metal);
  }
  // Cape of newspapers and bin bags.
  m.slab([[cx - 30, 40 + bob], [cx + 30, 40 + bob], [cx + 38, 100], [cx - 38, 100]], -14, C('olive', 0.12), MAT.bag, { bevel: 4, thickness: 3 });
  for (let k = 0; k < 6; k++) m.paint(cx - 32 + k * 12, 95, 4, 5, k % 2 ? C('gray', 0.72) : C('olive', 0.18), k % 2 ? MAT.paper : MAT.bag);
  // Arms.
  const arm = (side, a) => {
    const s = [cx + side * 27, 44 + bob, 0];
    const h = [a.hand[0], a.hand[1], a.hand[2] ?? 10];
    const e = [(s[0] + h[0]) / 2 + side * 6, (s[1] + h[1]) / 2, 4];
    m.sphere(...s, 9, skin, MAT.flesh);
    m.capsule(...s, ...e, 8, 7, skin, MAT.flesh);
    m.capsule(...e, ...h, 7, 6, skin, MAT.flesh);
    return h;
  };
  const armL = o.armL ?? { hand: [cx - 38, 88 + bob] };
  const armR = o.armR ?? { hand: [cx + 38, 88 + bob] };
  const left = arm(-1, armL);
  const right = arm(1, armR);
  m.sphere(left[0], left[1], left[2] + 2, 7, darken(skin, 0.1), MAT.flesh);
  // Bell cannon on the right arm.
  const aim = !!o.aim;
  const mx = right[0] + (aim ? -5 : 7);
  const my = right[1] + (aim ? -2 : 12);
  m.capsule(right[0], right[1], right[2] + 2, mx, my, right[2] + (aim ? 10 : 4), 7, 9, C('yellow', 0.48), MAT.brass);
  m.ellipsoid(mx, my, right[2] + (aim ? 12 : 6), 9, 7, 5, C('yellow', 0.58), MAT.brass);
  if (aim) {
    m.dent(mx, my, 5, 4, 2);
    m.paint(mx, my, 5, 4, C('gray', 0.05));
  }
  // The giant clock body.
  clockModel(m, cx + (o.headTilt ?? 0), 50 + bob, 30, {
    noLegs: true,
    mouth: o.mouth ?? 0.3,
    eyes: o.eyes,
    crack: o.crack,
    spin: o.spin,
    shake: o.shake ?? 0,
    caseColor: C('blood', 0.4),
  });
  // Garbage crown.
  const ky = 50 + bob - 30 * 1.55;
  const crown = [[cx - 13, ky + 7], [cx - 13, ky - 2], [cx - 9.5, ky - 9], [cx - 6.5, ky - 2], [cx - 3, ky - 9], [cx, ky - 2], [cx + 3.5, ky - 9], [cx + 6.5, ky - 2], [cx + 10, ky - 9], [cx + 13, ky - 2], [cx + 13, ky + 7]];
  m.slab(crown, 4, C('yellow', 0.55), MAT.brass, { bevel: 1.5, thickness: 1.5 });
  [C('blood', 0.6), C('steel', 0.75), C('toxic', 0.6), C('blood', 0.6)].forEach((col, k) => m.sphere(cx - 9 + k * 6, ky + 3, 5.5, 1.8, col, MAT.glass));
  return { right: [mx, my] };
}

function kingFrame(o = {}, { rot = 0, shiftY = 0 } = {}) {
  const m = new Model(128, 128, { seed: 91 });
  const { right } = kingModel(m, o);
  let c = m.render(RENDER);
  if (o.fire) flash(c, right[0], right[1], 14, G('yellow', 1), G('yellow', 0.4));
  if (rot) c = rotateCanvas(c, rot, 64, 124);
  if (shiftY) {
    const out = new PixelCanvas(128, 128);
    out.blit(c, 0, shiftY);
    c = out;
  }
  return c;
}

function rubbleFrame(level, fire, seed) {
  const m = new Model(128, 128, { seed: 95 });
  const r = rng(seed);
  puddle(m, 64, 118, 34, 6, C('blood', 0.3));
  for (let i = 0; i < 14 + level * 4; i++) gearModel(m, r.int(24, 104), r.int(104, 121), r.range(0, 6), r.range(3, 6), r.chance(0.5) ? C('yellow', 0.5) : C('steel', 0.55));
  m.ellipsoid(46, 112, 4, 10, 6, 8, C('yellow', 0.55), MAT.brass); // a fallen bell
  m.ellipsoid(80, 114, 3, 14, 6, 9, C('blood', 0.4), MAT.metal); // case fragment
  if (level < 2) m.ellipsoid(64, 104 - level * 4, 2, 22 - level * 4, 9, 10, C('blood', 0.42), MAT.metal);
  const c = m.render(RENDER);
  for (let i = 0; i < 5; i++) spring(c, r.int(30, 98), r.int(96, 110), r.int(10, 20), r.range(-2.5, -0.6));
  if (fire) flash(c, r.int(40, 88), r.int(70, 100), fire, G('yellow', 1), G('red', 0.7));
  return c;
}

function kingSheet() {
  const frames = [
    kingFrame({ legs: [5, 0], lean: -2, shake: 0.8 }),
    kingFrame({ legs: [0, 0], bob: 2, shake: -0.8 }),
    kingFrame({ legs: [0, 5], lean: 2, shake: 0.8 }),
    kingFrame({ legs: [0, 0], bob: 2, shake: -0.8 }),
    kingFrame({ aim: true, armR: { hand: [96, 62, 12] }, mouth: 0.6, shake: 1.6 }),
    kingFrame({ aim: true, fire: true, armR: { hand: [96, 60, 12] }, mouth: 1, shake: -1.6, lean: -2 }),
    kingFrame({ armR: { hand: [100, 74, 8] }, mouth: 0.4 }),
    kingFrame({ eyes: 'closed', spin: 2, mouth: 0.8, lean: -4, headTilt: -3 }),
  ];
  const d0 = kingFrame({ eyes: 'x', crack: true, mouth: 1, spin: 4 });
  frames.push(d0);
  const d1 = kingFrame({ eyes: 'x', crack: true, mouth: 1, spin: 6, lean: -3 });
  spring(d1, 70, 34, 26, -0.8);
  spring(d1, 52, 40, 22, -2.4);
  flash(d1, 80, 58, 12, G('yellow', 1), G('yellow', 0.3));
  frames.push(d1);
  const d2 = kingFrame({ eyes: 'x', crack: true, mouth: 1, spin: 8 }, { rot: 0.35 });
  flash(d2, 50, 44, 16, G('yellow', 1), G('red', 0.8));
  flash(d2, 84, 74, 12, G('yellow', 1), G('yellow', 0.3));
  frames.push(d2);
  frames.push(rubbleFrame(0, 18, 99), rubbleFrame(1, 14, 98), rubbleFrame(2, 10, 97), rubbleFrame(3, 0, 96), rubbleFrame(4, 0, 95));
  return sheet(frames);
}

export default [
  { name: 'alarm-clock', out: M('alarm-clock'), draw: alarmClockSheet, dither: 'fs' },
  { name: 'rat', out: M('rat'), draw: ratSheet, dither: 'fs' },
  { name: 'golem', out: M('golem'), draw: golemSheet, dither: 'fs' },
  { name: 'alarm-king', out: M('alarm-king'), draw: kingSheet, dither: 'fs' },
];

export { clockModel, gearModel, spring, circle, rotateCanvas, rotatePoints };
