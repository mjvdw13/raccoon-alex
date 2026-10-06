// Effects and projectiles: bullet puffs, blood and bug ichor, explosions,
// teleport fog, fireballs and rockets. Fire is drawn with noisy fullbright gradients.
import { PixelCanvas } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { Model, MAT } from '../lib/model.js';
import { sheet } from '../lib/sprite.js';
import { fbm, hash2, rng } from '../lib/noise.js';

const F = (name) => `assets/sprites/fx/${name}.png`;
const RENDER = { light: [-0.5, -0.65, 0.58], ambient: 0.35, aoStrength: 0.4 };

/** Noisy fire ball. palette: array of colours from hot core to cool rim. */
function fireBlob(c, x, y, r, seed, palette, { density = 1, holes = 0 } = {}) {
  const n = fbm(seed, 64, { cells: 4, octaves: 3 });
  for (let yy = Math.floor(y - r - 2); yy <= Math.ceil(y + r + 2); yy++) {
    for (let xx = Math.floor(x - r - 2); xx <= Math.ceil(x + r + 2); xx++) {
      const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y) / r;
      const v = n((((xx * 2) % 64) + 64) % 64, (((yy * 2) % 64) + 64) % 64);
      const t = d + (v - 0.5) * 0.7;
      if (t > density) continue;
      if (holes && v < holes && d > 0.3) continue;
      const k = Math.min(palette.length - 1, Math.max(0, Math.floor((t / density) * palette.length)));
      c.set(xx, yy, palette[k]);
    }
  }
}

const FIRE = [[255, 255, 255], G('yellow', 0.85), G('yellow', 0.55), G('yellow', 0.3), G('yellow', 0), G('red', 0.5)];
const GREEN = [[255, 255, 255], G('green', 1), G('green', 0.65), G('green', 0.35), G('green', 0)];
const AMBER = [[255, 255, 255], G('pale', 1), G('amber', 1), G('amber', 0), G('yellow', 0.2), G('red', 0.3)];

function smoke(c, x, y, r, seed, t = 0.4) {
  const n = fbm(seed, 64, { cells: 3, octaves: 3 });
  for (let yy = Math.floor(y - r); yy <= Math.ceil(y + r); yy++) {
    for (let xx = Math.floor(x - r); xx <= Math.ceil(x + r); xx++) {
      const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y) / r;
      const v = n((xx + 64) % 64, (yy + 64) % 64);
      if (d + (v - 0.5) * 0.8 > 1) continue;
      if (hash2(xx, yy, seed) > 0.75 + d * 0.2) continue;
      c.set(xx, yy, C('gray', t * (0.6 + v * 0.6)));
    }
  }
}

function puff() {
  return sheet([0, 1, 2, 3].map((f) => {
    const c = new PixelCanvas(16, 16);
    if (f < 2) fireBlob(c, 8, 8, 2.5 + f, 3 + f, [[255, 255, 255], G('yellow', 0.8), G('yellow', 0.4)]);
    if (f >= 1) smoke(c, 8, 8 - f, 2 + f * 1.4, 9 + f, 0.55 - f * 0.08);
    return c;
  }));
}

function blood(ramp) {
  return sheet([0, 1, 2].map((f) => {
    const c = new PixelCanvas(16, 16);
    const r = rng(20 + f);
    for (let k = 0; k < 8 + f * 3; k++) {
      const a = r.range(0, Math.PI * 2);
      const d = r.range(0, 2 + f * 2.2);
      const x = 8 + Math.cos(a) * d;
      const y = 8 + Math.sin(a) * d + f;
      c.set(x, y, r.chance(0.3) ? C(ramp, 0.7) : C(ramp, 0.45));
      if (f < 2 && r.chance(0.5)) c.set(x + 1, y, C(ramp, 0.35));
    }
    return c;
  }));
}

function explosion(size = 64, palette = FIRE, seed = 31, frames = 5) {
  const out = [];
  for (let f = 0; f < frames; f++) {
    const c = new PixelCanvas(size, size);
    const cx = size / 2;
    const cy = size / 2 + 4;
    const t = f / (frames - 1);
    if (f >= 2) smoke(c, cx, cy - f * 2, size * (0.18 + t * 0.2), seed + f, 0.45 - t * 0.2);
    fireBlob(c, cx, cy, size * (0.16 + t * 0.2), seed + f * 3, palette.slice(Math.min(2, f)), { density: 1 - t * 0.25, holes: t * 0.45 });
    out.push(c);
  }
  return out;
}

function teleportFog() {
  return sheet([0, 1, 2, 3, 4, 5].map((f) => {
    const c = new PixelCanvas(48, 64);
    const r = rng(60 + f);
    const spread = 6 + f * 2.5;
    for (let k = 0; k < 60 - f * 6; k++) {
      const x = 24 + r.range(-spread, spread);
      const y = 60 - r.range(0, 50) * (0.4 + f * 0.1);
      const col = r.chance(0.3) ? G('cyan', 1) : r.chance(0.5) ? G('green', 0.8) : G('green', 0.4);
      c.set(x, y, col);
      if (f < 3) c.set(x, y - 1, G('green', 0.3));
    }
    if (f < 3) fireBlob(c, 24, 42, 5 + f * 3, 70 + f, [[255, 255, 255], G('cyan', 1), G('green', 0.7)], { holes: 0.3 });
    return c;
  }));
}

/** A burning exception, thrown by the Exception Firefly. */
function exceptionFireball() {
  const fly = [0, 1].map((f) => {
    const c = new PixelCanvas(32, 32);
    fireBlob(c, 16, 15 - f, 9 + f, 80 + f, FIRE, { holes: 0.2 });
    c.rect(14, 9 - f, 4, 8, G('red', 0));
    c.rect(14, 19 - f, 4, 3, G('red', 0));
    return c;
  });
  return sheet([...fly, ...explosion(32, FIRE, 83, 3)]);
}

function acidGlob() {
  const fly = [0, 1].map((f) => {
    const c = new PixelCanvas(32, 32);
    fireBlob(c, 16, 16, 8 + f, 90 + f, GREEN);
    return c;
  });
  return sheet([...fly, ...explosion(32, GREEN, 93, 3)]);
}

/** A ball of rolled-up garbage, thrown by the Garbage Collector. */
function trashBall() {
  const spin = [0, 1, 2, 3].map((f) => {
    const m = new Model(32, 32, { seed: 95 });
    const a = (f / 4) * Math.PI * 2;
    m.ellipsoid(16, 17, 0, 8, 7.6, 7, C('olive', 0.22), MAT.bag);
    const bits = [C('beige', 0.75), C('steel', 0.6), C('yellow', 0.72), C('blood', 0.55)];
    bits.forEach((col, k) => {
      const t = a + (k / bits.length) * Math.PI * 2;
      m.ellipsoid(16 + Math.cos(t) * 4.5, 17 + Math.sin(t) * 4.2, 5 + Math.cos(t * 0.5), 2.2, 1.6, 1.5, col, k % 2 ? MAT.metal : MAT.paper);
    });
    return m.render(RENDER);
  });
  const splat = [0, 1, 2].map((f) => {
    const c = new PixelCanvas(32, 32);
    const r = rng(97 + f);
    for (let k = 0; k < 40; k++) {
      const a = r.range(0, Math.PI * 2);
      const d = r.range(0, 4 + f * 4);
      const col = r.pick([C('olive', 0.35), C('rust', 0.3), C('toxic', 0.5), C('beige', 0.6), C('gray', 0.15)]);
      c.set(16 + Math.cos(a) * d, 20 + Math.sin(a) * d * 0.6 + f, col);
    }
    return c;
  });
  return sheet([...spin, ...splat]);
}

function rocket(kind) {
  const fly = [0, 1].map((f) => {
    const c = new PixelCanvas(64, 64);
    // Exhaust flame behind (the projectile flies away from or toward the viewer).
    fireBlob(c, 32, 32, 7 + f * 1.5, 110 + f, FIRE, { holes: 0.3 });
    const m = new Model(64, 64, { seed: 111 });
    if (kind === 'pumpkin') {
      // A little jack-o'-lantern, spat out burning, grinning as it comes.
      for (const [dx, rx] of [[-3, 4.5], [3, 4.5], [0, 5.5]]) m.ellipsoid(32 + dx, 31, 4, rx, 5.5, 5, C('orange', 0.58), MAT.plastic);
      m.capsule(32, 26, 6, 33 + f, 23, 6, 1.2, 0.8, C('olive', 0.35), MAT.wood);
      for (const pts of [[[27, 30], [30, 30], [28.5, 27.5]], [[34, 30], [37, 30], [35.5, 27.5]], [[28, 32.5], [36, 32.5], [34.5, 35], [29.5, 35]]]) m.paintPoly(pts, G('yellow', 0.8), MAT.glow);
    } else {
      m.slab([[25, 26], [39, 26], [39, 36], [25, 36]], 6, C('gray', 0.18), MAT.plastic, { bevel: 2.5, thickness: 2 });
      m.paint(32, 31, 6, 1.2, C('blood', 0.5));
    }
    c.blit(m.render(RENDER), 0, 0);
    return c;
  });
  return sheet([...fly, ...explosion(64, FIRE, kind === 'pumpkin' ? 121 : 131, 4)]);
}

function bfcBlast() {
  const fly = [0, 1].map((f) => {
    const c = new PixelCanvas(64, 64);
    fireBlob(c, 32, 32, 16 + f * 2, 140 + f, AMBER, { holes: 0.15 });
    smoke(c, 22 + f * 4, 18, 5, 144 + f, 0.7);
    return c;
  });
  return sheet([...fly, ...explosion(64, AMBER, 151, 5)]);
}

export default [
  { name: 'puff', out: F('puff'), draw: puff },
  { name: 'blood', out: F('blood'), draw: () => blood('blood') },
  { name: 'ichor', out: F('ichor'), draw: () => blood('toxic') },
  { name: 'explosion', out: F('explosion'), draw: () => sheet(explosion(64, FIRE, 31, 5)) },
  { name: 'teleport-fog', out: F('teleport-fog'), draw: teleportFog },
  { name: 'exception-fireball', out: F('exception-fireball'), draw: exceptionFireball },
  { name: 'acid-glob', out: F('acid-glob'), draw: acidGlob },
  { name: 'trash-ball', out: F('trash-ball'), draw: trashBall, dither: 'fs' },
  { name: 'toner-rocket', out: F('toner-rocket'), draw: () => rocket('toner') },
  { name: 'pumpkin-bomb', out: F('pumpkin-bomb'), draw: () => rocket('pumpkin') },
  { name: 'bfc-blast', out: F('bfc-blast'), draw: bfcBlast },
];

export { fireBlob, smoke, FIRE };
