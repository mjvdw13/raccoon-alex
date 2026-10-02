// Benny, hand-drawn: a kid in a Mike Wazowski costume (green hood with white
// lining and little horns, a round green body with Mike's eye and grin),
// carrying a jack-o'-lantern candy bucket. 64x64 frames, drawn 1:1.
//
// Frames: 0-2 idle (stand, bounce and wave, arm coming down), 3-6 walk,
// 7 react ("yay!", jumping with both arms up).
import { C } from '../../lib/pal.js';
import { part, compose } from '../../lib/pixels.js';
import { sheet } from '../../lib/sprite.js';

const INK = C('gray', 0.03);

const L = {
  // Mike green, shadow to highlight.
  1: C('toxic', 0.36),
  2: C('toxic', 0.56),
  3: C('toxic', 0.76),
  4: C('toxic', 0.94),
  j: C('toxic', 0.26), // costume feet
  J: C('toxic', 0.42),
  w: C('beige', 0.98), // hood lining, teeth, Mike's eye
  u: C('beige', 0.72),
  h: C('gray', 0.62), // horns
  H: C('gray', 0.86),
  s: C('skin', 0.8),
  S: C('skin', 0.92),
  z: C('skin', 0.64),
  f: C('flesh', 0.86), // rosy cheeks
  d: C('rust', 0.42), // hair
  D: C('rust', 0.58),
  e: C('gray', 0.05), // eyes
  i: C('steel', 0.6),
  r: C('blood', 0.22), // Mike's mouth
  m: C('flesh', 0.42), // Benny's mouth
  G: C('teal', 0.62), // Mike's iris
  k: C('gray', 0.05),
  W: C('gray', 0.95),
  o: C('orange', 0.62), // candy bucket
  O: C('orange', 0.82),
  q: C('orange', 0.4),
  x: C('orange', 0.06),
  c: C('gray', 0.18), // bucket handle
};
const P = (rows) => part(rows, L);

// ------------------------------------------------------------------ head
// 16 wide. A big kid head in the hood: bangs, blue eyes, rosy cheeks.

const headRows = (mouth, chin) => [
  '...H........H...',
  '...hH......Hh...',
  '....hh....hh....',
  '...2344443322...',
  '..234444433322..',
  '.2344wwwwww3221.',
  '.234wddddddw221.',
  '.23wdDdsDdddu21.',
  '.23wsSSsssszu21.',
  '.23wsiessiezu21.',
  '.23wseesseezu21.',
  '.23wsfsSzsfzu21.',
  mouth,
  chin,
  '.1222uwwwwu2221.',
  '..11222222211...',
];

const head = P(headRows('.23wsmssssmzu21.', '.123wzsmmszu221.'));
const headYay = P(headRows('.23wsmwwwwmzu21.', '.123wzsmmszu221.'));

// ------------------------------------------------------------------ body
// 18 wide. Mike's round body: one big eye and a toothy grin.

const body = P([
  '....2344333222....',
  '..23444333332221..',
  '.234443wwww333221.',
  '234443wwGGww332221',
  '234443wGWkGw332221',
  '234443wGkkGw332221',
  '234443wwGGww332221',
  '2344433uwwu3332221',
  '234443333333332221',
  '23rwwrwwrrwwrwwr21',
  '2344rrrrrrrrrr3221',
  '234443rrrrrr332221',
  '233333333333222221',
  '.2333333333322221.',
  '..12333332222221..',
  '....1122222211....',
]);

// ------------------------------------------------------------------ legs
// Short green costume legs and floppy green feet.

const legL = P([...Array(8).fill('.342'), '.Jjj', 'Jjjj']);
const legR = P([...Array(8).fill('342.'), 'Jjj.', 'jjjj']);
const legLUp = P([...Array(6).fill('.342'), '.Jjj', 'JJjj', '.jj.']);
const legRUp = P([...Array(6).fill('342.'), 'Jjj.', 'JJjj', '.jj.']);

// ------------------------------------------------------------------ arms
// Bucket arm (his right, on the left of the sprite), holding a plastic
// jack-o'-lantern by its handle. Origin (15, 41).

const bucketArm = P([
  '.......23',
  '......234',
  '......34.',
  '.....234.',
  '.....34..',
  '.....sS..',
  '...ccsSc.',
  '..c.....c',
  '..c.....c',
  '.qOOooooq',
  '.OOxooxoq',
  '.Ooxoxxoq',
  '.ooxxxxoq',
  '..qooooq.',
]);

// Swinging the bucket up for "yay!". Origin (13, 32).
const bucketArmUp = P([
  '....sS......',
  '..c.sS.c....',
  '..c....c....',
  '.qOOooooq...',
  '.OOxooxoq...',
  '.Ooxoxxoq...',
  '.ooxxxxoq...',
  '..qooooq....',
  '.......34...',
  '........3423',
  '.........234',
  '..........34',
]);

// Free arm (his left, on the right of the sprite). Origin (38, 41).
const armDown = (swing = 0) =>
  P([
    '21....',
    '221...',
    '.221..',
    '.321..',
    ...Array(1 + swing).fill('..21..'),
    '..sz..',
    '..zz..',
  ]);

// Waving: hand up by his head. Origin (37, 29).
const armWave = P([
  '...s.s.s',
  '...sSsSs',
  '...ssssz',
  '....ssz.',
  '....321.',
  '...321..',
  '...321..',
  '..321...',
  '.321....',
  '321.....',
  '21......',
  '1.......',
]);

// Halfway, coming down from the wave. Origin (38, 35).
const armMid = P([
  '....sSs',
  '....ssz',
  '...321.',
  '..321..',
  '.321...',
  '321....',
  '21.....',
]);

// ------------------------------------------------------------------ frames

function frame({ arm, armX, armY, bucket = bucketArm, bucketX = 15, bucketY = 41, head: h = head, bob = 0, lift = 0, jump = 0 }) {
  const y = (v) => v + bob - jump;
  const f = compose(64, 64, [
    [lift === 1 ? legLUp : legL, 27, 52 - jump],
    [lift === 2 ? legRUp : legR, 33, 52 - jump],
    [body, 23, y(40)],
    [h, 24, y(26)],
    [arm, armX, y(armY)],
    [bucket, bucketX, y(bucketY)],
  ]);
  return f.outline(INK);
}

export function bennySheet() {
  const walk = (lift, swing) => frame({ arm: armDown(swing), armX: 38, armY: 41, lift, bob: lift ? -1 : 0 });
  return sheet([
    frame({ arm: armDown(), armX: 38, armY: 41 }), // standing
    frame({ arm: armWave, armX: 37, armY: 29, bob: -1 }), // bounce and wave
    frame({ arm: armMid, armX: 38, armY: 35 }),
    walk(1, 1),
    walk(0, 0),
    walk(2, 0),
    walk(0, 0),
    frame({ arm: armWave, armX: 37, armY: 29, bucket: bucketArmUp, bucketX: 13, bucketY: 32, head: headYay, jump: 4 }), // yay!
  ]);
}
