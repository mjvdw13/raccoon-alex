// Sprite helpers: shaded layered parts, a front-facing humanoid rig,
// rotation for death falls, and frame-strip assembly.
import { PixelCanvas, mix, darken, lighten } from './canvas.js';
import { C } from './pal.js';

export const OUTLINE = [8, 8, 10];

/** Draw into a temporary layer, shade it as one volume, composite onto c. */
export function layer(c, draw, { hi = 0.2, lo = 0.32, grad = 0.18, rim = true } = {}) {
  const p = new PixelCanvas(c.w, c.h);
  draw(p);
  let y0 = c.h;
  let y1 = 0;
  p.eachOpaque((x, y) => {
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
    return undefined;
  });
  if (grad && y1 > y0) p.eachOpaque((x, y, col) => darken(col, (grad * (y - y0)) / (y1 - y0)));
  if (rim) p.rim({ hi, lo });
  c.blit(p, 0, 0);
  return p;
}

/** Rotate a canvas around a pivot (nearest neighbour), for falling bodies. */
export function rotate(src, angle, px, py, out = new PixelCanvas(src.w, src.h)) {
  const ca = Math.cos(-angle);
  const sa = Math.sin(-angle);
  for (let y = 0; y < out.h; y++) {
    for (let x = 0; x < out.w; x++) {
      const dx = x + 0.5 - px;
      const dy = y + 0.5 - py;
      const sx = px + dx * ca - dy * sa;
      const sy = py + dx * sa + dy * ca;
      const col = src.get(Math.floor(sx), Math.floor(sy));
      if (col) out.set(x, y, col);
    }
  }
  return out;
}

/** Squash/stretch vertically around the bottom edge. */
export function squash(src, fy, bottom = src.h) {
  const out = new PixelCanvas(src.w, src.h);
  for (let y = 0; y < out.h; y++) {
    const sy = bottom - (bottom - y - 0.5) / fy;
    for (let x = 0; x < out.w; x++) {
      const col = src.get(x, Math.floor(sy));
      if (col) out.set(x, y, col);
    }
  }
  return out;
}

export function shift(src, dx, dy) {
  const out = new PixelCanvas(src.w, src.h);
  out.blit(src, dx, dy);
  return out;
}

/** Lay out frames into one sheet (left to right). */
export function sheet(frames) {
  const fw = frames[0].w;
  const fh = frames[0].h;
  const out = new PixelCanvas(fw * frames.length, fh);
  frames.forEach((f, i) => out.blit(f, i * fw, 0));
  return out;
}

/** A blood (or slime) pool on the floor. */
export function pool(c, cx, cy, rx, ry, ramp = 'blood') {
  c.ellipse(cx, cy, rx, ry, C(ramp, 0.25));
  c.ellipse(cx - rx * 0.2, cy - ry * 0.2, rx * 0.6, ry * 0.5, C(ramp, 0.4));
  c.set(cx - rx * 0.4, cy - ry * 0.4, C(ramp, 0.7));
}

/**
 * Muzzle flash / fire burst: a ragged, noisy blob of fullbright colours,
 * hottest in the middle. `inner` and `outer` are the core and rim colours.
 */
export function flash(c, x, y, r, inner, outer, seed = 7) {
  const rays = 9;
  const phase = (seed * 1.37) % (Math.PI * 2);
  const hot = [255, 255, 255];
  for (let yy = Math.floor(y - r - 1); yy <= Math.ceil(y + r + 1); yy++) {
    for (let xx = Math.floor(x - r - 1); xx <= Math.ceil(x + r + 1); xx++) {
      const dx = xx + 0.5 - x;
      const dy = yy + 0.5 - y;
      const a = Math.atan2(dy, dx);
      const spike = 0.55 + 0.45 * Math.abs(Math.sin(a * rays * 0.5 + phase)) + Math.sin(a * 23 + seed) * 0.08;
      const d = Math.hypot(dx, dy) / (r * spike);
      if (d > 1) continue;
      const n = Math.sin(xx * 12.9898 + yy * 78.233 + seed) * 43758.5453;
      const jitter = (n - Math.floor(n)) * 0.25;
      const t = d + jitter;
      if (t > 1.05) continue;
      c.set(xx, yy, t < 0.3 ? (inner === undefined ? hot : inner) : t < 0.65 ? inner : outer);
    }
  }
}

const rad = (d) => (d * Math.PI) / 180;

/**
 * Front-facing humanoid. Every number is optional.
 * pose:  { bob, lean, armL: {sh, el}, armR: {sh, el}, legL: {spread, lift}, legR: {...}, headTilt, crouch }
 *        Arm angles in degrees: sh = upper arm away from the body (0 = hanging), el = extra elbow bend,
 *        or hand: [x, y] to put the hand at an exact spot (e.g. aiming at the viewer).
 * style: { skin, hair, shirt, shirtHi, pants, shoes, tie, eyes, mouth, build (width scale), height (scale),
 *          head(c, hx, hy, pose) custom head, hands(c, joints) custom held items, torso(c, joints) extras }
 */
export function humanoid(c, pose = {}, style = {}) {
  const cx = c.w / 2 + (pose.lean ?? 0) * 0.3 + (pose.x ?? 0);
  const build = style.build ?? 1;
  const s = style.height ?? 1;
  const base = c.h - 2;
  const bob = pose.bob ?? 0;
  const crouch = pose.crouch ?? 0;
  const hipY = base - 22 * s + crouch + bob;
  const neckY = hipY - 19 * s + (pose.hunch ?? 0);
  const shoulderY = neckY + 2;
  const sw = 8 * build;
  const lean = pose.lean ?? 0;
  const J = {};

  // Legs.
  const leg = (side, lp = {}) => {
    const hx = cx + side * 3.5 * build;
    const spread = lp.spread ?? 2;
    const lift = lp.lift ?? 0;
    const fx = hx + side * spread;
    const fy = base - lift;
    const kx = (hx + fx) / 2 + side * (lift ? 1.5 : 0.5);
    const ky = (hipY + fy) / 2 - lift * 0.4;
    layer(c, (p) => {
      p.capsule(hx, hipY, kx, ky, 3.2 * build, style.pants ?? C('beige', 0.45), 2.9 * build);
      p.capsule(kx, ky, fx, fy - 2, 2.8 * build, style.pants ?? C('beige', 0.45), 2.4 * build);
    });
    layer(c, (p) => p.ellipse(fx + side * 0.8, fy - 1.2, 3.4 * build, 2, style.shoes ?? C('rust', 0.12)), { grad: 0 });
    J[side < 0 ? 'footL' : 'footR'] = [fx, fy];
  };
  leg(-1, pose.legL);
  leg(1, pose.legR);

  // Torso.
  const tx = cx + lean * 0.7;
  layer(c, (p) => {
    p.poly(
      [
        [tx - sw, shoulderY],
        [tx + sw, shoulderY],
        [cx + 6.5 * build, hipY + 2],
        [cx - 6.5 * build, hipY + 2],
      ],
      style.shirt ?? C('beige', 0.85),
    );
    p.ellipse(tx - sw + 1, shoulderY + 1, 3, 2.5, style.shirt ?? C('beige', 0.85));
    p.ellipse(tx + sw - 1, shoulderY + 1, 3, 2.5, style.shirt ?? C('beige', 0.85));
    if (style.belt) p.rect(cx - 6.5 * build, hipY - 1, 13 * build, 2, style.belt);
  });
  J.neck = [tx, neckY];
  J.chest = [tx, shoulderY + 6];
  J.hip = [cx, hipY];
  style.torso?.(c, J, pose);

  // Head.
  const hx = tx + (pose.headTilt ?? 0);
  const hy = neckY - 6 * s;
  J.head = [hx, hy];
  if (style.head) style.head(c, hx, hy, pose, J);
  else {
    layer(c, (p) => p.rect(hx - 1.5, neckY - 2, 3, 4, style.skin ?? C('skin', 0.6)), { rim: false, grad: 0 });
    layer(c, (p) => p.ellipse(hx, hy, 5.2 * (style.headW ?? 1), 6.2, style.skin ?? C('skin', 0.6)));
    if (style.hair) {
      layer(c, (p) => {
        p.ellipse(hx, hy - 3.5, 5.6 * (style.headW ?? 1), 3.4, style.hair);
        p.rect(hx - 5.5, hy - 4, 2, 4, style.hair);
        p.rect(hx + 3.5, hy - 4, 2, 4, style.hair);
      });
    }
    const eye = style.eyes ?? C('gray', 0.05);
    c.set(hx - 2, hy - 0.5, eye);
    c.set(hx + 2, hy - 0.5, eye);
    if (style.mouth) c.rect(hx - 1.5, hy + 3, 3, pose.mouthOpen ? 2 : 1, style.mouth);
  }

  // Arms (drawn last so they overlap the torso).
  const arm = (side, ap = {}) => {
    const sx = tx + side * (sw - 0.5);
    const sy = shoulderY + 1.5;
    const a = rad(ap.sh ?? 8);
    const ex = sx + side * Math.sin(a) * 9 * s;
    const ey = sy + Math.cos(a) * 9 * s;
    const b = a + rad(ap.el ?? 10);
    const hx2 = ap.hand ? ap.hand[0] : ex + side * Math.sin(b) * 8.5 * s;
    const hy2 = ap.hand ? ap.hand[1] : ey + Math.cos(b) * 8.5 * s;
    layer(c, (p) => {
      p.capsule(sx, sy, ex, ey, 2.4 * build, style.sleeve ?? style.shirt ?? C('beige', 0.85), 2.1 * build);
      p.capsule(ex, ey, hx2, hy2, 2.0 * build, style.forearm ?? style.skin ?? C('skin', 0.6), 1.7 * build);
      p.ellipse(hx2, hy2, 2.2, 2.2, style.hand ?? style.skin ?? C('skin', 0.6));
    });
    J[side < 0 ? 'handL' : 'handR'] = [hx2, hy2];
    J[side < 0 ? 'elbowL' : 'elbowR'] = [ex, ey];
  };
  arm(-1, pose.armL);
  arm(1, pose.armR);
  style.hands?.(c, J, pose);
  return J;
}

/** Standard humanoid animation set. Returns frames for walk(4), attack(n), pain, and the standing pose. */
export const WALK = [
  { bob: 0, armL: { sh: 12, el: 15 }, armR: { sh: 6, el: 30 }, legL: { spread: 1, lift: 3 }, legR: { spread: 3, lift: 0 } },
  { bob: -1, armL: { sh: 9, el: 20 }, armR: { sh: 9, el: 20 }, legL: { spread: 2, lift: 0 }, legR: { spread: 2, lift: 0 } },
  { bob: 0, armL: { sh: 6, el: 30 }, armR: { sh: 12, el: 15 }, legL: { spread: 3, lift: 0 }, legR: { spread: 1, lift: 3 } },
  { bob: -1, armL: { sh: 9, el: 20 }, armR: { sh: 9, el: 20 }, legL: { spread: 2, lift: 0 }, legR: { spread: 2, lift: 0 } },
];

/**
 * Death sequence from a standing frame: recoil, topple backwards, lie in a pool.
 * Returns `count` frames.
 */
export function deathFrames(stand, { count = 5, poolRamp = 'blood', w = stand.w, h = stand.h, gore = true } = {}) {
  const out = [];
  const angles = [0.18, 0.55, 1.05, 1.45, 1.57, 1.57, 1.57, 1.57];
  // Height of the standing figure, so the fallen body can be re-centred.
  let top = h;
  stand.eachOpaque((x, y) => {
    top = Math.min(top, y);
    return undefined;
  });
  const tall = h - 2 - top;
  for (let i = 0; i < count; i++) {
    const f = new PixelCanvas(w, h);
    const last = i >= count - 2;
    if (gore && i >= count - 2) pool(f, w / 2, h - 3, 14 + (i === count - 1 ? 6 : 0), 3, poolRamp);
    const a = angles[Math.min(i, angles.length - 1)];
    const sq = i === 0 ? 0.97 : 1;
    let body = rotate(squash(stand, sq), -a, w / 2, h - 2);
    body = shift(body, Math.round(Math.sin(a) * tall * 0.5), 0);
    f.blit(body, 0, last ? 1 : 0);
    out.push(f);
  }
  return out;
}

export function outlined(c, color = OUTLINE) {
  c.outline(color);
  return c;
}

export { mix, darken, lighten };
