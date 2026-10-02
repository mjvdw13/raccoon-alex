// Doors, door jambs and switches.
import {
  texture, noiseFill, mottle, stain, scratches, drips, grimeGradient, bevel, rivet, tinyText, tinyTextWidth,
  C, darken, lighten, hash2,
} from '../lib/tex.js';
import { G } from '../lib/pal.js';

const T = (name) => `assets/textures/${name}.png`;

function brushedSteel(c, seed, t = 0.45) {
  noiseFill(c, seed, C('steel', t - 0.08), C('steel', t + 0.06), { cells: 2, grain: 0.05 });
  c.eachOpaque((x, y, p) => (hash2(x, Math.floor(y / 3), seed) > 0.6 ? lighten(p, 0.05) : undefined));
  return c;
}

function officeDoor(name) {
  const { c, r, seed } = texture(name);
  // Metal frame.
  c.fill(C('steel', 0.38));
  // Wood slab.
  for (let y = 3; y < 64; y++) {
    for (let x = 4; x < 60; x++) {
      const v = Math.sin(y * 0.3 + Math.sin(x * 0.4) * 1.5 + x * 0.08);
      c.set(x, y, C('rust', 0.2 + (v + 1) * 0.04 + (hash2(x, y, seed) - 0.5) * 0.03));
    }
  }
  bevel(c, 0, 0, 64, 64, C('steel', 0.38), { depth: 1, fill: false });
  c.rect(3, 3, 1, 61, C('rust', 0.06));
  c.rect(60, 3, 1, 61, C('rust', 0.06));
  // Wire-glass window.
  bevel(c, 24, 9, 16, 22, C('steel', 0.5), { depth: 1 });
  c.rect(26, 11, 12, 18, C('navy', 0.3));
  for (let y = 11; y < 29; y++) {
    for (let x = 26; x < 38; x++) if ((x + y) % 4 === 0 || (x - y + 64) % 4 === 0) c.set(x, y, C('steel', 0.5));
  }
  c.line(27, 27, 33, 12, C('steel', 0.7));
  // Lever handle.
  c.rect(50, 33, 4, 4, C('steel', 0.62));
  c.rect(44, 34, 8, 2, C('steel', 0.75));
  c.rect(44, 36, 8, 1, C('steel', 0.3));
  // Kick plate.
  bevel(c, 6, 52, 52, 9, C('steel', 0.5), { depth: 1 });
  scratches(c, r, 12, C('steel', 0.25), { maxLen: 5 });
  grimeGradient(c, { bottom: 0.2, top: 0.05 });
  return c;
}

function metalDoor(name, { rusty = 0.3 } = {}) {
  const { c, r, seed } = texture(name);
  brushedSteel(c, seed, 0.36);
  bevel(c, 0, 0, 64, 64, C('steel', 0.36), { depth: 2, fill: false });
  bevel(c, 8, 8, 48, 20, C('steel', 0.33), { depth: 1 });
  bevel(c, 8, 34, 48, 22, C('steel', 0.33), { depth: 1 });
  // Push bar.
  c.rect(6, 30, 52, 3, C('steel', 0.7));
  c.rect(6, 33, 52, 1, C('steel', 0.2));
  for (const [x, y] of [[4, 4], [58, 4], [4, 58], [58, 58]]) rivet(c, x, y, C('steel', 0.5));
  drips(c, r, 10, C('rust', 0.35), { startY: 0, strength: rusty, maxLen: 40 });
  stain(c, r, { radius: 7, color: C('rust', 0.3), strength: rusty, ring: 0.1 });
  grimeGradient(c, { bottom: 0.3, top: 0.1 });
  return c;
}

function securityDoor(name, ramp, glow, label) {
  const { c, r, seed } = texture(name);
  brushedSteel(c, seed, 0.4);
  bevel(c, 0, 0, 64, 64, C('steel', 0.4), { depth: 2, fill: false });
  // Coloured hazard band.
  for (let y = 22; y < 34; y++) {
    for (let x = 2; x < 62; x++) c.set(x, y, ((x + y) >> 2) & 1 ? C(ramp, 0.62) : C(ramp, 0.4));
  }
  c.rect(2, 22, 60, 1, C(ramp, 0.85));
  c.rect(2, 33, 60, 1, C(ramp, 0.2));
  // Label plate.
  const w = tinyTextWidth(label) + 4;
  c.rect(32 - w / 2, 9, w, 9, C('gray', 0.12));
  tinyText(c, label, 34 - w / 2, 11, C(ramp, 0.85));
  // Badge reader with a glowing LED (fullbright).
  bevel(c, 48, 38, 9, 13, C('gray', 0.18), { depth: 1 });
  c.rect(50, 40, 5, 3, G(glow, 1));
  c.rect(50, 45, 5, 4, C('gray', 0.35));
  c.rect(26, 40, 1, 20, C('steel', 0.2));
  scratches(c, r, 10, C('steel', 0.2));
  grimeGradient(c, { bottom: 0.25, top: 0.05 });
  return c;
}

/** Split elevator doors: the left and right halves slide apart. */
function elevatorDoor(name) {
  const { c, r, seed } = texture(name);
  brushedSteel(c, seed, 0.52);
  c.eachOpaque((x, y, p) => (x % 3 === 0 ? darken(p, 0.06) : undefined));
  c.rect(31, 0, 1, 64, C('steel', 0.15));
  c.rect(32, 0, 1, 64, C('steel', 0.75));
  bevel(c, 0, 0, 64, 64, C('steel', 0.5), { depth: 1, fill: false });
  // Handprints and grime.
  for (let i = 0; i < 4; i++) stain(c, r, { x: r.range(20, 44), y: r.range(26, 40), radius: 3, color: C('gray', 0.25), strength: 0.3, ring: 0.05 });
  grimeGradient(c, { bottom: 0.25 });
  return c;
}

function jamb(name, ramp = 'steel') {
  const { c, seed } = texture(name);
  noiseFill(c, seed, C(ramp, 0.3), C(ramp, 0.4), { cells: 2, grain: 0.06 });
  for (let x = 0; x < 64; x += 8) {
    c.rect(x, 0, 1, 64, C(ramp, 0.62));
    c.rect(x + 1, 0, 1, 64, C(ramp, 0.5));
    c.rect(x + 6, 0, 1, 64, C(ramp, 0.2));
    c.rect(x + 7, 0, 1, 64, C(ramp, 0.12));
  }
  grimeGradient(c, { bottom: 0.3, top: 0.1 });
  return c;
}

/** Elevator call panel used as the level exit switch. */
function exitSwitch(name, on) {
  const { c, r, seed } = texture(name);
  brushedSteel(c, seed, 0.42);
  bevel(c, 0, 0, 64, 64, C('steel', 0.42), { depth: 1, fill: false });
  // Glowing EXIT sign.
  c.rect(14, 4, 36, 13, C('gray', 0.08));
  tinyText(c, 'EXIT', 18, 6, G('red', on ? 1 : 0.5), { scale: 2, spacing: 1 });
  // Floor indicator.
  c.rect(22, 21, 20, 7, C('gray', 0.06));
  tinyText(c, on ? 'B3' : 'B1', 26, 22, G('amber', 1));
  // Call panel with an up/down button.
  bevel(c, 24, 32, 16, 22, C('steel', 0.6), { depth: 1 });
  c.ellipse(32, 38, 3, 3, on ? G('yellow', 0.8) : C('gray', 0.3));
  c.ellipse(32, 47, 3, 3, on ? G('yellow', 0.8) : C('gray', 0.3));
  c.poly([[32, 36], [30, 39], [34, 39]], on ? C('orange', 0.2) : C('gray', 0.65));
  c.poly([[32, 49], [30, 46], [34, 46]], on ? C('orange', 0.2) : C('gray', 0.65));
  scratches(c, r, 8, C('steel', 0.2));
  grimeGradient(c, { bottom: 0.25 });
  return c;
}

/** Generic wall switch box on drywall. */
function wallSwitch(name, on, base = 'beige') {
  const { c, r, seed } = texture(name);
  noiseFill(c, seed, C(base, 0.4), C(base, 0.48), { cells: 4, grain: 0.1 });
  mottle(c, seed + 2, 0.1);
  c.rect(0, 56, 64, 8, C('gray', 0.14));
  c.rect(0, 56, 64, 1, C('gray', 0.3));
  bevel(c, 20, 18, 24, 30, C('gray', 0.5), { depth: 2 });
  c.rect(24, 22, 16, 22, C('gray', 0.22));
  // Big breaker lever.
  if (on) {
    c.rect(30, 32, 4, 10, C('gray', 0.7));
    c.rect(28, 40, 8, 3, C('blood', 0.6));
  } else {
    c.rect(30, 24, 4, 10, C('gray', 0.7));
    c.rect(28, 23, 8, 3, C('blood', 0.6));
  }
  c.rect(37, 24, 2, 2, on ? G('green', 0.8) : G('red', 0.8));
  tinyText(c, 'PWR', 26, 12, C('gray', 0.2));
  scratches(c, r, 6, C('gray', 0.3));
  grimeGradient(c, { bottom: 0.18, top: 0.1 });
  return c;
}

export default [
  { name: 'door-office', out: T('door-office'), draw: () => officeDoor('door-office') },
  { name: 'door-metal', out: T('door-metal'), draw: () => metalDoor('door-metal') },
  { name: 'door-rusty', out: T('door-rusty'), draw: () => metalDoor('door-rusty', { rusty: 0.65 }) },
  { name: 'door-blue', out: T('door-blue'), draw: () => securityDoor('door-blue', 'steel', 'cyan', 'BLUE') },
  { name: 'door-yellow', out: T('door-yellow'), draw: () => securityDoor('door-yellow', 'yellow', 'yellow', 'YELLOW') },
  { name: 'door-red', out: T('door-red'), draw: () => securityDoor('door-red', 'blood', 'red', 'RED') },
  { name: 'door-elevator', out: T('door-elevator'), draw: () => elevatorDoor('door-elevator') },
  { name: 'door-jamb', out: T('door-jamb'), draw: () => jamb('door-jamb') },
  { name: 'door-jamb-rust', out: T('door-jamb-rust'), draw: () => jamb('door-jamb-rust', 'rust') },
  { name: 'switch-exit', out: T('switch-exit'), draw: () => exitSwitch('switch-exit', false) },
  { name: 'switch-exit-on', out: T('switch-exit-on'), draw: () => exitSwitch('switch-exit-on', true) },
  { name: 'switch', out: T('switch'), draw: () => wallSwitch('switch', false) },
  { name: 'switch-on', out: T('switch-on'), draw: () => wallSwitch('switch-on', true) },
  { name: 'switch-concrete', out: T('switch-concrete'), draw: () => wallSwitch('switch-concrete', false, 'concrete') },
  { name: 'switch-concrete-on', out: T('switch-concrete-on'), draw: () => wallSwitch('switch-concrete-on', true, 'concrete') },
];

