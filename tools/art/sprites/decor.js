// Scenery sprites: office furniture, tech, basement and underworld junk.
import { PixelCanvas, mix } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { Model, MAT } from '../lib/model.js';
import { box, cylinder, flat } from '../lib/props.js';
import { sheet, flash } from '../lib/sprite.js';
import { rng } from '../lib/noise.js';
import { skeleton, body, puddle } from '../lib/rig.js';

const D = (name) => `assets/sprites/decor/${name}.png`;
const RENDER = { light: [-0.5, -0.65, 0.58], ambient: 0.3, aoStrength: 0.5 };
const shadow = (m, cx, cy, rx) => flat(m, cx, cy, rx, rx * 0.22, C('gray', 0.04), MAT.cloth, -30);

function model(w, h, seed, build) {
  const m = new Model(w, h, { seed });
  build(m);
  return m.render(RENDER);
}

function officeChair() {
  return model(32, 32, 301, (m) => {
    shadow(m, 16, 30.5, 12);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + 0.3;
      m.capsule(16, 27, 2, 16 + Math.cos(a) * 9, 28.5 + Math.sin(a) * 2, 2 + Math.sin(a) * 4, 0.9, 0.8, C('gray', 0.15), MAT.plastic);
      m.sphere(16 + Math.cos(a) * 9, 29.5 + Math.sin(a) * 2, 3 + Math.sin(a) * 4, 1.2, C('gray', 0.08), MAT.plastic);
    }
    m.capsule(16, 18, 2, 16, 27, 2, 1.2, 1.2, C('steel', 0.6), MAT.metal);
    m.ellipsoid(16, 17, 3, 9.5, 3, 7, C('steel', 0.3), MAT.cloth); // seat
    m.slab([[8, 2], [24, 2], [25, 15], [7, 15]], -2, C('steel', 0.3), MAT.cloth, { bevel: 3, thickness: 3 }); // back
    m.capsule(6, 12, 3, 6, 17, 4, 1, 1, C('gray', 0.15), MAT.plastic);
    m.capsule(26, 12, 3, 26, 17, 4, 1, 1, C('gray', 0.15), MAT.plastic);
    m.paint(13, 8, 2.5, 1.5, mix(C('steel', 0.3), C('olive', 0.3), 0.5)); // coffee stain
  });
}

function ficus() {
  const r = rng(7);
  return model(32, 48, 303, (m) => {
    shadow(m, 16, 46.5, 9);
    cylinder(m, 16, 34, 46, 6.5, C('rust', 0.35), MAT.plastic, { open: true, inside: C('rust', 0.12) });
    m.capsule(16, 35, 4, 15, 14, 3, 1, 0.6, C('rust', 0.22), MAT.wood);
    for (let k = 0; k < 26; k++) {
      const y = r.range(3, 30);
      const x = 16 + r.range(-10, 10) * (0.4 + (30 - y) / 40);
      const dead = r.chance(0.5);
      m.ellipsoid(x, y, r.range(0, 5), 2.4, 1.3, 1.4, dead ? C('olive', 0.55) : C('olive', 0.3), MAT.cloth);
    }
    // Fallen leaves.
    for (let k = 0; k < 4; k++) m.ellipsoid(r.range(6, 26), r.range(44, 47), 5, 1.8, 0.8, 1, C('yellow', 0.45), MAT.paper);
  });
}

function waterCooler() {
  return model(24, 48, 305, (m) => {
    shadow(m, 12, 46.5, 8);
    box(m, 5, 22, 14, 24, 4, C('beige', 0.75), MAT.plastic);
    m.paint(9, 31, 1.5, 1, C('blood', 0.55), MAT.plastic);
    m.paint(15, 31, 1.5, 1, C('steel', 0.6), MAT.plastic);
    m.slab([[8, 34], [16, 34], [16, 37], [8, 37]], 9, C('gray', 0.2), MAT.metal, { bevel: 0.8 });
    // The bottle (half empty, cloudy).
    m.ellipsoid(12, 10, 6, 7, 9, 6, C('steel', 0.65), MAT.glass);
    m.capsule(12, 17, 6, 12, 21, 6, 2, 2, C('steel', 0.6), MAT.glass);
    m.paint(12, 13, 6, 5, C('teal', 0.45), MAT.glass);
  });
}

function copier() {
  return model(48, 40, 307, (m) => {
    shadow(m, 24, 38.5, 20);
    box(m, 4, 14, 40, 24, 6, C('beige', 0.65), MAT.plastic, { topCol: C('beige', 0.72) });
    m.slab([[8, 4], [40, 4], [42, 9], [6, 9]], 4, C('gray', 0.25), MAT.plastic, { tilt: [0, -1.5], bevel: 1 }); // lid
    m.slab([[8, 18], [40, 18], [40, 26], [8, 26]], 10, C('beige', 0.55), MAT.plastic, { bevel: 1 });
    for (let k = 0; k < 3; k++) m.stroke(10, 28.5 + k * 2.5, 38, 28.5 + k * 2.5, 0.5, C('gray', 0.3));
    m.slab([[30, 9], [40, 9], [40, 12], [30, 12]], 12, C('gray', 0.12), MAT.plastic, { bevel: 0.6 });
    // Jammed paper, of course.
    m.slab([[14, 16], [22, 13], [24, 18], [16, 20]], 14, C('beige', 0.95), MAT.paper, { tilt: [0.3, -0.8], bevel: 0.6 });
  });
}

function filingCabinet() {
  return model(24, 40, 309, (m) => {
    shadow(m, 12, 38.5, 9);
    box(m, 3, 5, 18, 33, 3, C('steel', 0.45), MAT.metal);
    for (let k = 0; k < 3; k++) {
      m.slab([[4.5, 7 + k * 10.5], [19.5, 7 + k * 10.5], [19.5, 16 + k * 10.5], [4.5, 16 + k * 10.5]], 10, C('steel', 0.48), MAT.metal, { bevel: 1, thickness: 0.8 });
      m.capsule(9, 11 + k * 10.5, 12, 15, 11 + k * 10.5, 12, 0.7, 0.7, C('steel', 0.75), MAT.metal);
    }
    // The bottom drawer hangs open with files.
    m.slab([[5, 29], [19, 29], [20, 33], [4, 33]], 14, C('beige', 0.7), MAT.paper, { tilt: [0, -1.2], bevel: 0.6 });
  });
}

function floorLamp() {
  const c = model(16, 56, 311, (m) => {
    shadow(m, 8, 54.5, 5);
    m.ellipsoid(8, 53, 2, 4.5, 1.6, 3, C('gray', 0.18), MAT.metal);
    m.capsule(8, 12, 2, 8, 53, 2, 0.9, 0.9, C('gray', 0.3), MAT.metal);
    m.slab([[3, 2], [13, 2], [15, 12], [1, 12]], 4, C('beige', 0.7), MAT.paper, { bevel: 2, thickness: 2 });
  });
  for (let y = 10; y < 13; y++) for (let x = 3; x < 13; x++) c.set(x, y, G('lamp', 1));
  for (let y = 4; y < 10; y++) for (let x = 4; x < 12; x++) if ((x + y) % 3) c.set(x, y, G('lamp', 0.5));
  return c;
}

function ceilingLamp() {
  const c = model(48, 16, 313, (m) => {
    m.capsule(14, 0, 0, 14, 5, 0, 0.4, 0.4, C('gray', 0.3), MAT.metal);
    m.capsule(34, 0, 0, 34, 5, 0, 0.4, 0.4, C('gray', 0.3), MAT.metal);
    m.slab([[2, 5], [46, 5], [44, 12], [4, 12]], 4, C('steel', 0.5), MAT.metal, { bevel: 2, tilt: [0, 0.8] });
  });
  for (let x = 6; x < 42; x++) {
    c.set(x, 11, G('tube', 1));
    c.set(x, 12, G('tube', 0));
  }
  return c;
}

function trashCan() {
  return model(24, 24, 315, (m) => {
    shadow(m, 12, 23, 9);
    cylinder(m, 12, 8, 23, 7.5, C('steel', 0.35), MAT.metal, { open: true, inside: C('gray', 0.06) });
    m.ellipsoid(10, 8, 9, 3, 1.6, 2.5, C('beige', 0.9), MAT.paper); // crumpled report
    m.ellipsoid(15, 7.5, 9, 2.4, 1.4, 2, C('beige', 0.8), MAT.paper);
    // A raccoon tail hanging out the back. Of course.
    for (let k = 0; k < 5; k++) m.capsule(19 + k * 0.4, 9 + k * 2.2, 2, 19.4 + k * 0.4, 11 + k * 2.2, 2, 1.8, 1.6, k % 2 ? C('gray', 0.15) : C('gray', 0.5), MAT.fur);
  });
}

function desk() {
  return sheet([0, 1].map((f) => {
    const c = model(48, 40, 317, (m) => {
      shadow(m, 24, 38.5, 22);
      box(m, 2, 22, 44, 16, 6, C('rust', 0.3), MAT.wood, { topCol: C('rust', 0.36) });
      m.slab([[6, 25], [20, 25], [20, 37], [6, 37]], 10, C('rust', 0.26), MAT.wood, { bevel: 1 });
      // Beige CRT monitor.
      box(m, 14, 4, 20, 15, 4, C('beige', 0.65), MAT.plastic);
      m.slab([[16.5, 6], [31.5, 6], [31.5, 16], [16.5, 16]], 10, C('gray', 0.06), MAT.glass, { bevel: 1.2 });
      m.slab([[10, 18], [26, 17], [27, 20], [10, 21]], 12, C('beige', 0.7), MAT.plastic, { tilt: [0, -1.4], bevel: 0.8 }); // keyboard
      cylinder(m, 38, 13, 18, 2.4, C('beige', 0.9), MAT.plastic, { open: true, inside: C('rust', 0.1) }); // mug
    });
    for (let y = 8; y < 15; y += 2) for (let x = 18; x < 30; x++) if ((x * 7 + y * 3 + f) % 5) c.set(x, y, G('green', f ? 0.6 : 0.4));
    return c;
  }));
}

function cone() {
  return model(16, 24, 319, (m) => {
    shadow(m, 8, 23, 6);
    m.slab([[2, 20], [14, 20], [15, 23], [1, 23]], 2, C('orange', 0.5), MAT.plastic, { tilt: [0, -1.5] });
    m.capsule(8, 3, 4, 8, 19, 4, 0.8, 5, C('orange', 0.6), MAT.plastic);
    m.paint(8, 11, 4, 1.5, C('beige', 0.92), MAT.plastic);
  });
}

function sleepingCoworker() {
  return sheet([0, 1].map((f) => {
    const m = new Model(48, 24, { seed: 321 });
    const J = skeleton(48, 24, {
      fall: 1.57,
      armL: { spread: 6, bend: 20 },
      armR: { spread: 8, swing: 20, bend: 40 },
      legL: { thigh: 20, knee: 40 },
      legR: { thigh: 5, knee: 10 },
      headLift: f,
    }, { height: 40 });
    body(m, J, { skin: C('skin', 0.55), shirt: C('steel', 0.45), pants: C('gray', 0.25), hair: C('rust', 0.2), sleeve: 'long' });
    const c = m.render(RENDER);
    // Zzz (they're just asleep).
    const z = G('yellow', 0.9);
    for (const [x, y] of [[0, 0], [1, 0], [2, 0], [1, 1], [0, 2], [1, 2], [2, 2]]) c.set(8 + x, 2 - f + y, z);
    return c;
  }));
}

function bloodPool() {
  return model(32, 8, 323, (m) => puddle(m, 16, 4, 14, 3, C('blood', 0.32)));
}

function serverTower() {
  return sheet([0, 1, 2].map((f) => {
    const c = model(24, 48, 325, (m) => {
      shadow(m, 12, 46.5, 9);
      box(m, 3, 4, 18, 42, 3, C('gray', 0.16), MAT.metal, { topCol: C('gray', 0.22) });
      for (let k = 0; k < 7; k++) m.slab([[4.5, 6 + k * 5.6], [19.5, 6 + k * 5.6], [19.5, 10.5 + k * 5.6], [4.5, 10.5 + k * 5.6]], 9, C('gray', 0.22), MAT.metal, { bevel: 0.6, thickness: 0.4 });
    });
    for (let k = 0; k < 7; k++) {
      c.set(16, 8 + k * 5.6, (k + f) % 3 ? G('green', 0.7) : G('amber', 1));
      c.set(18, 8 + k * 5.6, (k * 2 + f) % 4 ? C('gray', 0.2) : G('red', 1));
    }
    return c;
  }));
}

function toxicDrum() {
  const drum = (glow) => {
    const c = model(24, 32, 327, (m) => {
      shadow(m, 12, 31, 9);
      cylinder(m, 12, 6, 31, 9, C('toxic', 0.32), MAT.metal, { topCol: C('toxic', 0.4) });
      for (const y of [12, 22]) m.paint(12, y, 9.2, 0.9, C('toxic', 0.18));
      m.paint(12, 17, 4, 3.4, C('yellow', 0.7), MAT.plastic); // hazard label
      m.paint(12, 17, 1.8, 1.6, C('gray', 0.1));
    });
    // Glowing ooze over the lip.
    for (let x = 5; x < 20; x++) c.set(x, 6, G('green', glow));
    for (const [x, len] of [[6, 4], [10, 7], [16, 3]]) for (let y = 7; y < 7 + len; y++) c.set(x, y, G('green', glow * 0.6));
    return c;
  };
  const blast = (k) => {
    const c = new PixelCanvas(24, 32);
    const r = 5 + k * 3;
    if (k < 4) flash(c, 12, 22 - k * 2, r, G('yellow', 1), k > 1 ? G('red', 0.6) : G('yellow', 0.4));
    if (k >= 2) {
      // Burst drum remains.
      const m = new Model(24, 32, { seed: 329 });
      m.slab([[3, 26], [21, 26], [22, 31], [2, 31]], 0, C('toxic', 0.25), MAT.metal, { tilt: [0, -1.2], bevel: 1 });
      m.slab([[4, 22], [9, 20], [10, 27], [3, 28]], 2, C('toxic', 0.3), MAT.metal, { bevel: 1 });
      const base = m.render(RENDER);
      base.blit(c, 0, 0);
      return base;
    }
    return c;
  };
  return sheet([drum(1), drum(0.4), blast(0), blast(1), blast(2), blast(3), blast(4)]);
}

function trashPile() {
  const r = rng(11);
  return model(48, 24, 331, (m) => {
    shadow(m, 24, 23, 22);
    for (let k = 0; k < 7; k++) m.ellipsoid(r.int(8, 40), r.int(14, 21), r.range(0, 4), r.range(5, 8), r.range(3, 5), 5, r.chance(0.5) ? C('olive', 0.14) : C('gray', 0.13), MAT.bag);
    m.slab([[6, 18], [14, 17], [14, 22], [6, 23]], 8, C('beige', 0.55), MAT.paper, { bevel: 0.8 });
    cylinder(m, 34, 15, 21, 2.4, C('blood', 0.5), MAT.metal);
    m.capsule(20, 12, 8, 26, 14, 8, 1, 0.8, C('toxic', 0.45), MAT.glass);
  });
}

function tires() {
  return model(32, 24, 333, (m) => {
    shadow(m, 16, 23, 14);
    for (const [y, x] of [[19, 15], [14, 17], [9, 16]]) {
      m.ellipsoid(x, y, 2, 12, 4.2, 6, C('gray', 0.1), MAT.leather);
      m.dent(x, y - 0.5, 5, 1.6, 2.2);
      m.paint(x, y - 0.5, 4, 1.2, C('gray', 0.03));
    }
  });
}

function crtTv() {
  return sheet([0, 1, 2].map((f) => {
    const c = model(32, 32, 335, (m) => {
      shadow(m, 16, 31, 13);
      box(m, 3, 7, 26, 23, 4, C('rust', 0.25), MAT.wood, { topCol: C('rust', 0.3) });
      m.slab([[6, 10], [23, 10], [23, 26], [6, 26]], 10, C('gray', 0.1), MAT.glass, { bevel: 2.5, thickness: 1.5 });
      m.capsule(12, 7, 0, 7, 0, -2, 0.4, 0.4, C('steel', 0.6), MAT.metal);
      m.capsule(18, 7, 0, 24, 1, -2, 0.4, 0.4, C('steel', 0.6), MAT.metal);
      m.sphere(26, 14, 9, 1.2, C('gray', 0.5), MAT.metal);
      m.sphere(26, 19, 9, 1.2, C('gray', 0.5), MAT.metal);
    });
    const r = rng(40 + f);
    for (let y = 12; y < 25; y++) for (let x = 8; x < 22; x++) {
      const v = r();
      if (v > 0.35) c.set(x, y, v > 0.85 ? G('tube', 1) : v > 0.6 ? G('tube', 0) : C('gray', 0.5));
    }
    return c;
  }));
}

function shoppingCart() {
  return model(40, 32, 337, (m) => {
    shadow(m, 20, 31, 17);
    const metal = C('steel', 0.62);
    for (let x = 6; x <= 34; x += 4) m.capsule(x, 6, 2, x + 1, 20, 4, 0.5, 0.5, metal, MAT.metal);
    for (let y = 6; y <= 20; y += 3.5) m.capsule(5, y, 2, 35, y, 2, 0.5, 0.5, metal, MAT.metal);
    m.capsule(3, 4, 0, 37, 4, 0, 1, 1, C('blood', 0.5), MAT.plastic); // handle
    for (const x of [8, 32]) {
      m.capsule(x, 20, 3, x, 27, 3, 0.6, 0.6, metal, MAT.metal);
      m.sphere(x, 28.5, 4, 1.8, C('gray', 0.12), MAT.plastic);
    }
    m.ellipsoid(20, 15, 1, 9, 5, 4, C('olive', 0.14), MAT.bag); // garbage bag riding inside
  });
}

function burningBarrel() {
  return sheet([0, 1, 2, 3].map((f) => {
    const c = model(24, 40, 339, (m) => {
      shadow(m, 12, 39, 9);
      cylinder(m, 12, 16, 39, 8.5, C('rust', 0.3), MAT.metal, { open: true, inside: C('gray', 0.04) });
      for (const y of [22, 32]) m.paint(12, y, 8.6, 0.8, C('rust', 0.18));
    });
    const r = rng(500 + f);
    for (let k = 0; k < 40; k++) {
      const x = 12 + r.range(-6, 6);
      const top = 16 - r.range(0, 14) * (1 - Math.abs(x - 12) / 8);
      for (let y = Math.floor(top); y < 17; y++) {
        const t = (y - top) / Math.max(1, 17 - top);
        c.set(x, y, t > 0.7 ? G('yellow', 0.9) : t > 0.35 ? G('yellow', 0.4) : G('red', 0.8));
      }
    }
    return c;
  }));
}

function bones() {
  return model(32, 16, 341, (m) => {
    shadow(m, 16, 15, 13);
    const bone = C('beige', 0.72);
    m.capsule(5, 12, 2, 18, 10, 3, 1.1, 1.1, bone, MAT.bone);
    m.sphere(5, 12, 3, 1.8, bone, MAT.bone);
    m.sphere(18, 10, 4, 1.8, bone, MAT.bone);
    // A fish skeleton: a raccoon's leftovers.
    m.capsule(14, 13, 5, 28, 13, 5, 0.6, 0.6, bone, MAT.bone);
    for (let k = 0; k < 5; k++) m.capsule(17 + k * 2.2, 11, 6, 17 + k * 2.2, 15, 6, 0.35, 0.35, bone, MAT.bone);
    m.ellipsoid(13, 13, 5, 2, 1.8, 2, bone, MAT.bone);
    m.slab([[27, 13], [31, 10.5], [31, 15.5]], 6, bone, MAT.bone, { bevel: 0.6 });
  });
}

export default [
  { name: 'office-chair', out: D('office-chair'), draw: officeChair, dither: 'fs' },
  { name: 'ficus', out: D('ficus'), draw: ficus, dither: 'fs' },
  { name: 'water-cooler', out: D('water-cooler'), draw: waterCooler, dither: 'fs' },
  { name: 'copier', out: D('copier'), draw: copier, dither: 'fs' },
  { name: 'filing-cabinet', out: D('filing-cabinet'), draw: filingCabinet, dither: 'fs' },
  { name: 'floor-lamp', out: D('floor-lamp'), draw: floorLamp, dither: 'fs' },
  { name: 'ceiling-lamp', out: D('ceiling-lamp'), draw: ceilingLamp, dither: 'fs' },
  { name: 'trash-can', out: D('trash-can'), draw: trashCan, dither: 'fs' },
  { name: 'desk', out: D('desk'), draw: desk, dither: 'fs' },
  { name: 'cone', out: D('cone'), draw: cone, dither: 'fs' },
  { name: 'sleeping-coworker', out: D('sleeping-coworker'), draw: sleepingCoworker, dither: 'fs' },
  { name: 'blood-pool', out: D('blood-pool'), draw: bloodPool, dither: 'fs' },
  { name: 'server-tower', out: D('server-tower'), draw: serverTower, dither: 'fs' },
  { name: 'toxic-drum', out: D('toxic-drum'), draw: toxicDrum, dither: 'fs' },
  { name: 'trash-pile', out: D('trash-pile'), draw: trashPile, dither: 'fs' },
  { name: 'tires', out: D('tires'), draw: tires, dither: 'fs' },
  { name: 'crt-tv', out: D('crt-tv'), draw: crtTv, dither: 'fs' },
  { name: 'shopping-cart', out: D('shopping-cart'), draw: shoppingCart, dither: 'fs' },
  { name: 'burning-barrel', out: D('burning-barrel'), draw: burningBarrel, dither: 'fs' },
  { name: 'bones', out: D('bones'), draw: bones, dither: 'fs' },
];


