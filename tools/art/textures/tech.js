// Server room and elevator textures (some animated).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  texture, noiseFill, mottle, speckle, stain, scratches, grimeGradient, bevel, rivet, tinyText,
  C, darken, hash2, PixelCanvas,
} from '../lib/tex.js';
import { G } from '../lib/pal.js';
import { loadPhoto, crop, resize } from '../lib/photo.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const T = (name) => `assets/textures/${name}.png`;

function strip(frames) {
  const out = new PixelCanvas(64 * frames.length, 64);
  frames.forEach((f, i) => out.blit(f, i * 64, 0));
  return out;
}

function serverRack() {
  const frames = [];
  for (let f = 0; f < 4; f++) {
    const { c, seed } = texture('server-rack');
    c.fill(C('gray', 0.08));
    // Two racks side by side.
    for (const rx of [0, 32]) {
      bevel(c, rx, 0, 32, 64, C('steel', 0.22), { depth: 1, fill: false });
      c.rect(rx + 1, 0, 2, 64, C('steel', 0.3));
      c.rect(rx + 29, 0, 2, 64, C('steel', 0.3));
      let y = 3;
      let unit = 0;
      while (y < 60) {
        const h = hash2(rx, unit, 9) > 0.6 ? 7 : 4;
        bevel(c, rx + 4, y, 24, h - 1, C('steel', 0.18 + hash2(rx, unit, 3) * 0.08), { depth: 1 });
        // Vent dots.
        for (let x = rx + 6; x < rx + 16; x += 2) c.set(x, y + Math.floor(h / 2) - 1, C('gray', 0.04));
        // Blinking LEDs (fullbright).
        for (let k = 0; k < 3; k++) {
          const on = hash2(rx * 7 + k, unit * 13 + f, seed) > 0.45;
          const colors = [G('green', 0.7), G('amber', 1), G('green', 0.9), G('red', 1)];
          const col = on ? colors[(unit + k) % colors.length] : C('gray', 0.12);
          c.set(rx + 20 + k * 2, y + 1, col);
        }
        if (h > 4) {
          c.rect(rx + 6, y + 4, 8, 1, C('steel', 0.5));
          c.set(rx + 25, y + 4, hash2(unit, f, 4) > 0.5 ? G('cyan', 0.6) : C('gray', 0.15));
        }
        y += h;
        unit++;
      }
    }
    grimeGradient(c, { bottom: 0.25, top: 0.1 });
    frames.push(c);
  }
  return strip(frames);
}

function crtWall() {
  const lines = [
    'SLEEP.EXE', 'NOT FOUND', 'ERR 0X3AM', 'RETRY?', 'DEADLINE', 'IN 5:59', 'COFFEE LO', 'REPLY ALL',
    '>RUN ALEX', 'SYNTAX ER', 'TPS RPT', 'OVERDUE', '>_',
  ];
  const frames = [];
  for (let f = 0; f < 4; f++) {
    const { c, seed } = texture('crt-wall');
    c.fill(C('gray', 0.12));
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const x = col * 32;
        const y = row * 30 + 2;
        bevel(c, x + 1, y, 30, 28, C('beige', 0.5), { depth: 2 });
        c.rect(x + 4, y + 3, 24, 19, C('gray', 0.03));
        const which = row * 2 + col;
        if (which === 3) {
          // Static.
          for (let yy = y + 3; yy < y + 22; yy++) {
            for (let xx = x + 4; xx < x + 28; xx++) {
              const v = hash2(xx, yy + f * 50, seed);
              if (v > 0.55) c.set(xx, yy, v > 0.85 ? G('tube', 1) : C('gray', 0.4 + v * 0.3));
            }
          }
        } else {
          const glow = which === 1 ? 'amber' : 'green';
          for (let l = 0; l < 3; l++) {
            const text = lines[(which * 3 + l + f) % lines.length].slice(0, 5);
            tinyText(c, text, x + 5, y + 4 + l * 6, G(glow, l === 2 && f % 2 ? 0 : 1));
          }
        }
        // Screen curvature highlight.
        c.set(x + 5, y + 4, C('gray', 0.5));
        c.rect(x + 12, y + 24, 8, 2, C('beige', 0.35));
      }
    }
    c.rect(0, 62, 64, 2, C('gray', 0.05));
    frames.push(c);
  }
  return strip(frames);
}

function serverFloor() {
  const { c, r, seed } = texture('server-floor');
  noiseFill(c, seed, C('steel', 0.42), C('steel', 0.5), { cells: 4, grain: 0.15, contrast: 0.9 });
  for (let ty = 0; ty < 64; ty += 32) {
    for (let tx = 0; tx < 64; tx += 32) {
      bevel(c, tx, ty, 32, 32, C('steel', 0.46), { depth: 1, fill: false });
      if ((tx + ty) % 64 === 0) {
        for (let y = ty + 5; y < ty + 28; y += 3) for (let x = tx + 5; x < tx + 28; x += 3) c.set(x, y, C('steel', 0.18));
      }
    }
  }
  for (let i = 0; i < 2; i++) stain(c, r, { radius: r.range(3, 6), color: C('gray', 0.2), strength: 0.35, ring: 0.1 });
  scratches(c, r, 14, C('steel', 0.3));
  return c;
}

function techPanel(name, { vent = false } = {}) {
  const { c, r, seed } = texture(name);
  noiseFill(c, seed, C('steel', 0.3), C('steel', 0.38), { cells: 3, grain: 0.1 });
  bevel(c, 0, 0, 64, 32, C('steel', 0.34), { depth: 1, fill: false });
  bevel(c, 0, 32, 64, 32, C('steel', 0.34), { depth: 1, fill: false });
  for (const [x, y] of [[3, 3], [59, 3], [3, 28], [59, 28], [3, 35], [59, 35], [3, 60], [59, 60]]) rivet(c, x, y, C('steel', 0.45));
  if (vent) {
    for (let y = 38; y < 58; y += 3) {
      c.rect(10, y, 44, 1, C('gray', 0.04));
      c.rect(10, y + 1, 44, 1, C('steel', 0.5));
    }
    tinyText(c, 'HOT AIR', 18, 8, C('yellow', 0.7));
    c.rect(14, 15, 36, 1, C('yellow', 0.5));
  } else {
    c.rect(8, 10, 22, 14, C('gray', 0.1));
    tinyText(c, 'RACK 9', 9, 12, C('steel', 0.7));
    c.set(25, 20, G('red', 1));
    c.rect(36, 40, 20, 3, C('yellow', 0.6));
    c.rect(36, 44, 20, 3, C('gray', 0.12));
    c.rect(36, 48, 20, 3, C('yellow', 0.6));
  }
  scratches(c, r, 10, C('steel', 0.2));
  grimeGradient(c, { bottom: 0.25, top: 0.08 });
  return c;
}

function cableWall() {
  const { c, r, seed } = texture('cable-wall');
  noiseFill(c, seed, C('gray', 0.1), C('gray', 0.16), { cells: 3 });
  const colors = [C('blood', 0.55), C('steel', 0.55), C('yellow', 0.6), C('gray', 0.5), C('toxic', 0.5), C('purple', 0.5), C('gray', 0.25)];
  for (let k = 0; k < 14; k++) {
    const x0 = r.int(0, 63);
    const col = colors[k % colors.length];
    const amp = r.range(1, 4);
    const ph = r.range(0, 6);
    for (let y = 0; y < 64; y++) {
      const x = x0 + Math.sin((y / 64) * Math.PI * 2 + ph) * amp;
      c.set(((Math.round(x) % 64) + 64) % 64, y, col);
      c.set(((Math.round(x) + 1) % 64 + 64) % 64, y, darken(col, 0.4));
    }
  }
  for (const y of [14, 46]) {
    c.rect(0, y, 64, 3, C('gray', 0.3));
    c.rect(0, y, 64, 1, C('gray', 0.5));
  }
  return c;
}

function elevatorWall() {
  const { c, r, seed } = texture('elevator-wall');
  noiseFill(c, seed, C('steel', 0.48), C('steel', 0.58), { cells: 2, grain: 0.05 });
  c.eachOpaque((x, y, p) => (x % 2 === 0 ? darken(p, 0.05) : undefined));
  for (const x of [0, 21, 42]) {
    c.rect(x, 0, 1, 64, C('steel', 0.25));
    c.rect(x + 1, 0, 1, 64, C('steel', 0.7));
  }
  // Handrail.
  c.rect(0, 34, 64, 2, C('steel', 0.85));
  c.rect(0, 36, 64, 1, C('steel', 0.2));
  // Inspection certificate.
  c.rect(48, 10, 10, 13, C('beige', 0.85));
  for (let l = 0; l < 4; l++) c.rect(49, 12 + l * 3, 8, 1, C('gray', 0.4));
  scratches(c, r, 12, C('steel', 0.3), { vertical: true });
  c.rect(0, 58, 64, 6, C('steel', 0.2));
  return c;
}

function elevatorFloor() {
  const { c, seed } = texture('elevator-floor');
  noiseFill(c, seed, C('gray', 0.16), C('gray', 0.22), { cells: 3, grain: 0.1 });
  for (let y = 0; y < 64; y += 8) {
    for (let x = 0; x < 64; x += 8) {
      const ox = (y / 8) % 2 ? 4 : 0;
      c.rect(x + ox + 2, y + 3, 3, 1, C('gray', 0.32));
      c.set(x + ox + 3, y + 2, C('gray', 0.32));
      c.set(x + ox + 3, y + 4, C('gray', 0.32));
    }
  }
  mottle(c, seed + 3, 0.15);
  return c;
}

function posterAlex() {
  const { c, seed } = texture('poster-alex');
  noiseFill(c, seed, C('beige', 0.4), C('beige', 0.5), { cells: 4, grain: 0.12 });
  mottle(c, seed + 1, 0.1);
  // Frame.
  bevel(c, 15, 3, 34, 52, C('yellow', 0.45), { depth: 2 });
  c.rect(18, 6, 28, 46, C('navy', 0.55));
  tinyText(c, 'EMPLOYEE', 17, 7, C('yellow', 0.9));
  // Alex's photo portrait (made by ui/face.js from his photo), minus the collar.
  const photo = resize(crop(loadPhoto(path.join(root, 'assets/custom/alex.png')), 24, 30, 168, 182), 24, 26);
  const face = new PixelCanvas(24, 26);
  for (let i = 0; i < 24 * 26; i++) {
    // A little extra contrast for the small size.
    const rgb = [...photo.data.subarray(i * 3, i * 3 + 3)];
    face.set(i % 24, Math.floor(i / 24), rgb.map((v) => Math.max(0, Math.min(255, Math.round((v - 128) * 1.2 + 128)))));
  }
  c.blit(face, 20, 13);
  tinyText(c, 'OF THE', 20, 39, C('yellow', 0.8));
  tinyText(c, 'MONTH', 22, 45, C('yellow', 0.8));
  c.rect(0, 56, 64, 8, C('gray', 0.14));
  c.rect(0, 56, 64, 1, C('gray', 0.3));
  speckle(c, seed, 0.03, 0.2);
  grimeGradient(c, { bottom: 0.15, top: 0.1 });
  return c;
}

export default [
  { name: 'server-rack', out: T('server-rack'), draw: serverRack },
  { name: 'crt-wall', out: T('crt-wall'), draw: crtWall },
  { name: 'server-floor', out: T('server-floor'), draw: serverFloor },
  { name: 'tech-panel', out: T('tech-panel'), draw: () => techPanel('tech-panel') },
  { name: 'tech-vent', out: T('tech-vent'), draw: () => techPanel('tech-vent', { vent: true }) },
  { name: 'cable-wall', out: T('cable-wall'), draw: cableWall },
  { name: 'elevator-wall', out: T('elevator-wall'), draw: elevatorWall },
  { name: 'elevator-floor', out: T('elevator-floor'), draw: elevatorFloor },
  { name: 'poster-alex', out: T('poster-alex'), draw: posterAlex },
];

