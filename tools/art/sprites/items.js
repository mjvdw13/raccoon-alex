// Pickup sprites: health, caffeine (armor), ammo, weapons, badges and powerups.
import { PixelCanvas, mix } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { Model, MAT } from '../lib/model.js';
import { box, cylinder, ellipse, flat } from '../lib/props.js';
import { sheet } from '../lib/sprite.js';
import { rng } from '../lib/noise.js';
import { tinyText } from '../lib/tex.js';

const I = (name) => `assets/sprites/items/${name}.png`;
const RENDER = { light: [-0.5, -0.7, 0.55], ambient: 0.34, aoStrength: 0.45 };
const shadow = (m, cx, cy, rx) => flat(m, cx, cy, rx, rx * 0.22, C('gray', 0.05), MAT.cloth, -20);

function model(w, h, seed, build) {
  const m = new Model(w, h, { seed });
  build(m);
  return m.render(RENDER);
}

/** A tiny glint (fullbright) that moves across frames. */
function glint(c, x, y, on) {
  if (!on) return c;
  c.set(x, y, G('yellow', 1));
  c.set(x - 1, y, G('yellow', 0.7));
  c.set(x + 1, y, G('yellow', 0.7));
  c.set(x, y - 1, G('yellow', 0.7));
  c.set(x, y + 1, G('yellow', 0.7));
  return c;
}

// ---------------------------------------------------------------- health

function jellyBean() {
  const colors = [C('blood', 0.7), C('toxic', 0.75), C('yellow', 0.8), C('purple', 0.75)];
  return sheet([0, 1, 2, 3].map((f) => {
    const c = model(16, 16, 201, (m) => {
      shadow(m, 8, 14.5, 4);
      m.ellipsoid(8, 11.5, 2, 4.4, 2.6, 3, colors[1], MAT.plastic);
      m.ellipsoid(6.5, 10.5, 4, 2.6, 1.8, 2, colors[0], MAT.plastic);
    });
    return glint(c, 5 + f, 9, f !== 3);
  }));
}

function donut() {
  return model(24, 24, 203, (m) => {
    shadow(m, 12, 21, 9);
    m.ellipsoid(12, 17, 0, 9.5, 5, 6, C('orange', 0.55), MAT.skin);
    m.ellipsoid(12, 15.5, 1, 8.6, 3.6, 6, C('flesh', 0.7), { ...MAT.plastic, spec: 0.5 }); // glaze
    m.dent(12, 15.5, 3.4, 1.4, 2.5);
    m.paint(12, 15.5, 2.6, 1.1, C('rust', 0.25));
    const r = rng(5);
    for (let k = 0; k < 9; k++) {
      const a = r.range(0, Math.PI * 2);
      const d = r.range(4, 7.5);
      m.paint(12 + Math.cos(a) * d, 15.5 + Math.sin(a) * d * 0.4, 0.6, 0.5, r.pick([C('steel', 0.8), C('yellow', 0.8), C('toxic', 0.7), C('beige', 0.95)]));
    }
  });
}

function pillow() {
  return model(32, 24, 205, (m) => {
    shadow(m, 16, 21, 13);
    m.ellipsoid(16, 15, 0, 13, 6.5, 6, C('beige', 0.82), MAT.cloth);
    for (const [x, y] of [[4, 11], [28, 11], [5, 19], [27, 19]]) m.ellipsoid(x, y, 2, 2.6, 2, 2.5, C('beige', 0.78), MAT.cloth);
    m.dent(16, 14, 5, 2.2, 0.8);
    m.paint(22, 13, 2.5, 1.2, mix(C('beige', 0.75), C('olive', 0.4), 0.3)); // drool stain
  });
}

function dreamOrb() {
  return sheet([0, 1, 2, 3].map((f) => {
    const c = new PixelCanvas(32, 32);
    const cx = 16;
    const cy = 15 + (f % 2);
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / 11;
        if (d > 1) continue;
        const swirl = Math.sin((x + y) * 0.5 + f * 1.6 + d * 6);
        const t = 1 - d;
        let col = G('purple', t > 0.5 ? 1 : 0);
        if (swirl > 0.55 && d < 0.9) col = G('cyan', t > 0.4 ? 1 : 0.5);
        if (d < 0.35) col = G('cyan', 1);
        if (d < 0.15) col = G('yellow', 1);
        c.set(x, y, col);
      }
    }
    // Floating "z"s.
    const z = [[0, 0], [1, 0], [2, 0], [1, 1], [0, 2], [1, 2], [2, 2]];
    z.forEach(([x, y]) => c.set(22 + x, 4 - (f % 3) + y, G('yellow', 0.9)));
    return c;
  }));
}

// ---------------------------------------------------------------- caffeine

function coffeeBean() {
  return sheet([0, 1, 2, 3].map((f) => {
    const c = model(16, 16, 207, (m) => {
      shadow(m, 8, 14.5, 4.5);
      m.ellipsoid(8, 11, 2, 4.6, 3.2, 3, C('rust', 0.28), { ...MAT.plastic, spec: 0.55 });
      m.dent(8, 11, 0.8, 2.8, 1.5);
      m.paint(8, 11, 0.5, 2.6, C('rust', 0.1));
    });
    return glint(c, 5 + f, 9, f !== 2);
  }));
}

function cupOfJoe() {
  const c = model(24, 24, 209, (m) => {
    shadow(m, 12, 22.5, 6);
    cylinder(m, 12, 9, 22, 5.2, C('beige', 0.86), MAT.paper, { topCol: C('gray', 0.12) });
    m.paint(12, 15.5, 5.4, 2.6, C('rust', 0.35), MAT.paper); // cardboard sleeve
    m.slab(ellipse(12, 8, 5.8, 1.9), 12, C('gray', 0.15), MAT.plastic, { tilt: [0, -2.4] }); // lid
    m.paint(14, 7.6, 1, 0.6, C('gray', 0.04));
  });
  for (const [x, y] of [[11, 4], [12, 2], [13, 3], [10, 1]]) c.set(x, y, C('steel', 0.82));
  return c;
}

function tripleEspresso() {
  return sheet([0, 1].map((f) => {
    const c = model(32, 32, 211, (m) => {
      shadow(m, 16, 30, 11);
      cylinder(m, 16, 7, 30, 7.5, C('steel', 0.6), MAT.metal, { topCol: C('steel', 0.7) });
      m.paint(16, 18, 7.6, 3.8, C('blood', 0.45), MAT.plastic);
      cylinder(m, 16, 3, 7.5, 4, C('gray', 0.18), MAT.plastic);
    });
    tinyText(c, 'XXX', 10, 16, C('beige', 0.9));
    const sx = f ? 1 : 0;
    for (const [x, y] of [[14, 1], [15, 0], [17, 1], [18, 0]]) c.set(x + sx, y, C('steel', 0.85));
    return c;
  }));
}

// ---------------------------------------------------------------- ammo

function staplesClip() {
  return model(16, 16, 213, (m) => {
    shadow(m, 8, 15, 6);
    box(m, 2.5, 8.5, 11, 5.5, 3, C('steel', 0.6), MAT.metal, { topCol: C('steel', 0.75) });
    for (let x = 4; x < 13; x += 1.5) m.paint(x, 6.6, 0.3, 1.2, C('steel', 0.4));
  });
}

function staplesBox() {
  const c = model(32, 24, 215, (m) => {
    shadow(m, 16, 23, 14);
    box(m, 3, 9, 26, 13, 5, C('orange', 0.5), MAT.paper, { topCol: C('orange', 0.6) });
  });
  tinyText(c, 'STAPLES', 3, 13, C('gray', 0.1));
  return c;
}

function tacks() {
  const r = rng(17);
  return model(24, 16, 217, (m) => {
    shadow(m, 12, 15, 9);
    for (let k = 0; k < 6; k++) {
      const x = r.range(5, 19);
      const y = r.range(10, 14);
      m.ellipsoid(x, y, 2, 2.3, 1.3, 1.6, r.pick([C('blood', 0.6), C('steel', 0.7), C('yellow', 0.7), C('toxic', 0.6)]), MAT.plastic);
      m.capsule(x, y + 1, 1, x + 0.5, y + 2.5, 1, 0.35, 0.2, C('steel', 0.75), MAT.metal);
    }
  });
}

function tacksBox() {
  const c = model(32, 24, 219, (m) => {
    shadow(m, 16, 23, 13);
    box(m, 4, 10, 24, 12, 5, C('steel', 0.45), MAT.plastic, { topCol: C('steel', 0.62) });
    for (let k = 0; k < 7; k++) m.paint(7 + k * 3, 7, 1, 0.8, [C('blood', 0.6), C('yellow', 0.7), C('toxic', 0.6)][k % 3]);
  });
  tinyText(c, 'TACKS', 6, 14, C('beige', 0.9));
  return c;
}

function toner() {
  const c = model(24, 24, 221, (m) => {
    shadow(m, 12, 22.5, 10);
    box(m, 3, 12, 18, 9, 4, C('gray', 0.18), MAT.plastic, { topCol: C('gray', 0.26) });
    m.capsule(8, 9.5, 9, 16, 9.5, 9, 1.2, 1.2, C('gray', 0.12), MAT.plastic); // handle
  });
  c.rect(6, 15, 12, 2, C('blood', 0.5));
  return c;
}

function tonerBox() {
  const c = model(40, 32, 223, (m) => {
    shadow(m, 20, 31, 18);
    box(m, 3, 12, 34, 18, 7, C('beige', 0.5), MAT.paper, { topCol: C('beige', 0.6) });
    m.paint(20, 9, 15, 0.6, C('rust', 0.3)); // tape
  });
  tinyText(c, 'TONER', 9, 16, C('gray', 0.1));
  c.rect(8, 23, 24, 1, C('blood', 0.4));
  return c;
}

function pods() {
  return model(24, 16, 225, (m) => {
    shadow(m, 12, 15, 9);
    for (const [x, col] of [[6, C('blood', 0.5)], [12, C('steel', 0.6)], [18, C('toxic', 0.5)]]) {
      cylinder(m, x, 9, 14.5, 2.8, col, MAT.plastic, { topCol: C('steel', 0.85) });
    }
  });
}

function podsBox() {
  const c = model(32, 24, 227, (m) => {
    shadow(m, 16, 23, 14);
    box(m, 3, 10, 26, 12, 5, C('rust', 0.3), MAT.paper, { topCol: C('rust', 0.38) });
  });
  tinyText(c, 'PODS', 9, 14, C('yellow', 0.8));
  return c;
}

function laptopBag() {
  return model(32, 24, 229, (m) => {
    shadow(m, 16, 23, 14);
    m.slab([[3, 9], [29, 9], [30, 22], [2, 22]], 8, C('gray', 0.14), MAT.leather, { bevel: 3, thickness: 2 });
    m.slab([[4, 10], [28, 10], [28, 15], [4, 15]], 10, C('gray', 0.18), MAT.leather, { bevel: 1.5, thickness: 1, tilt: [0, -0.5] });
    m.capsule(8, 9, 6, 16, 2, 4, 1, 1, C('gray', 0.22), MAT.leather);
    m.capsule(16, 2, 4, 24, 9, 6, 1, 1, C('gray', 0.22), MAT.leather);
    m.paint(16, 12.5, 2, 1, C('steel', 0.7), MAT.metal);
  });
}

// ---------------------------------------------------------------- weapon pickups (side views)

function pickup(build) {
  return model(64, 32, 231, (m) => {
    shadow(m, 32, 30, 24);
    build(m);
  });
}

const pickupStapleGun = () =>
  pickup((m) => {
    m.slab([[20, 18], [44, 16], [46, 25], [22, 28]], 6, C('orange', 0.55), MAT.plastic, { bevel: 2.5, thickness: 2 });
    m.slab([[22, 25], [40, 23], [41, 27], [23, 29]], 8, C('gray', 0.14), MAT.plastic, { bevel: 1 });
    m.slab([[42, 15], [49, 15], [49, 20], [43, 21]], 7, C('gray', 0.2), MAT.metal, { bevel: 1 });
  });

const pickupShotgun = () =>
  pickup((m) => {
    m.capsule(6, 22, 4, 56, 19, 6, 2.6, 2.4, C('steel', 0.32), MAT.metal);
    m.capsule(14, 25, 5, 44, 23, 7, 2.2, 2, C('steel', 0.6), MAT.glass);
    m.capsule(26, 25, 7, 38, 24, 8, 3.6, 3.6, C('rust', 0.3), MAT.wood);
    m.slab([[2, 21], [12, 20], [14, 28], [3, 29]], 6, C('rust', 0.28), MAT.wood, { bevel: 2 });
  });

const pickupTypewriter = () =>
  pickup((m) => {
    box(m, 12, 17, 36, 11, 5, C('olive', 0.32), MAT.plastic, { topCol: C('olive', 0.4) });
    m.capsule(10, 14, 6, 50, 14, 6, 2.4, 2.4, C('gray', 0.12), MAT.leather);
    m.capsule(48, 17, 8, 62, 15, 8, 2.4, 1.8, C('gray', 0.22), MAT.metal);
    for (let k = 0; k < 8; k++) m.sphere(15 + k * 4, 23, 12, 1.2, C('beige', 0.75), MAT.plastic);
  });

const pickupLauncher = () =>
  pickup((m) => {
    m.capsule(4, 21, 4, 60, 18, 6, 6, 5, C('gray', 0.5), MAT.plastic);
    m.paint(32, 19.5, 5, 5, C('blood', 0.45));
    m.slab([[24, 24], [30, 24], [31, 30], [25, 30]], 10, C('gray', 0.15), MAT.plastic, { bevel: 1 });
  });

const pickupBfc = () => {
  const c = pickup((m) => {
    m.slab([[14, 8], [50, 8], [52, 29], [12, 29]], 6, C('steel', 0.62), MAT.metal, { bevel: 3, thickness: 3 });
    m.ellipsoid(32, 20, 9, 10, 7, 6, C('steel', 0.75), MAT.glass);
    m.paint(32, 21.5, 8, 5, G('amber', 0.6), MAT.glow);
    m.capsule(32, 8, 8, 32, 2, 6, 3, 2.5, C('gray', 0.25), MAT.metal);
  });
  c.set(29, 19, G('yellow', 1));
  return c;
};

// ---------------------------------------------------------------- keys & powerups

function badge(ramp, glow) {
  return sheet([1, 0].map((on) => {
    const c = model(16, 16, 233, (m) => {
      shadow(m, 8, 15, 5);
      m.slab([[3.5, 4], [12.5, 4], [12.5, 15], [3.5, 15]], 8, C('beige', 0.9), MAT.plastic, { bevel: 1, tilt: [0, -0.4] });
      m.paint(8, 5.5, 4.5, 1.6, C(ramp, 0.6), MAT.plastic);
      m.paint(6, 9.5, 1.6, 2, C('skin', 0.55));
      m.paint(10, 9, 1.4, 0.4, C('gray', 0.3));
      m.paint(10, 10.5, 1.4, 0.4, C('gray', 0.3));
      m.capsule(8, 4, 8, 8, 0, 6, 0.6, 0.6, C(ramp, 0.5), MAT.cloth);
    });
    if (on) c.rect(5, 13, 6, 1, G(glow, 1));
    return c;
  }));
}

function espressoShot() {
  const c = model(16, 24, 235, (m) => {
    flat(m, 8, 22, 7, 1.8, C('beige', 0.85), MAT.plastic, -2);
    cylinder(m, 8, 13, 21, 3.6, C('beige', 0.9), MAT.plastic, { open: true, inside: C('rust', 0.12) });
    m.capsule(11.5, 15, 6, 13.5, 18, 6, 0.8, 0.8, C('beige', 0.88), MAT.plastic);
  });
  for (const [x, y] of [[7, 10], [8, 8], [9, 9], [8, 6]]) c.set(x, y, C('steel', 0.85));
  return c;
}

function dndSign() {
  return sheet([0, 1].map((f) => {
    const c = new PixelCanvas(24, 32);
    c.ring(12, 6, 4, 1.5, G('red', 0.5));
    c.rect(3, 9, 18, 21, G('red', f ? 1 : 0.5));
    c.rect(4, 10, 16, 19, G('red', 0));
    tinyText(c, 'DO', 8, 12, G('yellow', 1));
    tinyText(c, 'NOT', 6, 18, G('yellow', 1));
    tinyText(c, 'DSTRB', 2, 24, G('yellow', f ? 1 : 0.6), { spacing: 0 });
    return c;
  }));
}

function nightGoggles() {
  const c = model(24, 16, 237, (m) => {
    shadow(m, 12, 15, 9);
    m.capsule(4, 10, 2, 20, 10, 2, 2.4, 2.4, C('gray', 0.15), MAT.leather);
    for (const x of [7, 17]) {
      cylinder(m, x, 6, 13, 3.6, C('gray', 0.2), MAT.metal, { topCol: C('gray', 0.3) });
    }
  });
  c.ellipse(7, 10, 2.2, 2.2, G('green', 0.7));
  c.ellipse(17, 10, 2.2, 2.2, G('green', 0.7));
  c.set(6, 9, G('green', 1));
  c.set(16, 9, G('green', 1));
  return c;
}

function waders() {
  return model(24, 32, 239, (m) => {
    shadow(m, 12, 31, 9);
    const green = C('olive', 0.38);
    m.slab([[5, 3], [19, 3], [20, 20], [4, 20]], 4, green, MAT.plastic, { bevel: 2.5, thickness: 2 });
    m.capsule(8, 18, 4, 7.5, 28, 5, 3.4, 3, green, MAT.plastic);
    m.capsule(16, 18, 4, 16.5, 28, 5, 3.4, 3, green, MAT.plastic);
    m.ellipsoid(7.5, 29.5, 7, 3.6, 1.6, 3, C('gray', 0.15), MAT.plastic);
    m.ellipsoid(16.5, 29.5, 7, 3.6, 1.6, 3, C('gray', 0.15), MAT.plastic);
    m.capsule(7, 3, 6, 6, 0, 4, 0.8, 0.8, C('olive', 0.25), MAT.cloth);
    m.capsule(17, 3, 6, 18, 0, 4, 0.8, 0.8, C('olive', 0.25), MAT.cloth);
  });
}

function floorPlan() {
  return model(24, 24, 241, (m) => {
    shadow(m, 12, 22.5, 10);
    m.capsule(3, 15, 6, 21, 13, 6, 4, 4, C('steel', 0.62), MAT.paper);
    m.slab([[5, 17], [21, 15], [22, 22], [6, 23]], 4, C('steel', 0.55), MAT.paper, { tilt: [0, -1.6], bevel: 0.6 });
    for (let k = 0; k < 4; k++) m.stroke(7 + k * 4, 17, 7 + k * 4, 22, 0.4, C('beige', 0.9));
    m.stroke(6, 19, 21, 18, 0.4, C('beige', 0.9));
  });
}

export default [
  { name: 'jelly-bean', out: I('jelly-bean'), draw: jellyBean, dither: 'fs' },
  { name: 'donut', out: I('donut'), draw: donut, dither: 'fs' },
  { name: 'pillow', out: I('pillow'), draw: pillow, dither: 'fs' },
  { name: 'dream-orb', out: I('dream-orb'), draw: dreamOrb },
  { name: 'coffee-bean', out: I('coffee-bean'), draw: coffeeBean, dither: 'fs' },
  { name: 'cup-of-joe', out: I('cup-of-joe'), draw: cupOfJoe, dither: 'fs' },
  { name: 'triple-espresso', out: I('triple-espresso'), draw: tripleEspresso, dither: 'fs' },
  { name: 'staples-clip', out: I('staples-clip'), draw: staplesClip, dither: 'fs' },
  { name: 'staples-box', out: I('staples-box'), draw: staplesBox, dither: 'fs' },
  { name: 'tacks', out: I('tacks'), draw: tacks, dither: 'fs' },
  { name: 'tacks-box', out: I('tacks-box'), draw: tacksBox, dither: 'fs' },
  { name: 'toner', out: I('toner'), draw: toner, dither: 'fs' },
  { name: 'toner-box', out: I('toner-box'), draw: tonerBox, dither: 'fs' },
  { name: 'pods', out: I('pods'), draw: pods, dither: 'fs' },
  { name: 'pods-box', out: I('pods-box'), draw: podsBox, dither: 'fs' },
  { name: 'laptop-bag', out: I('laptop-bag'), draw: laptopBag, dither: 'fs' },
  { name: 'pickup-staple-gun', out: I('pickup-staple-gun'), draw: pickupStapleGun, dither: 'fs' },
  { name: 'pickup-tack-shotgun', out: I('pickup-tack-shotgun'), draw: pickupShotgun, dither: 'fs' },
  { name: 'pickup-typewriter', out: I('pickup-typewriter'), draw: pickupTypewriter, dither: 'fs' },
  { name: 'pickup-toner-launcher', out: I('pickup-toner-launcher'), draw: pickupLauncher, dither: 'fs' },
  { name: 'pickup-bfc', out: I('pickup-bfc'), draw: pickupBfc, dither: 'fs' },
  { name: 'badge-blue', out: I('badge-blue'), draw: () => badge('steel', 'cyan'), dither: 'fs' },
  { name: 'badge-yellow', out: I('badge-yellow'), draw: () => badge('yellow', 'yellow'), dither: 'fs' },
  { name: 'badge-red', out: I('badge-red'), draw: () => badge('blood', 'red'), dither: 'fs' },
  { name: 'espresso-shot', out: I('espresso-shot'), draw: espressoShot, dither: 'fs' },
  { name: 'dnd-sign', out: I('dnd-sign'), draw: dndSign },
  { name: 'night-goggles', out: I('night-goggles'), draw: nightGoggles, dither: 'fs' },
  { name: 'waders', out: I('waders'), draw: waders, dither: 'fs' },
  { name: 'floor-plan', out: I('floor-plan'), draw: floorPlan, dither: 'fs' },
];

