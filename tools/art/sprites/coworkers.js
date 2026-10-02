// Alex's coworkers: friendly NPCs who are also stuck in the office at 3 AM.
// Bodies are sculpted with the humanoid rig at twice the usual resolution
// (128x128 frames, drawn at half scale in the game), and each one wears their
// own face, taken from a photo in assets/custom/coworkers/ and mapped onto the
// head by matching two points (usually the eyes).
//
// Gus and Benny are the exception: they're hand-drawn pixel art (people/), 64x64
// frames drawn 1:1. The others will follow.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mix, darken } from '../lib/canvas.js';
import { C } from '../lib/pal.js';
import { Model, MAT } from '../lib/model.js';
import { skeleton, body } from '../lib/rig.js';
import { sheet } from '../lib/sprite.js';
import { loadPhoto, pointMap, skinTone } from '../lib/photo.js';
import { gusSheet } from './people/gus.js';
import { bennySheet } from './people/benny.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const photo = (name) => loadPhoto(path.join(root, `assets/custom/coworkers/${name}.png`));
const OUT = (name) => `assets/sprites/coworkers/${name}.png`;
const W = 128;
const H = 128;
const RENDER = { light: [-0.45, -0.6, 0.66], ambient: 0.38, aoStrength: 0.42 };

/**
 * Joints for a pose. Arm `reach` targets are given relative to the chest (in
 * rig units, scaled by the body size) so poses can be written once.
 */
function joints(pose, dims) {
  const base = skeleton(W, H, { ...pose, armL: {}, armR: {} }, dims);
  const s = base.s;
  const fix = (arm) => {
    if (!arm?.reachChest) return arm;
    const [x, y, z] = arm.reachChest;
    return { ...arm, reach: [base.chest[0] + x * s, base.chest[1] + y * s, base.chest[2] + z * s] };
  };
  return skeleton(W, H, { ...pose, armL: fix(pose.armL), armR: fix(pose.armR) }, dims);
}

/**
 * Put a photographed face on the head. `anchors` pairs two photo points with
 * two points on the head (in head-relative rig units: x right, y down).
 */
function photoFace(m, J, img, anchors, { center = [0, 1.3], radius = [3.9, 4.9], level = 150, colorize, keep } = {}) {
  const s = J.s;
  const [hx, hy] = J.head;
  const q = anchors.map(([, [x, y]]) => [hx + x * s, hy + y * s]);
  const map = pointMap(q, anchors.map(([p]) => p));
  m.imprint(img, hx + center[0] * s, hy + center[1] * s, radius[0] * s, radius[1] * s, map, { level, colorize, keep, feather: 1.2 * s });
}

function frames(list, draw) {
  return sheet(list.map((pose) => draw(pose).render(RENDER)));
}

// ------------------------------------------------------------------ Dale
// Exasperated. Stands around holding a ball, sighing at the ceiling.

function dale() {
  const face = photo('dale');
  const shirt = mix(C('toxic', 0.42), C('teal', 0.5), 0.4);
  const draw = (pose) => {
    const m = new Model(W, H, { seed: 701 });
    const J = joints(pose, { height: 100, build: 1.05 });
    const s = J.s;
    body(m, J, {
      skin: C('skin', 0.66),
      shirt,
      sleeve: 'short',
      pants: C('navy', 0.5),
      shins: C('skin', 0.64),
      shoes: C('gray', 0.08),
      hair: C('rust', 0.07),
      clothes(mm, j) {
        // SPACE RANGER ACADEMY across the chest, with a little spaceman.
        const [cx, cy] = j.chest;
        for (let r = 0; r < 3; r++) mm.paintPoly([[cx - 4.8 * s, cy - 2.4 * s + r * 1.5 * s], [cx + 0.6 * s, cy - 2.4 * s + r * 1.5 * s], [cx + 0.6 * s, cy - 1.7 * s + r * 1.5 * s], [cx - 4.8 * s, cy - 1.7 * s + r * 1.5 * s]], C('beige', 0.95));
        mm.paint(cx + 2.6 * s, cy - 1.2 * s, 1.1 * s, 2.4 * s, C('beige', 0.9));
      },
      face(mm, j) {
        // Curls.
        const [hx, hy, hz] = j.head;
        for (const [x, y] of [[-3.6, -3.4], [-1.6, -4.8], [0.8, -5], [3, -4], [-4.4, -1.4], [4.2, -2]]) mm.sphere(hx + x * s, hy + y * s, hz - 0.5 * s, 1.5 * s, C('rust', 0.08), MAT.hair);
        photoFace(mm, j, face, [[[32.5, 31], [-1.7, -0.6]], [[56, 46], [1.6, 3.2]]], { center: [0.2, 1.1], radius: [3.8, 4.7], level: 140 });
      },
      held(mm, j) {
        // The ball, tucked against his hip.
        const [x, y, z] = j.handR;
        mm.sphere(x + 1.8 * s, y - 0.6 * s, z + 1.5 * s, 4.4 * s, C('orange', 0.5), MAT.leather);
        mm.stroke(x + 1.8 * s, y - 5 * s, x + 1.8 * s, y + 3.8 * s, 0.35 * s, C('gray', 0.1));
        mm.stroke(x - 2.6 * s, y - 0.6 * s, x + 6.2 * s, y - 0.6 * s, 0.35 * s, C('gray', 0.1));
      },
    });
    return m;
  };
  const hold = { reachChest: [5.6, 9.4, 3] };
  return frames(
    [
      { headLift: 1, armL: { spread: 9, bend: 10 }, armR: hold },
      { headLift: 2.6, bob: -1.5, armL: { spread: 12, bend: 14 }, armR: hold }, // deep breath in
      { headLift: 0.4, bob: 0.6, hunch: 1.2, armL: { spread: 7, bend: 6 }, armR: hold }, // ...and out
      { headLift: 2, armL: { spread: 60, swing: -10, bend: 50 }, armR: { reachChest: [9, -3, 4] } }, // UGH
      { headLift: 0.5, hunch: 0.8, armL: { reachChest: [1.6, -12.2, 6.2] }, armR: hold }, // facepalm
    ],
    draw,
  );
}

// ------------------------------------------------------------------ Vera
// Unimpressed with everything. Arms crossed, always.

function vera() {
  const face = photo('vera');
  const hair = C('rust', 0.17);
  const draw = (pose) => {
    const m = new Model(W, H, { seed: 702 });
    const J = joints(pose, { height: 96, build: 0.9, shoulders: 6.2, hips: 3.5 });
    const s = J.s;
    const [hx, hy, hz] = J.head;
    // Long hair falls behind the shoulders.
    m.ellipsoid(hx, hy + 3.5 * s, hz - 3.2 * s, 5.2 * s, 8.5 * s, 2.6 * s, hair, MAT.hair);
    body(m, J, {
      skin: C('skin', 0.72),
      shirt: C('gray', 0.07),
      sleeve: 'long',
      pants: mix(C('navy', 0.45), C('steel', 0.32), 0.35),
      shoes: C('gray', 0.1),
      hair,
      headShape: { rx: 4.2, ry: 5.2, rz: 4.5 },
      clothes(mm, j) {
        const [cx, cy] = j.chest;
        mm.paint(cx, cy - 4.8 * s, 3.2 * s, 1.9 * s, C('skin', 0.7)); // scoop neckline
      },
      face(mm, j) {
        photoFace(mm, j, face, [[[20, 46], [-1.7, -0.3]], [[47.5, 35], [1.7, -0.3]]], { center: [0, 1.4], radius: [3.7, 4.8], level: 168, colorize: skinTone });
        const [x, y, z] = j.head;
        // Hair framing the face, side-swept bangs.
        for (const side of [-1, 1]) mm.capsule(x + side * 4 * s, y - 1.6 * s, z + 0.6 * s, x + side * 4.9 * s, y + 7.5 * s, z - 0.4 * s, 1.7 * s, 1.3 * s, hair, MAT.hair);
        mm.capsule(x + 1.8 * s, y - 4.6 * s, z + 2.2 * s, x - 3.4 * s, y - 2.4 * s, z + 2.8 * s, 1.3 * s, 0.9 * s, hair, MAT.hair);
      },
    });
    return m;
  };
  const crossed = { armL: { reachChest: [4.2, 3.6, 5.6] }, armR: { reachChest: [-4.2, 2.6, 6.2] } };
  const walk = (k) => {
    const t = [22, 4, -12, 4][k];
    const u = [-12, 4, 22, 4][k];
    return { ...crossed, bob: k % 2 ? -0.8 : 0, legL: { thigh: t, knee: t > 10 ? 28 : 8 }, legR: { thigh: u, knee: u > 10 ? 28 : 8 } };
  };
  return frames(
    [
      { ...crossed },
      { ...crossed, headTilt: -1, lean: 1 },
      walk(0),
      walk(1),
      walk(2),
      walk(3),
      { headTilt: 1.2, lean: -1, armL: { spread: 8, bend: 8 }, armR: { reachChest: [6.8, 9.6, 1] } }, // hand on hip
    ],
    draw,
  );
}

// ------------------------------------------------------------------ Terry
// Confused. Scratches his head and wanders around wondering where he is.

function terry() {
  const face = photo('terry');
  const skin = C('skin', 0.7);
  const draw = (pose) => {
    const m = new Model(W, H, { seed: 704 });
    const J = joints(pose, { height: 100 });
    const s = J.s;
    body(m, J, {
      skin,
      shirt: mix(C('blood', 0.28), C('rust', 0.25), 0.4),
      sleeve: 'short',
      pants: C('beige', 0.45),
      shoes: C('gray', 0.2),
      headShape: { rx: 4.5, ry: 5.4, rz: 4.7 },
      clothes(mm, j) {
        // Bright red running vest over the shirt.
        const [cx, cy] = j.chest;
        for (const side of [-1, 1]) mm.paintPoly([[cx + side * 1.8 * s, cy - 6 * s], [cx + side * 4.6 * s, cy - 6 * s], [cx + side * 6.2 * s, cy + 5.5 * s], [cx + side * 2.6 * s, cy + 5.5 * s]], C('blood', 0.62));
      },
      face(mm, j) {
        // The photo is a three-quarter view with a green vest behind him: keep only skin.
        const skinOnly = ([r, g, b]) => (r + g + b < 210 ? 1 : Math.max(0, Math.min(1, (r - g - 4) / 16)));
        photoFace(mm, j, face, [[[82, 66], [-1.7, -0.3]], [[127, 61], [1.7, -0.3]]], { center: [-0.3, 0.6], radius: [3.9, 5.6], level: 150, keep: skinOnly });
      },
    });
    return m;
  };
  const scratch = { reachChest: [3.6, -15.5, 1.6] };
  const shrugL = { spread: 40, swing: 25, bend: 75 };
  const shrugR = { spread: 40, swing: 25, bend: 75 };
  const walk = (k) => {
    const t = [20, 4, -10, 4][k];
    const u = [-10, 4, 20, 4][k];
    return { armL: { spread: 10, swing: [18, 0, -16, 0][k], bend: 20 }, armR: { spread: 10, swing: [-16, 0, 18, 0][k], bend: 20 }, bob: k % 2 ? -1 : 0, headTilt: [0.5, 0, -0.5, 0][k], legL: { thigh: t, knee: t > 10 ? 26 : 8 }, legR: { thigh: u, knee: u > 10 ? 26 : 8 } };
  };
  return frames(
    [
      { headTilt: -0.8, armL: { spread: 10, bend: 12 }, armR: scratch },
      { headTilt: 0.8, armL: { spread: 10, bend: 12 }, armR: scratch, bob: -0.5 },
      walk(0),
      walk(1),
      walk(2),
      walk(3),
      { bob: -1, armL: shrugL, armR: shrugR }, // shrug
    ],
    draw,
  );
}

// ------------------------------------------------------------------ speech bubbles

/** Little speech bubbles that pop up when a coworker reacts. */
function bubbles() {
  const out = [];
  const draw = (fn) => {
    const m = new Model(24, 20, { seed: 710 });
    const pts = [];
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      pts.push([12 + Math.cos(a) * 10.5, 8 + Math.sin(a) * 6.6]);
    }
    m.slab(pts, 4, [255, 255, 255], { ...MAT.plastic, flat: 0.8 }, { bevel: 1.5, thickness: 1 });
    m.slab([[9, 13], [14, 13], [8.5, 19]], 4, [255, 255, 255], { ...MAT.plastic, flat: 0.8 }, { bevel: 0.6, thickness: 0.5 });
    const c = m.render({ light: [-0.3, -0.5, 0.8], ambient: 0.8 });
    fn(c);
    return c;
  };
  const ink = [12, 10, 14];
  const text = (c, rows, x0, y0, col = ink) => rows.forEach((r, y) => [...r].forEach((ch, x) => ch === '#' && c.set(x0 + x, y0 + y, col)));
  out.push(draw((c) => text(c, ['##.##.##', '##.##.##'], 8, 7))); // ...
  out.push(draw((c) => text(c, ['.###.', '#...#', '...#.', '..#..', '.....', '..#..'], 10, 4))); // ?
  out.push(draw((c) => text(c, ['#', '#', '#', '#', '.', '#'], 12, 4))); // !
  out.push(draw((c) => text(c, ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'], 9, 4, [210, 24, 30]))); // heart
  out.push(draw((c) => text(c, ['#..#..###.#..#', '#..#.#....#..#', '#..#.#.##.####', '#..#.#..#.#..#', '.##...###.#..#'], 5, 5))); // UGH
  out.push(draw((c) => text(c, ['.#....##..###..##', '##...#....#...#..', '.#....#...##..#..', '.#.....#..#...#..', '###..##...###..##'], 4, 5))); // 1 SEC
  return sheet(out);
}

export default [
  { name: 'coworker-dale', out: OUT('dale'), draw: dale, dither: 'fs' },
  { name: 'coworker-vera', out: OUT('vera'), draw: vera, dither: 'fs' },
  { name: 'coworker-gus', out: OUT('gus'), draw: gusSheet }, // hand-drawn pixel art (people/gus.js)
  { name: 'coworker-terry', out: OUT('terry'), draw: terry, dither: 'fs' },
  { name: 'coworker-benny', out: OUT('benny'), draw: bennySheet }, // hand-drawn pixel art (people/benny.js)
  { name: 'speech-bubbles', out: 'assets/sprites/fx/bubbles.png', draw: bubbles },
];
