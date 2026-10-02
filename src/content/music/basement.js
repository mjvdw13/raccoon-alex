import { defineSong } from '../../engine/defs.js';
import { bass, sub, arp, kick, snare, hat, tom, pad } from './instruments.js';

// Heavy, half-time D minor grind for the boiler room and garage.
export default defineSong({
  id: 'basement',
  bpm: 100,
  echo: { time: 0.45, feedback: 0.38 },
  instruments: { bass: { ...bass, cutoff: 330 }, sub, arp: { ...arp, volume: 0.08 }, kick, snare, hat: { ...hat, volume: 0.07 }, tom, pad },
  patterns: {
    a: {
      bass: 'D1 . . D1 . . D2 . F1 . . F1 . E1 . .',
      sub: 'D1 . . . . . . . . . . . . . . .',
      kick: 'x . . x . . . . x . . . . . . .',
      snare: '. . . . . . . . x . . . . . . .',
      hat: 'x . x . x . x . x . x . x . x x',
    },
    b: {
      bass: 'Bb0 . . Bb0 . . Bb1 . A0 . . A0 . C1 . C#1',
      sub: 'Bb0 . . . . . . . A0 . . . . . . .',
      kick: 'x . . x . . . . x . . . . . x .',
      snare: '. . . . . . . . x . . . . . . .',
      hat: 'x . x . x . x . x . x . x x x x',
      tom: '. . . . . . . . . . . . . x . x',
    },
    c: {
      bass: 'D1 . . D1 . . D2 . F1 . . F1 . E1 . .',
      arp: 'D4 F4 A4 D5 A4 F4 D4 F4 C#4 E4 A4 C#5 A4 E4 C#4 E4',
      pad: 'D3+F3+A3 . . . . . . . C#3+E3+A3 . . . . . . .',
      kick: 'x . . x . . . . x . . . . . . .',
      snare: '. . . . . . . . x . . . . . . .',
      hat: 'x . x . x . x . x . x . x . x x',
    },
  },
  sequence: ['a', 'a', 'b', 'a', 'c', 'c', 'b', 'c'],
  volume: 0.9,
});
