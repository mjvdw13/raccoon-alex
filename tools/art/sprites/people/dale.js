// Dale, hand-drawn: head thrown back, eyes shut, mouth open in a full-body
// sigh. Green SPACE RANGER ACADEMY tee, navy shorts, black socks and
// sneakers, an orange-and-white ball cradled at his hip. 64x64 frames, drawn
// 1:1, finished with paint() so the shading reads as soft painted pixels
// rather than flat cel bands.
//
// Frames: 0 sighing at the ceiling, 1 deep breath in, 2 ...and out,
// 3 react "UGH" (arm flung out), 4 react facepalm.
import { C } from '../../lib/pal.js';
import { part, compose, paint } from '../../lib/pixels.js';
import { sheet } from '../../lib/sprite.js';

const L = {
  // Kelly-green tee, highlight to shadow.
  A: C('toxic', 0.82),
  B: C('toxic', 0.7),
  C: C('toxic', 0.58),
  D: C('toxic', 0.46),
  E: C('toxic', 0.34),
  F: C('toxic', 0.22),
  w: C('beige', 0.95), // shirt print
  v: C('beige', 0.75),
  // Skin, light to shadow.
  S: C('skin', 0.86),
  s: C('skin', 0.74),
  t: C('skin', 0.62),
  u: C('skin', 0.5),
  U: C('skin', 0.4),
  e: C('skin', 0.3), // shut eyes
  h: C('rust', 0.08), // dark hair
  H: C('rust', 0.13),
  R: C('rust', 0.14), // moustache
  r: C('flesh', 0.2), // open mouth
  W: C('beige', 0.98), // teeth
  // Navy shorts.
  N: C('navy', 0.95),
  n: C('navy', 0.78),
  j: C('navy', 0.6),
  J: C('navy', 0.42),
  // Black socks and sneakers, white soles.
  k: C('gray', 0.06),
  K: C('gray', 0.1),
  Q: C('gray', 0.24),
  O: C('gray', 0.86),
  // The ball: orange with a white swirl.
  b: C('orange', 0.85),
  c: C('orange', 0.68),
  d: C('orange', 0.5),
  f: C('orange', 0.34),
  x: C('gray', 0.92),
};
const P = (rows) => part(rows, L);

// ------------------------------------------------------------------ head
// 10 wide, tipped back: a cap of hair, a short forehead, shut eyes, the
// underside of his jaw and a long neck.

const headRows = (mouth) => [
  '..hhhhhh..',
  '.hhHhhhhh.',
  'hhsSSSsshh',
  'hseesseesh',
  'tsSsssssst',
  'tsssUUsssu',
  'tsRRRRRRsu',
  ...mouth,
  '.utsssstu.',
  '..uUUUUu..',
  '...UUUU...',
  '...tssu...',
  '...tUsu...',
];

const headSigh = P(headRows(['tssRrrRssu', 'tssrrrrssu', 'tssrrrrssu', 'utssrrsstu']));
const headHold = P(headRows(['tssssssssu', 'tsssUUsssu', 'tssssssssu', 'utsssssstu']));
const headUgh = P(headRows(['tsRWWWWRsu', 'tsrrrrrrsu', 'tsrrrrrrsu', 'utsrrrrstu']));

// ------------------------------------------------------------------ body
// 14 wide. SPACE / RANGER / ACADEMY with the little spaceman, underlined.

const tee = P([
  '..BBCtttuDDE..',
  '.ABBCCCDDCCDE.',
  'ABBCCCCCCCCDEF',
  'ABwwvwwCCwCDEF',
  'ABCCCCCCwwwDEF',
  'ABwwwvwCCwCDEF',
  'ABCCCCCCwCwDEF',
  'ABwwvwwwCCCDEF',
  'ABCCCCCCCCCDEF',
  'ABvwwwwwwwvDEF',
  'ABCCCCCCCCCDEF',
  'BBCCCCCCCCDDEF',
  'BBCCCCCCCCDDEF',
  'BCCCCCCCCDDEEF',
  'BCCCCCCCCDDEEF',
  'BCCCCCCCDDDEEF',
  'BCCCCCCCDDDEEF',
  'CCCCCCCDDDEEFF',
  'DDDDDDDEEEEFFF',
]);

const shorts = P([
  ...Array(6).fill('NNnnnnnjjjJJ'),
  ...Array(3).fill('NNnnnj.Nnjjj'),
  'jjjjJJ.jjJJJ',
]);

const leg = P([...Array(8).fill('.Stu.'), '.kkk.', '.kkk.', 'QKKKK', 'KKKKK', 'OOOOO']);

// ------------------------------------------------------------------ arms
// His right arm (left of the sprite) hangs at his side. Origin (22, 24).

const armHang = P([
  '...AB',
  '..ABB',
  '.ABBC',
  '.ABCC',
  '.BBCD',
  '.BCDD',
  '.DDEE',
  ...Array(12).fill('.Stu.'),
  '.Sstu',
  '.sstu',
  '..tu.',
]);

// His left arm cradles the ball against his hip. Origin (37, 24).
const armBall = P([
  'DE........',
  'DDE.......',
  'CDEF......',
  'CDEF......',
  'DDEF......',
  'DEFF......',
  'EFF.......',
  '.tuU......',
  '.tuU......',
  '...cbbbc..',
  '..cbxxxcd.',
  '.cbxbbcxdd',
  '.cbxbcddxd',
  '.cbbxxcddf',
  '.ccdbcxxdf',
  '..cddxddsS',
  '...ddffsSt',
  '.....ffttu',
  '.......uu.',
]);

// "UGH": arm flung out, palm up. Origin (13, 18).
const armUgh = P([
  '.S.S.........',
  '.SsSs........',
  '.Sssu........',
  '..Stu........',
  '..Stu........',
  '..Stu........',
  '..Stu......AB',
  '..Stu.....ABB',
  '..Sstu...ABBC',
  '..SttsssABBCD',
  '..uttttuBCCDE',
  '...uuuuUDDEE.',
]);

// Facepalm: hand over his eyes, elbow out. Origin (20, 13).
const armPalm = P([
  '.........SSs..',
  '.......SSssst.',
  '......Sssssstu',
  '......Sssssstu',
  '.....Sstuuu...',
  '.....Stu......',
  '....Stu.......',
  '....Stu.......',
  '...Stu........',
  '..Stu.........',
  '..Stu.........',
  '..StuAB.......',
  '..SABBC.......',
  '..ABBCD.......',
  '..BBCDE.......',
  '...CDEF.......',
  '...DEF........',
]);

// ------------------------------------------------------------------ frames

function frame({ head = headSigh, arm = armHang, armX = 22, armY = 24, bob = 0, headDrop = 0 }, seed) {
  const y = (v) => v + bob;
  const f = compose(64, 64, [
    [leg, 26, 50],
    [leg, 33, 50],
    [shorts, 26, y(41)],
    [tee, 25, y(23)],
    [head, 27, y(8) + headDrop],
    [armBall, 37, y(24)],
    [arm, armX, y(armY)],
  ]);
  // Faces and the shirt print stay crisp.
  return paint(f, { blend: ['toxic', 'navy', 'orange', 'rust'], crisp: ['gray', 'skin', 'flesh', 'beige'], grain: 0.06, seed });
}

export function daleSheet() {
  return sheet([
    frame({}, 1), // sighing at the ceiling
    frame({ head: headHold, bob: -1 }, 2), // deep breath in
    frame({ head: headSigh, headDrop: 1 }, 3), // ...and out
    frame({ head: headUgh, arm: armUgh, armX: 13, armY: 18 }, 4), // UGH
    frame({ head: headHold, arm: armPalm, armX: 20, armY: 13, headDrop: 1 }, 5), // facepalm
  ]);
}
