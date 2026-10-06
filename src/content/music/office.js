import { defineSong } from '../../engine/defs.js';
import { bass, lead, pad, kick, snare, hat, stab } from './instruments.js';

// Driving E minor bass ostinato for the cubicle farm.
export default defineSong({
  id: 'office',
  bpm: 124,
  echo: { time: 0.36, feedback: 0.3 },
  instruments: { bass, lead, pad, stab, kick, snare, hat },
  patterns: {
    a: {
      bass: 'E1 . E2 E1 . E1 G1 E1 E1 . E2 E1 D2 . B1 .',
      kick: 'x . . . . . . . x . x . . . . .',
      snare: '. . . . x . . . . . . . x . . o',
      hat: 'x o x o x o x o x o x o x o x o',
      pad: 'E2+G2+B2 . . . . . . . . . . . . . . .',
    },
    b: {
      bass: 'C2 . C3 C2 . C2 E2 C2 D2 . D3 D2 . A1 B1 .',
      kick: 'x . . . . . . . x . x . . . . .',
      snare: '. . . . x . . . . . . . x . x .',
      hat: 'x o x o x o x o x o x o x o x x',
      pad: 'C3+E3+G3 . . . . . . . D3+F#3+A3 . . . . . . .',
    },
    c: {
      bass: 'E1 . E2 E1 . E1 G1 E1 E1 . E2 E1 D2 . B1 .',
      lead: 'E4 . . . G4 . . . B4 . A4 . G4 . F#4 .',
      kick: 'x . . . . . . . x . x . . . . .',
      snare: '. . . . x . . . . . . . x . . o',
      hat: 'x o x o x o x o x o x o x o x o',
      stab: 'E3+B3 - . . . . . . . . . . . . . .',
    },
    d: {
      bass: 'C2 . C3 C2 . C2 E2 C2 B1 . B2 B1 . F#1 A1 B1',
      lead: 'G4 . . . E4 . . . F#4 . . . D#4 . . .',
      kick: 'x . . . . . . . x . x . . . x .',
      snare: '. . . . x . . . . . . . x . x x',
      hat: 'x o x o x o x o x o x o x x x x',
      stab: 'C3+G3 - . . . . . . B2+F#3 - . . . . . .',
    },
  },
  sequence: ['a', 'a', 'b', 'a', 'c', 'd', 'c', 'd'],
  volume: 0.85,
});
