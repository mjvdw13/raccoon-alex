// Vera, hand-drawn and kept entirely in greyscale, like she stepped out of an
// old photo: straight shoulder-length hair with side-swept bangs, a smirk, a black
// scoop-neck top, dark jeans. Unimpressed with everything, arms crossed.
// 64x64 frames, drawn 1:1, finished with paint() so the shading reads as
// soft painted pixels rather than flat cel bands.
//
// Frames: 0-1 idle (arms crossed, then a tilt of the head), 2-5 walk (arms
// still crossed), 6 react (hand on hip).
import { C } from '../../lib/pal.js';
import { part, compose, paint } from '../../lib/pixels.js';
import { sheet } from '../../lib/sprite.js';

// Every colour comes from the grey ramp.
const L = {
  // Skin, light to shadow.
  S: C('gray', 0.86),
  s: C('gray', 0.76),
  t: C('gray', 0.66),
  u: C('gray', 0.56),
  U: C('gray', 0.46),
  e: C('gray', 0.06), // eyes
  m: C('gray', 0.4), // lips
  // Hair.
  H: C('gray', 0.42),
  h: C('gray', 0.33),
  d: C('gray', 0.24),
  D: C('gray', 0.15),
  // Black top.
  q: C('gray', 0.18),
  K: C('gray', 0.1),
  k: C('gray', 0.04),
  // Dark jeans and shoes.
  N: C('gray', 0.42),
  n: C('gray', 0.34),
  j: C('gray', 0.26),
  J: C('gray', 0.18),
  V: C('gray', 0.14),
  Z: C('gray', 0.06),
};
const P = (rows) => part(rows, L);

// ------------------------------------------------------------------ head
// 12 wide: hair falling to her shoulders, bangs swept across her forehead.

const headRows = (mouth) => [
  '...dhhhhd...',
  '..dhHHhhhdD.',
  '.dhHHHhhhhdD',
  'dhHHhhhhhhdD',
  'dHHhhhhhSsdD',
  'dHhhSSSsssdD',
  'dHhsesSestdD',
  'dhssSSssstdD',
  'dhsssStsstdD',
  mouth,
  'dhhusssthhdD',
  'dhhhhtuhhhdD',
  '.dhhhtuhhhd.',
  '.dDhhtuhhDd.',
];

const head = P(headRows('dhtssmmmutdD'));
const headFlat = P(headRows('dhtssmmmstdD'));

// ------------------------------------------------------------------ body
// 12 wide: the black scoop-neck top, fitted at the waist.

const top = P([
  '.qKKsttuKKk.',
  'qKKKsttuKKkk',
  'qKKKKtuKKKkk',
  ...Array(8).fill('qKKKKKKKKkkk'),
  ...Array(6).fill('.qKKKKKKkkk.'),
  '.KKKKKKKkkk.',
  '.kkkkkkkkkk.',
]);

// ------------------------------------------------------------------ legs

const hips = P(Array(4).fill('NNnnnnnjjjJJ'));
const jeansL = (n) => [...Array(9).fill('NNnnj'), 'NNNnj', ...Array(n - 10).fill('NNnnj')];
const jeansR = (n) => [...Array(9).fill('Nnnjj'), 'NNnjj', ...Array(n - 10).fill('Nnnjj')];
const shoes = ['VVVVZ', 'VVVVZ', 'ZZZZZ'];
const legL = P([...jeansL(18), ...shoes]);
const legR = P([...jeansR(18), ...shoes]);
const legLUp = P([...jeansL(16), 'VVVVZ', 'VVVVZ', '.ZZZ.']);
const legRUp = P([...jeansR(16), 'VVVVZ', 'VVVVZ', '.ZZZ.']);

// ------------------------------------------------------------------ arms
// Arms crossed: short black sleeves, one forearm folded over the other
// (the top one catches more light). Origin (23, 22).

const crossed = P([
  '.qKK..........Kkk.',
  'qKKK..........Kkkk',
  'qKKk..........kkkk',
  'qKkk..........kkkK',
  '.tsu..........tuU.',
  '.tsu..........tuU.',
  '.tsu.SSssssssstuU.',
  '.tsuSssssssssttuU.',
  '.ttsttttttttuu.uU.',
  '.tttttttttuuuu.UU.',
  '..uuuuuuuuuuu.....',
]);

// Hand on hip: one arm hanging, the other bent with the hand on her hip.
// Origins (23, 22) and (36, 22).
const armHang = P([
  '.qKK',
  'qKKK',
  'qKKk',
  'qKkk',
  ...Array(14).fill('.tsu'),
  '.Ssu',
  '.ssu',
  '..u.',
]);
const armHip = P([
  '.Kkk....',
  '.Kkkk...',
  '.kkkk...',
  '..kkkK..',
  '...tuU..',
  '....tuU.',
  '.....tuU',
  '.....tuU',
  '.....tuU',
  '....tuU.',
  '...tuU..',
  '..tuU...',
  '.StuU...',
  '.Sstu...',
  '..tu....',
]);

// ------------------------------------------------------------------ frames

function frame({ arms = [[crossed, 23, 22]], head: h = head, headX = 0, bob = 0, lift = 0 }, seed) {
  const y = (v) => v + bob;
  const f = compose(64, 64, [
    [lift === 1 ? legLUp : legL, 26, 42],
    [lift === 2 ? legRUp : legR, 33, 42],
    [hips, 26, 40],
    [top, 26, y(21)],
    [h, 26 + headX, y(9)],
    ...arms.map(([p, ax, ay]) => [p, ax, y(ay)]),
  ]);
  // One ramp for everything: features stay crisp because they're many shades
  // apart; neighbouring shades of hair, skin and cloth blend.
  return paint(f, { blend: ['gray'], crisp: [], grain: 0.03, seed });
}

export function veraSheet() {
  return sheet([
    frame({}, 1), // arms crossed
    frame({ headX: 1, head: headFlat }, 2), // ...and a tilt of the head
    frame({ lift: 1, bob: -1 }, 3), // walk, arms still crossed
    frame({}, 4),
    frame({ lift: 2, bob: -1 }, 5),
    frame({}, 6),
    frame({ arms: [[armHang, 23, 22], [armHip, 36, 22]], head: headFlat, headX: -1 }, 7), // hand on hip
  ]);
}
