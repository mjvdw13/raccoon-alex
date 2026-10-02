// Alex's status-bar face (Doom "mugshot" layout) and the big title portrait,
// sculpted with the clay-model renderer for a shaded, digitized look.
//
// Sheet layout (24x30 frames): five rows of health tiers (healthy -> wrecked),
// each with 8 frames: [look ahead, look left, look right, turn right, turn left,
// ouch, evil grin, rampage]; then a final row: [well rested (god mode), dead].
import { PixelCanvas, mix, darken, lighten } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { Model, MAT } from '../lib/model.js';

export const FACE_W = 24;
export const FACE_H = 30;

const SKIN = C('skin', 0.78);
const HAIR = C('rust', 0.15);
const BAGS = mix(C('purple', 0.18), C('blood', 0.2), 0.3);
const MASK = C('gray', 0.07);

/**
 * Model one face. k scales everything (1 = 24x30 status bar, 3 = title portrait).
 * o: { tier 0..4, look -1|0|1, turn -1|0|1, expr 'neutral'|'ouch'|'grin'|'rampage'|'god'|'dead' }
 */
export function faceModel(o = {}, k = 1) {
  const tier = o.tier ?? 0;
  const turn = o.turn ?? 0;
  const look = o.look ?? 0;
  const expr = o.expr ?? 'neutral';
  const god = expr === 'god';
  const dead = expr === 'dead';
  const m = new Model(Math.round(FACE_W * k), Math.round(FACE_H * k), { seed: 401 + tier });
  const P = (v) => v * k;
  const fx = (x) => P(x + turn * 1.6); // facial features shift when the head turns
  const skin = dead ? mix(SKIN, C('gray', 0.5), 0.45) : SKIN;

  // Shirt collar, loosened tie, neck.
  m.slab([[P(1), P(30)], [P(5), P(25)], [P(12), P(27)], [P(19), P(25)], [P(23), P(30)]], P(2), C('beige', 0.8), MAT.cloth, { bevel: P(2), thickness: P(1) });
  m.slab([[P(10.5), P(26.5)], [P(13.5), P(26.5)], [P(14.5), P(30)], [P(9.5), P(30)]], P(4), C('blood', 0.45), MAT.cloth, { bevel: P(0.8) });
  m.capsule(P(12), P(21), P(1), P(12), P(26), P(1), P(3.6), P(3.8), darken(skin, 0.1), MAT.skin);

  // Head, jaw, cheeks, ears.
  m.ellipsoid(P(12 + turn * 0.4), P(14), P(2), P(8.2), P(10.4), P(8), skin, MAT.skin);
  m.ellipsoid(fx(12), P(20), P(3.5), P(6.4), P(4.4), P(6.2), skin, MAT.skin);
  m.ellipsoid(fx(7.5), P(16.5), P(6.5), P(2.6), P(2.2), P(3), skin, MAT.skin);
  m.ellipsoid(fx(16.5), P(16.5), P(6.5), P(2.6), P(2.2), P(3), skin, MAT.skin);
  m.ellipsoid(P(3.6 + turn * 0.6), P(14.5), P(0), P(1.6), P(2.6), P(1.8), darken(skin, 0.05), MAT.skin);
  m.ellipsoid(P(20.4 + turn * 0.6), P(14.5), P(0), P(1.6), P(2.6), P(1.8), darken(skin, 0.05), MAT.skin);
  // Brow ridge and nose.
  m.ellipsoid(fx(12), P(10.2), P(7.5), P(6.2), P(1.6), P(2.6), skin, MAT.skin);
  m.capsule(fx(12), P(11.5), P(9), fx(12), P(16.5), P(10.5), P(1.1), P(1.5), skin, MAT.skin);
  m.sphere(fx(12), P(17), P(10.4), P(1.5), lighten(skin, 0.02), MAT.skin);

  // Stubble: darker grain on the jaw (worse with each tier).
  const stubble = 0.06 + tier * 0.035;
  m.tint((x, y, c) => {
    const ux = x / k;
    const uy = y / k;
    if (uy < 18.5 || uy > 25 || Math.abs(ux - fx(12) / k) > 7.5) return undefined;
    if (Math.abs(ux - fx(12) / k) < 2.2 && uy < 21) return undefined;
    const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return h - Math.floor(h) < 0.5 ? mix(c, C('rust', 0.2), stubble * 2.2) : undefined;
  });

  // Eyes.
  const eyeY = P(12.6);
  const eyes = [fx(8.6), fx(15.4)];
  const masked = tier >= 3 && !god && !dead;
  for (const ex of eyes) {
    m.dent(ex, eyeY, P(2.4), P(1.6), 1.3);
    // Puffy, bruised bags under the eyes: the man's defining feature.
    if (!god) {
      const size = 1 + tier * 0.18;
      m.ellipsoid(ex, eyeY + P(2.3), P(7.6), P(2.5) * size, P(1.3) * size, P(1.4), skin, MAT.skin);
      m.paint(ex, eyeY + P(2.2), P(2.4) * size, P(1.25) * size, mix(skin, BAGS, Math.min(0.92, 0.55 + tier * 0.1)));
      m.paint(ex, eyeY + P(1.5), P(2) * size, P(0.5), mix(skin, BAGS, 0.9));
    }
  }
  if (masked) {
    // Full raccoon mask: black band over the eyes with pale fur above.
    const top = eyeY - P(tier >= 4 ? 2.6 : 2.2);
    const bottom = eyeY + P(tier >= 4 ? 4.2 : 3.4);
    m.paintPoly([[fx(2.5), top + P(1)], [fx(21.5), top + P(1)], [fx(20), bottom], [fx(13.5), bottom - P(1)], [fx(12), bottom + P(0.5)], [fx(10.5), bottom - P(1)], [fx(4), bottom]], MASK);
    m.paintPoly([[fx(4), top - P(1.2)], [fx(20), top - P(1.2)], [fx(21), top + P(0.6)], [fx(3), top + P(0.6)]], C('gray', 0.75));
  }
  for (const ex of eyes) {
    if (dead) {
      m.stroke(ex - P(1.6), eyeY + P(0.3), ex + P(1.6), eyeY + P(0.3), P(0.8), darken(skin, 0.55));
      continue;
    }
    const ouch = expr === 'ouch';
    const lid = tier >= 4 ? P(0.5) : 0;
    const white = god ? G('yellow', 1) : masked ? C('gray', 0.92) : C('beige', 0.9);
    m.paint(ex, eyeY + lid * 0.5, P(2.1), P(ouch ? 1.5 : 1.15) - lid * 0.5, white, god ? MAT.glow : MAT.eye);
    if (tier >= 1 && !god) m.paint(ex + (look > 0 ? -P(1.3) : P(1.3)), eyeY + P(0.2), P(0.45), P(0.45), C('blood', 0.65));
    const px = ex + P(look * 1) + P(turn * 0.6);
    const pupil = god ? G('yellow', 0.4) : expr === 'rampage' ? C('blood', 0.4) : C('rust', 0.12);
    m.paint(px, eyeY + lid * 0.5, P(0.85), P(0.85), pupil, god ? MAT.glow : MAT.eye);
    if (!god) m.paint(px - P(0.3), eyeY - P(0.3), P(0.3), P(0.3), C('beige', 0.95), MAT.eye); // catchlight
    if (tier >= 2 && !ouch) m.paint(ex, eyeY - P(0.9), P(2), P(0.45), mix(skin, BAGS, 0.5)); // heavy lids
  }
  // Eyebrows.
  eyes.forEach((ex, i) => {
    const out = i === 0 ? -1 : 1;
    let yo = P(10.4);
    let yi = P(10.4);
    if (expr === 'ouch') {
      yo = P(9.4);
      yi = P(8.8);
    } else if (expr === 'rampage' || expr === 'grin') {
      yi = P(11.2);
      yo = P(9.6);
    } else if (!god) {
      yo = P(11); // droopy, exhausted
    }
    m.stroke(ex + out * P(2.4), yo, ex - out * P(1.8), yi, P(0.9), masked ? C('gray', 0.2) : HAIR);
  });

  // Mouth.
  const mx = fx(12);
  const my = P(21);
  switch (expr) {
    case 'ouch':
      m.dent(mx, my + P(0.4), P(2), P(1.8), 1.6);
      m.paint(mx, my + P(0.4), P(1.7), P(1.6), C('blood', 0.15));
      break;
    case 'grin':
    case 'god':
      m.dent(mx, my, P(3.4), P(1.1), 1.2);
      m.paint(mx, my, P(3.3), P(1), C('blood', 0.2));
      m.paint(mx, my - P(0.3), P(3), P(0.55), C('beige', 0.92), MAT.glass);
      if (god) m.dot(mx + P(1.5), my - P(0.4), G('yellow', 1), MAT.glow);
      break;
    case 'rampage':
      m.paint(mx, my, P(3.2), P(1), C('beige', 0.88), MAT.glass);
      for (let x = -2; x <= 2; x += 2) m.paint(mx + P(x), my, P(0.25), P(1), C('gray', 0.35));
      break;
    case 'dead':
      m.dent(mx, my + P(0.5), P(1.6), P(1.2), 1.4);
      m.paint(mx, my + P(0.5), P(1.4), P(1), C('blood', 0.15));
      break;
    default:
      m.stroke(mx - P(2.2), my + P(0.4), mx + P(2.2), my + P(0.4), P(0.7), darken(skin, 0.5));
      m.stroke(mx - P(2.5), my + P(0.6), mx - P(2.9), my + P(1.1), P(0.6), darken(skin, 0.4));
  }

  // Damage: bruises and blood.
  if (tier >= 2 && !god) m.paint(fx(17.5), P(17.5), P(1.6), P(1.3), mix(skin, C('purple', 0.3), 0.6));
  if (tier >= 3 && !god) {
    m.stroke(fx(15.5), P(5), fx(16.5), P(11), P(0.8), C('blood', 0.5));
    m.paint(fx(6), P(21.5), P(0.8), P(1.2), C('blood', 0.5));
  }
  if (tier >= 4 && !god) {
    m.stroke(fx(8.5), P(4.5), fx(7.8), P(10), P(0.9), C('blood', 0.45));
    m.paint(fx(14.5), P(22.5), P(0.7), P(1.4), C('blood', 0.55));
  }

  // Hair: messy, wilder each tier.
  m.ellipsoid(P(12 + turn * 0.4), P(6.4), P(4), P(8.8), P(5.4), P(7), HAIR, MAT.hair);
  m.ellipsoid(P(4.2 + turn * 0.5), P(9.5), P(1.5), P(2), P(3.4), P(3), HAIR, MAT.hair);
  m.ellipsoid(P(19.8 + turn * 0.5), P(9.5), P(1.5), P(2), P(3.4), P(3), HAIR, MAT.hair);
  const tufts = [[5, 2.5], [8.5, 0.8], [12, 1.4], [15.5, 0.6], [19, 2.4]];
  tufts.forEach(([x, y], i) => {
    const wild = tier >= 2 && i % 2 === 0 ? -1.2 : 0;
    m.capsule(P(x + turn * 0.4), P(5), P(5), P(x + (i % 2 ? 1.4 : -1.4) + turn * 0.4), P(y + wild), P(4), P(1.6), P(0.5), HAIR, MAT.hair);
  });
  for (let x = 7; x <= 17; x += 2.5) m.capsule(fx(x), P(5.5), P(7.5), fx(x + 0.8), P(8.4 + (x % 3)), P(8.5), P(1.2), P(0.6), HAIR, MAT.hair);

  const c = m.render({ light: [-0.35, -0.45, 0.85], ambient: 0.45, aoStrength: 0.35, contrast: 1 });
  if (dead) {
    const z = G('yellow', 1);
    for (const [x, y] of [[0, 0], [1, 0], [2, 0], [1, 1], [0, 2], [1, 2], [2, 2]]) c.set(Math.round(P(19)) + x, Math.round(P(1)) + y, z);
  }
  return c;
}

export function faceSheet() {
  const sheet = new PixelCanvas(FACE_W * 8, FACE_H * 6);
  const frames = [{ look: 0 }, { look: -1 }, { look: 1 }, { turn: 1, look: 1 }, { turn: -1, look: -1 }, { expr: 'ouch' }, { expr: 'grin' }, { expr: 'rampage' }];
  for (let tier = 0; tier < 5; tier++) {
    frames.forEach((f, i) => sheet.blit(faceModel({ tier, ...f }), i * FACE_W, tier * FACE_H));
  }
  sheet.blit(faceModel({ tier: 0, expr: 'god' }), 0, 5 * FACE_H);
  sheet.blit(faceModel({ tier: 2, expr: 'dead' }), FACE_W, 5 * FACE_H);
  return sheet;
}

/** Used by the "Employee of the Month" poster texture. */
export const drawFace = (o) => faceModel(o, 1);

export default [{ name: 'face', out: 'assets/ui/face.png', draw: faceSheet, dither: 'fs' }];
