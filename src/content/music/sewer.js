import { defineSong } from '../../engine/defs.js';
import { pluck, sub, pad, bell, tom, hat } from './instruments.js';

// Creepy 5/4 ostinato for the sewers (10 eighth-notes per bar).
export default defineSong({
  id: 'sewer',
  bpm: 92,
  stepsPerBeat: 2,
  echo: { time: 0.49, feedback: 0.45 },
  instruments: { pluck, sub, pad, bell, tom: { ...tom, volume: 0.25 }, hat: { ...hat, volume: 0.06 } },
  patterns: {
    a: {
      pluck: 'D4 A3 F4 A3 D4 A3 E4 A3 C4 A3',
      sub: 'D1 . . . . D1 . . . -',
      hat: 'x . x . x . x . x .',
    },
    b: {
      pluck: 'D4 A3 F4 A3 D4 A3 E4 A3 C4 A3',
      sub: 'D1 . . . . D1 . . . -',
      pad: 'D2+A2+F3 . . . . . . . . .',
      tom: 'x . . . . x . . . .',
      hat: 'x . x . x . x . x .',
    },
    c: {
      pluck: 'Bb3 F3 D4 F3 Bb3 F3 C4 F3 A3 F3',
      sub: 'Bb0 . . . . Bb0 . . . -',
      pad: 'Bb1+F2+D3 . . . . . . . . .',
      bell: '. . . . . . . . A5 .',
      tom: 'x . . . . x . . . .',
      hat: 'x . x . x . x . x .',
    },
  },
  sequence: ['a', 'a', 'b', 'b', 'c', 'c', 'b', 'b'],
  volume: 0.9,
});
