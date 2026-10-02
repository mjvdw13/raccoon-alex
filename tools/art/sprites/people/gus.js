// Gus, hand-drawn: pumpkin hood and costume, glasses, stubble, and a desk
// phone pressed to his ear. 64x64 frames, drawn 1:1 in the game.
//
// Frames: 0-1 idle (on the phone, then talking with his free hand),
// 2-5 walk, 6 react ("one sec", finger up).
import { C } from '../../lib/pal.js';
import { part, compose } from '../../lib/pixels.js';
import { sheet } from '../../lib/sprite.js';

const INK = C('gray', 0.03);

const L = {
  // Pumpkin orange, shadow to highlight.
  1: C('orange', 0.22),
  2: C('orange', 0.42),
  3: C('orange', 0.6),
  4: C('orange', 0.78),
  x: C('orange', 0.04), // carved jack-o'-lantern holes
  v: C('toxic', 0.28), // stem and leafy collar
  V: C('toxic', 0.5),
  s: C('skin', 0.62),
  S: C('skin', 0.8),
  z: C('skin', 0.44),
  b: C('skin', 0.4), // stubble
  B: C('rust', 0.16), // moustache
  r: C('flesh', 0.25), // mouth
  e: C('gray', 0.04), // eyes
  '#': C('gray', 0.13), // glasses frames
  p: C('beige', 0.5), // beige desk phone
  P: C('beige', 0.8),
  c: C('beige', 0.35), // phone cord
  a: C('gray', 0.28), // grey t-shirt sleeves
  A: C('gray', 0.4),
  m: C('steel', 0.18), // jeans
  n: C('steel', 0.28),
  N: C('steel', 0.4),
  k: C('gray', 0.07), // shoes
  K: C('gray', 0.2),
};
const P = (rows) => part(rows, L);

// ------------------------------------------------------------------ head
// 16 wide. The hood frames his face; glasses, nose, moustache and stubble
// carry the likeness.

const headRows = (mouth) => [
  '.......vV.......',
  '......vV........',
  '....23443222....',
  '...2344433222...',
  '..234443332221..',
  '.23444333322211.',
  '.234zSSSsssz221.',
  '.23s########s21.',
  '.23s#eS##Se#z21.',
  '.23sz##ss##zz21.',
  '.23sSssSzsssz21.',
  '.23sbBBBBBBbz21.',
  mouth,
  '.122bbbbbbbB221.',
  '..122BbbbbB221..',
  '...1122222211...',
];

const head = P(headRows('.23bbbzzzzbbB21.'));
const headTalk = P(headRows('.23bbbrrrrbbB21.'));

// ------------------------------------------------------------------ body
// 22 wide. A round, ribbed pumpkin with a carved face and a leafy collar.

const pumpkin = P([
  '.....23vVVvvVVv21.....',
  '...23443vvVVvv33221...',
  '..234442333333122221..',
  '.23444423333331222221.',
  '2344442x333333x1222221',
  '234444xxx3333xxx222221',
  '23444xxxxx33xxxxx22221',
  '2344442333333331222221',
  '2344442333xx3331222221',
  '2344442333333331222221',
  '234x44233333333122x221',
  '234xxxx3xxxxxx3xxxx221',
  '2333xxxxxx33xxxxxx2221',
  '233332xxxxxxxxxx222221',
  '.23333323333331222221.',
  '..233332333333122221..',
  '...2233233333312221...',
  '.....122222222211.....',
]);

// ------------------------------------------------------------------ legs
// Jeans and sneakers. Lifted legs are drawn 2px shorter (the knee bends
// toward the camera), so the shoe comes off the floor.

const legRowsL = (n) => [...Array(n).fill('.Nnnm'), '.Nnmm', '.mmmm', '.Kkkk', 'Kkkkk'];
const legRowsR = (n) => [...Array(n).fill('Nnnm.'), 'Nnmm.', 'mmmm.', 'Kkkk.', 'kkkkk'];
const legL = P(legRowsL(15));
const legR = P(legRowsR(15));
const legLUp = P([...Array(10).fill('.Nnnm'), '.NNnm', '.Nnnm', '.Nnmm', '.mmmm', 'KKkkk', '.kkk.']);
const legRUp = P([...Array(10).fill('Nnnm.'), 'NNnm.', 'Nnnm.', 'Nnmm.', 'mmmm.', 'KKkkk', '.kkk.']);

// ------------------------------------------------------------------ arms
// The phone arm (his left, on the right of the sprite): hand at his ear
// holding a desk-phone handset, coiled cord hanging down. Origin (34, 21).

const phoneArm = P([
  '...kPPk......',
  '...kPpp......',
  '...kppp......',
  '...kpSSs.....',
  '..kpSsssz....',
  '..kpzsssz....',
  '.kPp.zssz....',
  '.kppp.Ssz....',
  '..kc..Ssz.aA.',
  '...c..SszaAaa',
  '.......SsaAaa',
  '.......SszAaa',
  '........Sszaa',
  '........Sssz.',
  '.........zz..',
]);

// The free arm (his right, on the left of the sprite). Drawn behind the
// pumpkin, so pixels that overlap the costume are hidden.

// Hanging at his side. Origin (16, 30). `swing` nudges the hand forward/back.
const armDown = (swing = 0) =>
  P([
    '....aAa',
    '...aAaa',
    '..aAaaa',
    '..aAaa.',
    '..aaaa.',
    ...Array(6 + swing).fill('..Ssz..'),
    '.SsSz..',
    '.sssz..',
    '..sz...',
  ]);

// Talking with his hand: elbow in, forearm out, palm open. Origin (10, 30).
const armTalk = P([
  '..........aAa',
  '.........aAaa',
  '........aAaaa',
  '........aAaa.',
  '.s......aaaa.',
  '.Ss.s...Ssz..',
  '.SsSs...Ssz..',
  '..SsSSSSSsz..',
  '..zssssssz...',
  '...zzzzzz....',
]);

// "One sec": hand raised, index finger up. Origin (11, 23).
const armFinger = P([
  '....S.......',
  '....s.......',
  '...SSs......',
  '...Sssz.....',
  '...sssz.....',
  '....Ssz.....',
  '....Ssz.....',
  '....Ssz..aAa',
  '....Ssz.aAaa',
  '....SszaAaaa',
  '.....SsAaaa.',
  '.....zsaaa..',
  '......zz....',
]);

// ------------------------------------------------------------------ frames

function frame({ arm, armX, armY, head: h = head, bob = 0, lift = 0 }) {
  const f = compose(64, 64, [
    [lift === 1 ? legLUp : legL, 26, 44],
    [lift === 2 ? legRUp : legR, 33, 44],
    [arm, armX, armY + bob],
    [pumpkin, 21, 29 + bob],
    [h, 24, 14 + bob],
    [phoneArm, 34, 21 + bob],
  ]);
  return f.outline(INK);
}

export function gusSheet() {
  return sheet([
    frame({ arm: armDown(), armX: 16, armY: 30 }), // on the phone
    frame({ arm: armTalk, armX: 10, armY: 30, head: headTalk }), // talking with his free hand
    frame({ arm: armDown(1), armX: 16, armY: 30, lift: 1, bob: -1 }), // walk
    frame({ arm: armDown(), armX: 16, armY: 30 }),
    frame({ arm: armDown(-1), armX: 16, armY: 30, lift: 2, bob: -1 }),
    frame({ arm: armDown(), armX: 16, armY: 30 }),
    frame({ arm: armFinger, armX: 11, armY: 23, head: headTalk }), // one sec
  ]);
}
