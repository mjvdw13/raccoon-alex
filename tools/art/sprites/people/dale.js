// Dale, hand-drawn from his photo (assets/custom/coworkers/dale-full.png): head
// thrown back, eyes shut, mouth open in a full-body sigh. Green SPACE RANGER
// ACADEMY tee, navy shorts, black sneakers, a ball cradled at his hip.
// 64x64 frames, drawn 1:1.
//
// Frames: 0 sighing at the ceiling, 1 deep breath in, 2 ...and out,
// 3 react "UGH" (arm flung out), 4 react facepalm.
import { C } from '../../lib/pal.js';
import { part, compose } from '../../lib/pixels.js';
import { sheet } from '../../lib/sprite.js';

const INK = C('gray', 0.03);

const L = {
  h: C('gray', 0.07), // hair
  H: C('rust', 0.12),
  s: C('skin', 0.66),
  S: C('skin', 0.8),
  z: C('skin', 0.5),
  Z: C('skin', 0.36), // under his jaw
  e: C('skin', 0.26), // shut eyes
  B: C('rust', 0.1), // moustache
  r: C('blood', 0.18), // open mouth
  w: C('beige', 0.98), // teeth, shirt print
  G: C('toxic', 0.62), // green tee
  g: C('toxic', 0.5),
  f: C('toxic', 0.36),
  d: C('toxic', 0.24),
  N: C('navy', 0.85), // shorts
  n: C('navy', 0.65),
  m: C('navy', 0.4),
  k: C('gray', 0.06), // socks and sneakers
  K: C('gray', 0.2),
  W: C('gray', 0.9), // soles, ball stripes
  o: C('orange', 0.62), // ball
  O: C('orange', 0.8),
  q: C('orange', 0.4),
};
const P = (rows) => part(rows, L);

// ------------------------------------------------------------------ head
// 12 wide, tipped back: a sliver of forehead, the underside of the jaw.

const headRows = (mouth) => [
  '...hhhhhh...',
  '.hhHhhHhhhh.',
  'hhsSSssssshh',
  'hsseesseeszh',
  'zsSssssssssz',
  'zsssseessssz',
  '.sBBBBBBBBz.',
  ...mouth,
  '..zzsssszz..',
  '...ZZZZZZ...',
  '....zzzz....',
  '....zzzz....',
  '....zzzz....',
];

const headSigh = P(headRows(['.sssrwwrssz.', '.sssrrrrssz.', '.zssrrrrszz.', '..zsszzssz..']));
const headHold = P(headRows(['.sssszzsssz.', '.ssssssssz..', '.zsssssszz..', '..zssssszz..']));
const headUgh = P(headRows(['.sBwwwwwwBz.', '.srrrrrrrrz.', '.zsrrrrrrsz.', '..zsrrrrsz..']));

// ------------------------------------------------------------------ body
// 12 wide. SPACE / RANGER / ACADEMY in white on his chest, the little
// spaceman beside it, underlined.

const tee = P([
  'GGgfzzzzfggf',
  'GGggffffgggf',
  'GGgggggggggf',
  'GGwwgwwggwgf',
  'GGggggggwwwf',
  'GGwwwgwggwgf',
  'GGggggggwgwf',
  'GGwwwwwggggf',
  'GGgggggggggf',
  'GGwwwwwwwwwf',
  'GGgggggggggf',
  'GGgggggggggf',
  'GGgggggggggf',
  'GGgggggggfff',
  'Gggggggggffd',
  'ffffffffffdd',
]);

const shorts = P([
  'NNnnnnnnnnmm',
  'NNnnnnnnnnmm',
  'NNnnnnnnnnmm',
  'NNnnnnnnnnmm',
  'NNnnnnnnnnmm',
  'NNnnnm.Nnnmm',
  'NNnnnm.Nnnmm',
  'NNnnnm.Nnnmm',
  'mmmmmm.mmmmm',
]);

const leg = P([...Array(9).fill('.Ssz.'), '.kkk.', 'kKkkk', 'kkkkk', 'WWWWW']);

// ------------------------------------------------------------------ arms
// His right arm (left of the sprite) hangs at his side. Origin (21, 28).

const armHang = P([
  '...Gg',
  '..GGg',
  '.GGgg',
  '.GGgg',
  '.GGgf',
  '.fffd',
  ...Array(12).fill('.Ssz.'),
  '.Sssz',
  '.sssz',
  '..sz.',
]);

// His left arm cradles the ball against his hip. Origin (37, 28).
const armBall = P([
  'gf........',
  'ggff......',
  'gggfd.....',
  'gggfd.....',
  'ggffd.....',
  '.fffd.....',
  '.Ssz......',
  '.SsoOOo...',
  '.zoOWWOo..',
  '.oOWOooWq.',
  '.oOoWWooq.',
  '.ooooWWoq.',
  '.qoWWooqq.',
  '..qooqqqSs',
  '...qqqqSsz',
  '......zzz.',
]);

// "UGH": arm flung out, palm up. Origin (13, 23).
const armUgh = P([
  '.S.S........',
  '.SsSs.......',
  '.Ssss.......',
  '..Ssz.......',
  '..Ssz.......',
  '..Ssz....GGg',
  '..Ssz...GGgg',
  '..SszssGGggf',
  '...zzzzzffd.',
]);

// Facepalm: hand over his eyes, elbow out. Origin (19, 16).
const armPalm = P([
  '..............',
  '.......SSssss.',
  '.......Ssssssz',
  '......Ssssssz.',
  '.....Sszzz....',
  '....Ssz.......',
  '....Ssz.......',
  '...Ssz........',
  '...Ssz........',
  '..Ssz.........',
  '..Ssz.........',
  '..Ssz.........',
  '..SszGGg......',
  '..SsGGgg......',
  '...GGggf......',
  '...Gggfd......',
  '....ffd.......',
]);

// ------------------------------------------------------------------ frames

function frame({ head = headSigh, arm = armHang, armX = 21, armY = 28, bob = 0, headDrop = 0 }) {
  const y = (v) => v + bob;
  const f = compose(64, 64, [
    [leg, 26, 50],
    [leg, 33, 50],
    [shorts, 26, y(43)],
    [tee, 26, y(27)],
    [head, 26, y(12) + headDrop],
    [armBall, 37, y(28)],
    [arm, armX, y(armY)],
  ]);
  return f.outline(INK);
}

export function daleSheet() {
  return sheet([
    frame({}), // sighing at the ceiling
    frame({ head: headHold, bob: -1 }), // deep breath in
    frame({ head: headSigh, headDrop: 1 }), // ...and out
    frame({ head: headUgh, arm: armUgh, armX: 13, armY: 23 }), // UGH
    frame({ head: headHold, arm: armPalm, armX: 19, armY: 16, headDrop: 1 }), // facepalm
  ]);
}
