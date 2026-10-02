import { defineSong } from '../../engine/defs.js';
import { bass, arp, pad, kick, snare, hat, bell } from './instruments.js';

// A cool-down groove for the stats screen.
export default defineSong({
  id: 'intermission',
  bpm: 108,
  echo: { time: 0.42, feedback: 0.35 },
  instruments: { bass, arp, pad, kick, snare: { ...snare, volume: 0.2 }, hat, bell },
  patterns: {
    a: {
      bass: 'A1 . . A1 . . C2 . D2 . . D2 . E2 . G2',
      arp: 'A3 E4 C4 E4 A3 E4 C4 E4 D4 A4 F4 A4 D4 A4 F4 A4',
      pad: 'A2+C3+E3 . . . . . . . D3+F3+A3 . . . . . . .',
      kick: 'x . . . . . x . x . . . . . . .',
      snare: '. . . . x . . . . . . . x . . .',
      hat: '. . x . . . x . . . x . . . x .',
    },
    b: {
      bass: 'F1 . . F1 . . A1 . G1 . . G1 . B1 . D2',
      arp: 'F3 C4 A3 C4 F3 C4 A3 C4 G3 D4 B3 D4 G3 D4 B3 D4',
      pad: 'F2+A2+C3 . . . . . . . G2+B2+D3 . . . . . . .',
      bell: 'C5 . . . . . . . B4 . . . . . . .',
      kick: 'x . . . . . x . x . . . . . . .',
      snare: '. . . . x . . . . . . . x . . .',
      hat: '. . x . . . x . . . x . . . x .',
    },
  },
  sequence: ['a', 'a', 'b', 'b'],
  volume: 0.85,
});
