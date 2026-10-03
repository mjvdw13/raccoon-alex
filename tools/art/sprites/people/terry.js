// Terry, hand-drawn from his photo (assets/custom/coworkers/terry-photo.png):
// shaved head, dark aviator sunglasses, stubble and a half-smile, a red mesh
// pinnie with black binding over a maroon tee. Khaki trousers and grey
// trainers. 64x64 frames, drawn 1:1, finished with paint() so the shading
// reads as soft painted pixels rather than flat cel bands.
//
// Frames: 0-1 idle (scratching his head, wondering where he is), 2-5 walk,
// 6 react (a shrug).
import { C } from '../../lib/pal.js';
import { part, compose, paint } from '../../lib/pixels.js';
import { sheet } from '../../lib/sprite.js';

const L = {
  // Skin, light to shadow; the scalp catches the most light.
  L: C('skin', 0.94),
  S: C('skin', 0.86),
  s: C('skin', 0.74),
  t: C('skin', 0.62),
  u: C('skin', 0.5),
  U: C('skin', 0.4),
  b: C('skin', 0.46), // stubble
  r: C('flesh', 0.25), // mouth
  W: C('beige', 0.92), // teeth
  // Aviators: dark lenses with a glint.
  k: C('gray', 0.06),
  K: C('gray', 0.3),
  // Maroon tee.
  M: C('blood', 0.42),
  n: C('blood', 0.32),
  j: C('blood', 0.22),
  J: C('blood', 0.14),
  // Red mesh pinnie and its black binding.
  A: C('blood', 0.9),
  B: C('blood', 0.8),
  c: C('blood', 0.7),
  D: C('blood', 0.58),
  T: C('blood', 0.06),
  // Khaki trousers.
  P: C('beige', 0.6),
  p: C('beige', 0.48),
  q: C('beige', 0.36),
  Q: C('beige', 0.26),
  // Grey trainers.
  V: C('gray', 0.36),
  v: C('gray', 0.2),
  Z: C('gray', 0.08),
};
const P = (rows) => part(rows, L);

// ------------------------------------------------------------------ head
// 10 wide: a round shaved head with ears, the aviators and stubble.

const headRows = (mouth) => [
  '...sSSst..',
  '..sSLLsst.',
  '.sSLLSsstu',
  '.sSsssstu.',
  '.sssssttu.',
  'tKkkkKkkku',
  'UkkkstkkkU',
  'UtkkSukktU',
  'UtsssUsstU',
  '.btssssbb.',
  ...mouth,
  '...bbbb...',
  '...tuuU...',
  '...tuuU...',
];

const head = P(headRows(['.bbrWWWrb.', '..bbbbbb..']));
const headHuh = P(headRows(['.bbbrrbbb.', '..bbrrbb..']));

// ------------------------------------------------------------------ body
// 14 wide: the pinnie's shoulder straps over the tee, mesh dots on the front.

const mesh = 'MMTABBBcccDDTJ';
const meshDots = 'MMTABcBccDcDTJ';
const torso = P([
  '..MMntuuUnjJ..',
  '.MTBTnnnnTDTJ.',
  'MMTBBTnnTcDTjJ',
  'MMTABBBBcccDTJ',
  ...Array(6).fill(0).flatMap(() => [mesh, meshDots]),
  'jjTBBcccDDDDTJ',
  'jjTTTTTTTTTTTJ',
  'jjjjjJJJJJJJJJ',
]);

// ------------------------------------------------------------------ legs

const hips = P(Array(4).fill('PPpppppqqqQQ'));
const trousers = (n) => [...Array(9).fill('PPppq'), 'PPPpq', ...Array(n - 10).fill('PPppq')];
const shoes = ['VvvvZ', 'vvvvZ', 'ZZZZZ'];
const legL = P([...trousers(19), ...shoes]);
const legR = P([...trousers(19), ...shoes]);
const legUp = P([...trousers(17), 'VvvvZ', 'vvvvZ', '.ZZZ.']);

// ------------------------------------------------------------------ arms
// Arms at his sides. Left of the sprite origin (21, 23), right (38, 23).

const armL = (swing = 0) =>
  P([
    '...Mn',
    '..MMn',
    '.MMnj',
    '.Mnnj',
    '.nnjJ',
    '.jjJJ',
    ...Array(14 + swing).fill('.Stu.'),
    '.Sstu',
    '.sstu',
    '..tu.',
  ]);

const armR = (swing = 0) =>
  P([
    'nj...',
    'njJ..',
    'njjJ.',
    'nnjJ.',
    'njjJ.',
    'jJJJ.',
    ...Array(14 + swing).fill('.tuU.'),
    'stuU.',
    'tuUU.',
    '.uU..',
  ]);

// Scratching the top of his head, elbow up. Origin (33, 5).
const armScratch = P([
  '.SSs.......',
  'SsSst......',
  'Sssstu.....',
  '.Ssstu.....',
  '...Sstu....',
  '....Sstu...',
  '.....Sstu..',
  '......Sstu.',
  '.......Sstu',
  '.......Sstu',
  '.......Sstu',
  '......Sstu.',
  '......Sstu.',
  '.....Sstu..',
  '.....MMnj..',
  '.....MMnjJ.',
  '....MMnnjJ.',
  '....Mnnjj..',
  '...nnjjJ...',
]);

// Shrugging: elbows in, forearms out, palms up. Origins (14, 23) and (38, 23).
const shrugL = P([
  '..........Mn',
  '.........MMn',
  '........MMnj',
  '........Mnnj',
  '.......Mnnj.',
  '.S.....jjJ..',
  '.Ss.s..Stu..',
  '.SsSs..Stu..',
  '..SsSSSStu..',
  '..tssssstu..',
  '...uuuuuu...',
]);
const shrugR = P([
  'nj..........',
  'njJ.........',
  'njjJ........',
  'nnjJ........',
  '.njjJ.......',
  '..jJJ.....t.',
  '..stu..s.tu.',
  '..stu..stuu.',
  '..sttttttu..',
  '..tttttuu...',
  '...uuuuu....',
]);

// ------------------------------------------------------------------ frames

function frame({ left = armL(), leftX = 21, right = armR(), rightX = 38, rightY = 23, head: h = head, headX = 0, bob = 0, lift = 0 }, seed) {
  const y = (v) => v + bob;
  const f = compose(64, 64, [
    [lift === 1 ? legUp : legL, 26, lift === 1 ? 43 : 41],
    [lift === 2 ? legUp : legR, 33, lift === 2 ? 43 : 41],
    [hips, 26, 41],
    [torso, 25, y(22)],
    [h, 27 + headX, y(8)],
    [left, leftX, y(23)],
    [right, rightX, y(rightY)],
  ]);
  // Faces, sunglasses and trainers stay crisp.
  return paint(f, { blend: ['blood', 'beige'], crisp: ['gray', 'skin', 'flesh'], grain: 0.06, seed });
}

export function terrySheet() {
  return sheet([
    frame({ right: armScratch, rightX: 33, rightY: 5, headX: -1 }, 1), // scratching his head
    frame({ right: armScratch, rightX: 33, rightY: 5, head: headHuh, bob: -1 }, 2),
    frame({ left: armL(1), right: armR(-1), lift: 1, bob: -1 }, 3), // walk
    frame({}, 4),
    frame({ left: armL(-1), right: armR(1), lift: 2, bob: -1 }, 5),
    frame({}, 6),
    frame({ left: shrugL, leftX: 14, right: shrugR, rightX: 38, head: headHuh, bob: -1 }, 7), // shrug
  ]);
}
