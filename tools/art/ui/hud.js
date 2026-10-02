// Status bar background, HUD icons, menu cursor and favicon.
import { PixelCanvas, mix } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { fbm, hash2, seedFrom, rng } from '../lib/noise.js';

/** Panel layout shared with src/engine/ui/hud.js (x, width). */
export const PANELS = {
  ammo: [2, 44],
  health: [48, 56],
  arms: [106, 34],
  face: [142, 36],
  armor: [180, 56],
  keys: [238, 12],
  tally: [252, 66],
};

function inset(c, x, y, w, h, fill) {
  c.rect(x, y, w, h, fill);
  c.rect(x, y, w, 1, C('gray', 0.04));
  c.rect(x, y, 1, h, C('gray', 0.06));
  c.rect(x, y + h - 1, w, 1, C('steel', 0.5));
  c.rect(x + w - 1, y, 1, h, C('steel', 0.45));
}

function statusBar() {
  const W = 320;
  const H = 32;
  const c = new PixelCanvas(W, H);
  const seed = seedFrom('statusbar');
  const n = fbm(seed, 64, { cells: 4, octaves: 4 });
  const r = rng(seed);
  c.each((x, y) => {
    const t = 0.24 + n(x % 64, y + (x >> 6) * 7) * 0.12 + (hash2(x, y, seed) - 0.5) * 0.04;
    return C('steel', t);
  });
  // Rust blooms and grime.
  for (let i = 0; i < 14; i++) {
    const x = r.int(0, W - 1);
    const y = r.int(0, H - 1);
    c.ellipse(x, y, r.range(2, 5), r.range(1, 3), mix(c.get(x, y) ?? C('steel', 0.3), C('rust', 0.3), 0.5));
  }
  // Scratches.
  for (let i = 0; i < 40; i++) {
    const x = r.int(0, W - 1);
    const y = r.int(0, H - 1);
    const len = r.int(2, 7);
    for (let k = 0; k < len; k++) c.set(x + k, y + (k >> 2), C('steel', 0.55));
  }
  c.rect(0, 0, W, 1, C('steel', 0.6));
  c.rect(0, 1, W, 1, C('steel', 0.45));
  c.rect(0, H - 1, W, 1, C('gray', 0.04));
  for (const [x, w] of Object.values(PANELS)) {
    const fill = C('gray', 0.07);
    inset(c, x, 3, w, 27, fill);
  }
  // Face backdrop: a dim, dirty red.
  const [fx, fw] = PANELS.face;
  for (let y = 4; y < 29; y++) {
    for (let x = fx + 1; x < fx + fw - 1; x++) c.set(x, y, mix(C('blood', 0.18), C('gray', 0.05), (y - 4) / 30 + hash2(x, y, 3) * 0.15));
  }
  // Rivets.
  for (const x of [1, 46, 104, 140, 178, 236, 250, 318]) {
    c.set(x, 4, C('steel', 0.8));
    c.set(x, 27, C('steel', 0.8));
  }
  return c;
}

/** Key badge icons (8x10): blue, yellow, red; plus small skull-ish "berserk" mark. */
function hudIcons() {
  const c = new PixelCanvas(8 * 4, 10);
  const badge = (i, ramp, glow) => {
    const ox = i * 8;
    c.rect(ox + 1, 2, 6, 8, C(ramp, 0.55));
    c.rect(ox + 1, 2, 6, 1, C(ramp, 0.85));
    c.rect(ox + 2, 4, 2, 2, C('beige', 0.9)); // photo
    c.rect(ox + 4, 4, 2, 1, C('gray', 0.2));
    c.rect(ox + 4, 6, 2, 1, C('gray', 0.2));
    c.rect(ox + 2, 7, 4, 1, G(glow, 0.8));
    c.rect(ox + 3, 0, 2, 2, C('gray', 0.7)); // clip
    c.frame(ox, 1, 8, 9, C('gray', 0.05));
  };
  badge(0, 'steel', 'cyan');
  badge(1, 'yellow', 'yellow');
  badge(2, 'blood', 'red');
  // 3: berserk espresso cup
  c.rect(25, 3, 5, 6, C('beige', 0.9));
  c.rect(30, 4, 1, 3, C('beige', 0.9));
  c.rect(26, 3, 3, 1, C('rust', 0.15));
  return c;
}

/** Spinning raccoon head menu cursor (2 frames, 16x16). */
function raccoonHead(blink) {
  const c = new PixelCanvas(16, 16);
  const fur = C('gray', 0.55);
  const dark = C('gray', 0.08);
  c.poly([[2, 1], [6, 4], [2, 6]], fur);
  c.poly([[14, 1], [10, 4], [14, 6]], fur);
  c.set(3, 3, C('flesh', 0.5));
  c.set(12, 3, C('flesh', 0.5));
  c.ellipse(8, 9, 7, 6, fur);
  c.ellipse(8, 7, 5, 2, C('gray', 0.85)); // pale brow fur
  c.rect(2, 8, 12, 3, dark); // the mask
  c.rect(7, 8, 2, 1, C('gray', 0.4));
  if (!blink) {
    c.rect(4, 9, 2, 1, G('yellow', 0.9));
    c.rect(10, 9, 2, 1, G('yellow', 0.9));
  }
  c.ellipse(8, 13, 3, 2, C('gray', 0.9)); // muzzle
  c.rect(7, 12, 2, 1, dark); // nose
  c.outline(C('gray', 0.02));
  return c;
}

function cursor() {
  const c = new PixelCanvas(32, 16);
  c.blit(raccoonHead(false), 0, 0);
  c.blit(raccoonHead(true), 16, 0);
  return c;
}

function favicon() {
  const c = new PixelCanvas(32, 32);
  const head = raccoonHead(false).scale(2);
  c.blit(head, 0, 0);
  return c;
}

export default [
  { name: 'statusbar', out: 'assets/ui/statusbar.png', draw: statusBar },
  { name: 'hud-icons', out: 'assets/ui/hud-icons.png', draw: hudIcons },
  { name: 'cursor', out: 'assets/ui/cursor.png', draw: cursor },
  { name: 'favicon', out: 'assets/ui/favicon.png', draw: favicon },
];
