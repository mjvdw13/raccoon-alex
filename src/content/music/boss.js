import { defineSong } from '../../engine/defs.js';
import { bass, lead, stab, kick, snare, hat, openhat, tom, sub } from './instruments.js';

// Frantic C minor for the Alarm King.
export default defineSong({
  id: 'boss',
  bpm: 146,
  echo: { time: 0.31, feedback: 0.28 },
  instruments: { bass, lead, stab, kick, snare, hat, openhat, tom, sub },
  patterns: {
    a: {
      bass: 'C1 C2 C1 C2 C1 C2 Eb1 Eb2 F1 F2 F1 F2 G1 G2 Bb1 B1',
      kick: 'x . . x x . . . x . . x x . . .',
      snare: '. . . . x . . . . . . . x . . .',
      hat: 'x x x x x x x x x x x x x x x x',
      stab: 'C3+G3 - . . . . Eb3+Bb3 - . . . . . . . .',
    },
    b: {
      bass: 'Ab0 Ab1 Ab0 Ab1 Ab0 Ab1 G0 G1 Ab0 Ab1 Ab0 Ab1 Bb0 Bb1 B0 B1',
      kick: 'x . . x x . . . x . . x x . x x',
      snare: '. . . . x . . . . . . . x . x x',
      hat: 'x x x x x x x x x x x x x x x x',
      tom: '. . . . . . . . . . . . x x x x',
      stab: 'Ab2+Eb3 - . . . . G2+D3 - . . . . . . . .',
    },
    c: {
      bass: 'C1 C2 C1 C2 C1 C2 Eb1 Eb2 F1 F2 F1 F2 G1 G2 Bb1 B1',
      lead: 'C5 . Bb4 . G4 . Eb4 . F4 . G4 . Bb4 . B4 .',
      kick: 'x . . x x . . . x . . x x . . .',
      snare: '. . . . x . . . . . . . x . . .',
      hat: 'x x x x x x x x x x x x x x x x',
      openhat: '. . x . . . x . . . x . . . x .',
    },
  },
  sequence: ['a', 'a', 'b', 'a', 'c', 'c', 'b', 'c'],
  volume: 0.85,
});
