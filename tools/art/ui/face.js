// Alex's status-bar face (Doom "mugshot" layout) and the big title portrait.
//
// Sheet layout (24x30 frames): five rows of health tiers (healthy -> wrecked),
// each with 8 frames: [look ahead, look left, look right, turn right, turn left,
// ouch, evil grin, rampage]; then a final row: [well rested (god mode), dead].
import { PixelCanvas, mix, darken, lighten } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';

export const FACE_W = 24;
export const FACE_H = 30;

const SKIN = C('skin', 0.7);
const SKIN_LO = C('skin', 0.5);
const HAIR = C('rust', 0.16);
const HAIR_HI = C('rust', 0.28);
const STUBBLE = C('rust', 0.3);
const OUTLINE = C('gray', 0.03);

/**
 * Draw one face.
 * @param {{tier?:number, look?:-1|0|1, turn?:-1|0|1, expr?:'neutral'|'ouch'|'grin'|'rampage'|'god'|'dead'}} o
 */
export function drawFace(o = {}) {
  const tier = o.tier ?? 0;
  const turn = o.turn ?? 0;
  const look = o.look ?? 0;
  const expr = o.expr ?? 'neutral';
  const c = new PixelCanvas(FACE_W, FACE_H);
  const sx = turn * 1.5; // features shift when the head turns

  // Neck and shirt collar.
  c.rect(9, 24, 6, 6, SKIN_LO);
  c.poly([[3, 30], [7, 26], [12, 28], [17, 26], [21, 30]], C('beige', 0.82));
  c.poly([[11, 27], [13, 27], [14, 30], [10, 30]], C('blood', 0.55)); // loosened tie
  c.set(12, 27, C('blood', 0.75));

  // Head.
  c.ellipse(12 + sx * 0.3, 15, 8.6, 11.2, SKIN);
  // Ears.
  c.ellipse(3.5 + sx * 0.2, 15.5, 1.6, 2.6, SKIN_LO);
  c.ellipse(20.5 + sx * 0.2, 15.5, 1.6, 2.6, SKIN_LO);
  // Turned heads: shade the far side.
  if (turn) {
    c.eachOpaque((x, y, p) => {
      const far = turn > 0 ? x < 8 : x > 16;
      return far && y > 4 && y < 27 ? darken(p, 0.18) : undefined;
    });
  }
  // Cheek/jaw shading and highlight.
  c.eachOpaque((x, y, p) => {
    if (y >= 21 && y <= 25 && (x <= 6 || x >= 17)) return darken(p, 0.12);
    if (y >= 9 && y <= 11 && x >= 8 && x <= 15 && p[0] > 150) return lighten(p, 0.06);
    return undefined;
  });
  // Stubble along the jaw (more of it the worse it gets).
  for (let y = 21; y <= 25; y++) {
    for (let x = 5; x <= 18; x++) {
      const jaw = y >= 23 || x <= 6 || x >= 17;
      if (jaw && (x * 7 + y * 13) % (tier >= 3 ? 2 : 3) === 0 && c.opaque(x, y)) c.set(x, y, mix(c.get(x, y), STUBBLE, 0.45));
    }
  }

  // Hair: messy, getting wilder each tier.
  const hx = 12 + sx * 0.3;
  c.ellipse(hx, 6.5, 9.2, 5.6, HAIR);
  c.rect(3, 6, 2, 6, HAIR);
  c.rect(19, 6, 2, 6, HAIR);
  const spikes = [[4, 2], [7, 0], [10, 1], [13, 0], [16, 1], [19, 3]];
  spikes.forEach(([x, y], i) => {
    const wild = tier >= 2 && i % 2 === 0 ? -1 : 0;
    c.capsule(x + sx * 0.3, y + 4, x + (i % 2 ? 1 : -1) + sx * 0.3, y + wild, 1, HAIR);
  });
  for (let x = 5; x < 19; x += 2) c.set(x + sx * 0.3, 4 + (x % 3), HAIR_HI);
  // Fringe over the forehead.
  for (let x = 6; x <= 17; x++) {
    const len = 8 + ((x * 5) % 3);
    for (let y = 7; y < len; y++) c.set(x + sx * 0.3, y, HAIR);
  }

  // Eyes.
  const eyeY = 12;
  const eyes = [6 + sx, 14 + sx];
  const asleep = expr === 'dead';
  const mask = tier >= 3 && expr !== 'god';
  if (mask) {
    // The full raccoon mask: pale fur above, black band over the eyes.
    const top = tier >= 4 ? 10 : 11;
    const bottom = tier >= 4 ? 17 : 16;
    for (let x = 4; x <= 19; x++) if (c.opaque(x, top - 1)) c.set(x, top - 1, C('gray', 0.78));
    for (let y = top; y <= bottom; y++) {
      for (let x = 3; x <= 20; x++) {
        const corner = (y === bottom && (x < 6 || x > 17)) || (y === top && (x < 4 || x > 19));
        const bridge = (x === 11 || x === 12) && y >= bottom - 1;
        if (!corner && !bridge && c.opaque(x, y)) c.set(x, y, y >= bottom - 1 ? C('gray', 0.1) : C('gray', 0.05));
      }
    }
  }
  for (const ex of eyes) {
    const x = Math.round(ex);
    if (asleep) {
      c.rect(x, eyeY + 1, 4, 1, darken(SKIN, 0.6));
      c.rect(x, eyeY + 2, 4, 1, mix(SKIN, C('purple', 0.25), 0.6));
      continue;
    }
    // Bags under the eyes. Even "healthy" Alex has them.
    if (!mask && expr !== 'god') {
      const rows = 2 + (tier >= 2 ? 1 : 0);
      for (let r = 0; r < rows; r++) {
        const w = r === rows - 1 ? 3 : 4;
        const dark = 0.5 + tier * 0.13 - r * 0.12;
        c.rect(x + (r === rows - 1 ? 0 : 0), eyeY + 2 + r, w, 1, mix(SKIN, C('purple', 0.12), Math.min(0.9, dark)));
      }
    }
    const lidDrop = tier >= 4 ? 1 : 0;
    const white = expr === 'god' ? G('yellow', 1) : mask ? C('gray', 0.95) : C('beige', 0.95);
    const ouch = expr === 'ouch';
    c.rect(x, eyeY - (ouch ? 1 : 0) + lidDrop, 4, 2 + (ouch ? 1 : 0) - lidDrop, white);
    if (tier >= 1 && expr !== 'god') c.set(x + (look > 0 ? 0 : 3), eyeY + 1, C('blood', 0.75)); // bloodshot
    const px = Math.max(x, Math.min(x + 3, x + 1 + look + (turn ? turn : 0) + (look > 0 ? 1 : 0)));
    const pupil = expr === 'god' ? G('yellow', 0.5) : expr === 'rampage' ? C('blood', 0.6) : C('gray', 0.04);
    c.set(px, eyeY + 1, pupil);
    if (!ouch && lidDrop === 0) c.set(px, eyeY, pupil);
    if (tier >= 2 && !lidDrop && expr !== 'god') c.rect(x, eyeY, 4, 1, mix(white, SKIN_LO, 0.55)); // heavy lids
  }
  // Eyebrows: tired by default, angry for rampage/grin, raised for ouch.
  for (const [i, ex] of eyes.entries()) {
    const x = Math.round(ex);
    const outer = i === 0 ? x - 1 : x + 4;
    const inner = i === 0 ? x + 4 : x - 1;
    let yo = eyeY - 2;
    let yi = eyeY - 2;
    if (expr === 'ouch') {
      yo = eyeY - 3;
      yi = eyeY - 4;
    } else if (expr === 'rampage' || expr === 'grin') {
      yi = eyeY - 1;
      yo = eyeY - 3;
    } else if (expr !== 'god') {
      yo = eyeY - 1; // droopy, exhausted
    }
    c.line(outer, yo, inner, yi, mask ? C('gray', 0.18) : HAIR);
  }

  // Nose.
  const nx = 11 + sx;
  c.rect(nx + 1, 13, 1, 4, SKIN_LO);
  c.set(nx, 17, SKIN_LO);
  c.set(nx + 2, 17, darken(SKIN, 0.3));

  // Mouth.
  const mx = 9 + sx;
  const my = 20;
  switch (expr) {
    case 'ouch':
      c.ellipse(mx + 3, my + 1, 2, 2, C('blood', 0.2));
      c.rect(mx + 2, my, 2, 1, C('beige', 0.9));
      break;
    case 'grin':
    case 'god':
      c.rect(mx, my, 6, 2, C('blood', 0.25));
      c.rect(mx + 1, my, 4, 1, C('beige', 0.95));
      c.set(mx - 1, my - 1, darken(SKIN, 0.4));
      c.set(mx + 6, my - 1, darken(SKIN, 0.4));
      if (expr === 'god') c.set(mx + 4, my, G('yellow', 1));
      break;
    case 'rampage':
      c.rect(mx, my, 6, 2, C('beige', 0.9));
      for (let x = mx; x < mx + 6; x += 2) c.set(x, my + 1, C('gray', 0.4));
      c.rect(mx - 1, my - 1, 8, 1, darken(SKIN, 0.35));
      break;
    case 'dead':
      c.ellipse(mx + 3, my + 1, 2, 1.4, C('blood', 0.2));
      c.set(mx + 5, my + 3, C('steel', 0.8)); // drool
      break;
    default:
      c.rect(mx + 1, my, 4, 1, darken(SKIN, 0.45));
      c.set(mx, my + 1, darken(SKIN, 0.3));
      c.set(mx + 5, my + 1, darken(SKIN, 0.3));
  }

  // Damage: bruises and blood for the lower tiers.
  if (tier >= 2 && expr !== 'god') {
    c.ellipse(17 + sx, 18, 1.6, 1.4, mix(SKIN, C('purple', 0.3), 0.5));
  }
  if (tier >= 3 && expr !== 'god') {
    for (let y = 8; y < 13; y++) c.set(16 + sx + (y % 2), y, C('blood', 0.55));
    c.set(6, 21, C('blood', 0.6));
    c.set(6, 22, C('blood', 0.5));
  }
  if (tier >= 4 && expr !== 'god') {
    c.capsule(9 + sx, 2 + 6, 8 + sx, 13, 0.7, C('blood', 0.5));
    c.ellipse(6, 19, 1.5, 1.2, C('blood', 0.45));
    c.set(14 + sx, 22, C('blood', 0.6));
  }
  if (expr === 'dead') {
    // Finally asleep.
    const z = G('yellow', 1);
    c.rect(19, 1, 3, 1, z);
    c.set(20, 2, z);
    c.rect(19, 3, 3, 1, z);
  }

  c.outline(OUTLINE);
  return c;
}

export function faceSheet() {
  const sheet = new PixelCanvas(FACE_W * 8, FACE_H * 6);
  for (let tier = 0; tier < 5; tier++) {
    const frames = [
      { look: 0 },
      { look: -1 },
      { look: 1 },
      { turn: 1, look: 1 },
      { turn: -1, look: -1 },
      { expr: 'ouch' },
      { expr: 'grin' },
      { expr: 'rampage' },
    ];
    frames.forEach((f, i) => sheet.blit(drawFace({ tier, ...f }), i * FACE_W, tier * FACE_H));
  }
  sheet.blit(drawFace({ tier: 0, expr: 'god' }), 0, 5 * FACE_H);
  sheet.blit(drawFace({ tier: 2, expr: 'dead' }), FACE_W, 5 * FACE_H);
  return sheet;
}

export default [{ name: 'face', out: 'assets/ui/face.png', draw: faceSheet }];
