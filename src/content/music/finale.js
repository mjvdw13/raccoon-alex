import { defineSong } from '../../engine/defs.js';
import { pad, bell, pluck, sub } from './instruments.js';

// Peaceful at last... (C major, slow).
export default defineSong({
  id: 'finale',
  bpm: 76,
  echo: { time: 0.59, feedback: 0.45 },
  instruments: { pad: { ...pad, volume: 0.07 }, bell, pluck, sub },
  patterns: {
    a: {
      pad: 'C3+E3+G3 . . . . . . . . . . . . . . .',
      pluck: 'C4 G4 E4 G4 C5 G4 E4 G4 C4 G4 E4 G4 C5 G4 E4 G4',
      sub: 'C1 . . . . . . . . . . . . . . -',
    },
    b: {
      pad: 'A2+C3+E3 . . . . . . . F2+A2+C3 . . . . . . .',
      pluck: 'A3 E4 C4 E4 A4 E4 C4 E4 F3 C4 A3 C4 F4 C4 A3 C4',
      bell: 'E5 . . . . . . . C5 . . . . . . .',
      sub: 'A0 . . . . . . . F0 . . . . . . -',
    },
    c: {
      pad: 'G2+B2+D3 . . . . . . . . . . . . . . .',
      pluck: 'G3 D4 B3 D4 G4 D4 B3 D4 G3 D4 B3 D4 G4 D4 B3 D4',
      bell: 'D5 . . . . . . . . . . . G5 . . .',
      sub: 'G0 . . . . . . . . . . . . . . -',
    },
  },
  sequence: ['a', 'b', 'c', 'a'],
  volume: 0.9,
});
