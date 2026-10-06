// Gus, hand-drawn: a felt pumpkin hood with a
// tall green stem, a round stuffed pumpkin body with a black felt
// jack-o'-lantern face and a leafy green collar, a heather-navy t-shirt
// underneath, glasses, a light moustache and stubble, and a black desk phone
// at his ear.
// 64x64 frames, drawn 1:1, finished with paint() so the shading reads as
// soft painted pixels rather than flat cel bands.
//
// Frames: 0-1 idle (on the phone, then talking with his free hand),
// 2-5 walk, 6 react ("hold on", palm raised).
import { C } from '../../lib/pal.js';
import { part, compose, paint } from '../../lib/pixels.js';
import { sheet } from '../../lib/sprite.js';

const L = {
  // Orange felt, highlight to deep shadow (the deepest leans red-brown).
  A: C('orange', 0.95),
  B: C('orange', 0.8),
  C: C('orange', 0.66),
  D: C('orange', 0.52),
  E: C('orange', 0.38),
  F: C('rust', 0.24),
  k: C('gray', 0.07), // black felt face
  // Green felt: stem and leafy collar.
  H: C('toxic', 0.66),
  G: C('toxic', 0.5),
  g: C('toxic', 0.34),
  // Skin, light to shadow.
  S: C('skin', 0.86),
  s: C('skin', 0.76),
  t: C('skin', 0.66),
  u: C('skin', 0.54),
  U: C('skin', 0.42),
  h: C('rust', 0.34), // hair
  b: C('skin', 0.5), // stubble
  R: C('rust', 0.4), // moustache
  m: C('skin', 0.36), // lips and smile
  r: C('flesh', 0.22), // open mouth
  K: C('gray', 0.34), // glasses frames
  i: C('steel', 0.6), // blue eyes
  // Heather-navy t-shirt.
  Y: C('steel', 0.5),
  y: C('steel', 0.42),
  x: C('steel', 0.34),
  X: C('steel', 0.26),
  // Black desk phone and its coiled cord.
  p: C('gray', 0.06),
  P: C('gray', 0.16),
  Q: C('gray', 0.34),
  c: C('gray', 0.1),
  // Dark jeans.
  M: C('navy', 0.95),
  N: C('navy', 0.8),
  n: C('navy', 0.62),
  j: C('navy', 0.42),
  // Shoes.
  W: C('gray', 0.3),
  V: C('gray', 0.14),
  Z: C('gray', 0.06),
};
const P = (rows) => part(rows, L);

// ------------------------------------------------------------------ head
// 16 wide: the stem and the hood, with his bangs peeking out under it.

const headRows = (mouth, chin) => [
  '........H.......',
  '........HG......',
  '.......HGg......',
  '.......HGg......',
  '.......GGg......',
  '......HGGgg.....',
  '......GGGgg.....',
  '.....HGGGggg....',
  '....CBBGGgDD....',
  '...CBAABBCCDE...',
  '..CBAABBCCCCDE..',
  '.CBABBBCCCCCDDE.',
  '.CBBhhhhhhhhDDE.',
  '.CBBKKKsKKKuDDE.',
  '.CBBKiKKKiKuDDE.',
  '.CBBtKKttKKuDDE.',
  '.CBBtssSutsuDEE.',
  '.CBBtbRRRRbuDEE.',
  mouth,
  chin,
  '.DCCCCUbbUDDDEF.',
  'DCCCCCDDDDDDDEEF',
  'EDDDDEEEEEEEFFFF',
];

const head = P(headRows('.CCBbmtttmbUDEE.', '.CCBCbumubUDDEF.'));
const headTalk = P(headRows('.CCBbmrrrmbUDEE.', '.CCBCbmrmbUDDEF.'));

// ------------------------------------------------------------------ body
// 26 wide: the round stuffed pumpkin, lit from the upper left, with four
// ribs and a black felt jack-o'-lantern face.

const pumpkin = P([
  '......BBBBBBBBBBCCCD......',
  '....BBAAABBBBBBBCCCCDD....',
  '...BBBAABBBBBBBBBCCCDDD...',
  '..BBBAAABBBBBBBBBCCCCDDE..',
  '.BBBBAAABBBBBBBBCCCCCDEDE.',
  'BBBBBBBBBBBBBBBBCDDCCDEDEE',
  'BBBBBBBBBBBBBBBCCCDCDDEEEE',
  'BBCBBBkkBBBBBBCCCCkkDDEEEE',
  'BBCBBBkkkBBBBCCCCkkkDDDEEF',
  'BBCBBkkkkkBBCCCCkkkkkDDFEF',
  'CBCBBBBCBBBCCCCCCCDDDDEFEF',
  'CCCBBBBCBCCCkkCCCDEDDEEFFF',
  'CCCCCCCCCCCCCCCCDDEDDEEFFF',
  'CCDDkkCDCCCCCCDDDDEDkkFFFF',
  'CCDDCkkkCkkkkkkkkDkkkEFFFF',
  'DDCDCCkkkkkkDkkkkkkkEEFFFF',
  'DDDDDCCDkkkkkkkkkkEEEFFFFF',
  '.DDDEDDDEDDDDDEEEFEEFFFFF.',
  '.DDDEEDDEDDDEEEEEFFFFFFFF.',
  '..DEEEDDEEEEEEEEFFFFFFFF..',
  '...EEEFEEFEEEEEFFFFFFFF...',
  '....EEEFFEFFFFFFFFFFFF....',
  '......FFFFFFFFFFFFFF......',
  '.........FFFFFFFF.........',
]);

// The leafy collar: broad pointed felt leaves around his neck, reaching out
// over his shoulders and down his chest. 28 wide.
const collar = P([
  '......HHHGGGGGGGGGGGgg......',
  '...HHHHGGGGGGGGGGGGGGGggg...',
  '.HHHHGGGGGGGGGGGGGGGGGGgggg.',
  'HHHGGGGGGGGGGGGGGGGGGGGGgggg',
  '.HGGGG..GGGGGGG.GGGGGGG..gg.',
  '..GG.....GGGGG...GGGGG......',
  '..........GGG.....GGG.......',
  '...........G.......G........',
]);

// ------------------------------------------------------------------ legs

const jeansL = (n) => [...Array(8).fill('MNNnj'), 'MMNnj', ...Array(n - 9).fill('MNNnj')];
const jeansR = (n) => [...Array(8).fill('MNnnj'), 'MMNnj', ...Array(n - 9).fill('MNnnj')];
const shoes = ['WVVVZ', 'VVVVZ', 'ZZZZZ'];
const legL = P([...jeansL(16), ...shoes]);
const legR = P([...jeansR(16), ...shoes]);
const legLUp = P([...jeansL(14), 'WVVVZ', 'VVVVZ', '.ZZZ.']);
const legRUp = P([...jeansR(14), 'WVVVZ', 'VVVVZ', '.ZZZ.']);

// ------------------------------------------------------------------ arms
// The phone arm (his left, on the right of the sprite): handset pressed to
// the hood at his ear, the coiled cord hanging down. Origin (35, 11).

const phoneArm = P([
  '.............',
  '..pP.........',
  '..pPQp.......',
  '..ppPp.......',
  '...ppsS......',
  '...pSSst.....',
  '..pSssstu....',
  '..ptssstu....',
  '.pp.ustu.....',
  '.ppp.sttu....',
  '.pPp.sttu....',
  '..c...sttu...',
  '.c....sttu...',
  '..c....sttu..',
  '.c.....sttu..',
  '..c.....sttu.',
  '.c......sttu.',
  '..c......stu.',
  '.c.....YYsttu',
  '..c...YYyystu',
  '......Yyyxxtu',
  '.......yyxxXu',
  '........xxXX.',
]);

// The free arm (his right, on the left of the sprite), drawn behind the
// pumpkin so the sleeve comes out of the armhole. Origin (14, 28).
const armDown = (swing = 0) =>
  P([
    '....YYy',
    '...YYyy',
    '..YYyyx',
    '..Yyyxx',
    '.Yyyxx.',
    '.yyxxX.',
    '.xxXX..',
    ...Array(9 + swing).fill('.Sstu..'),
    '.SsstU.',
    '.sstuU.',
    '..tuU..',
  ]);

// Talking with his hand: elbow in, forearm out, palm up. Origin (8, 28).
const armTalk = P([
  '..........YYy',
  '.........YYyy',
  '........YYyyx',
  '........Yyyxx',
  '.......Yyyxx.',
  '.S.....yyxxX.',
  '.Ss.s..xxXX..',
  '.SsSs..Sst...',
  '..SsSSSsstu..',
  '..tssssstu...',
  '...uuuuuu....',
]);

// "Hold on": hand raised, palm out, fingers spread. (A single raised
// finger reads as the middle finger at this size.) Origin (9, 19).
const armFinger = P([
  '..S.S.......',
  '.SsSsS......',
  '.SsSsS......',
  'SSsssst.....',
  '.Ssssst.....',
  '..sstt......',
  '...Sst......',
  '...Sstu.....',
  '....Sst.....',
  '....Sst..YYy',
  '....SstYYYyy',
  '.....SYYyyyx',
  '.....tYyyyxx',
  '......yyyxxX',
  '......xxxXX.',
]);

// ------------------------------------------------------------------ frames

function frame({ arm, armX, armY, head: h = head, bob = 0, lift = 0 }, seed) {
  const f = compose(64, 64, [
    [lift === 1 ? legLUp : legL, 27, 44],
    [lift === 2 ? legRUp : legR, 33, 44],
    [arm, armX, armY + bob],
    [pumpkin, 19, 26 + bob],
    [collar, 18, 24 + bob],
    [h, 24, 4 + bob],
    [phoneArm, 35, 11 + bob],
  ]);
  // Faces stay crisp: skin, lips, glasses and the phone never get blended.
  return paint(f, { blend: ['orange', 'rust', 'toxic', 'steel', 'navy'], crisp: ['gray', 'skin', 'flesh'], grain: 0.07, seed });
}

export function gusSheet() {
  return sheet([
    frame({ arm: armDown(), armX: 14, armY: 28 }, 1), // on the phone
    frame({ arm: armTalk, armX: 8, armY: 28, head: headTalk }, 2), // talking with his free hand
    frame({ arm: armDown(1), armX: 14, armY: 28, lift: 1, bob: -1 }, 3), // walk
    frame({ arm: armDown(), armX: 14, armY: 28 }, 4),
    frame({ arm: armDown(-1), armX: 14, armY: 28, lift: 2, bob: -1 }, 5),
    frame({ arm: armDown(), armX: 14, armY: 28 }, 6),
    frame({ arm: armFinger, armX: 9, armY: 19, head: headTalk }, 7), // hold on
  ]);
}
