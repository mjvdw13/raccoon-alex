import { defineSong } from '../../engine/defs.js';
import { arp, pad, bell, sub } from './instruments.js';

// Slow, ominous A minor drone with a cold arpeggio.
export default defineSong({
  id: 'title',
  bpm: 84,
  stepsPerBeat: 4,
  echo: { time: 0.53, feedback: 0.42 },
  instruments: { bass: { ...sub, volume: 0.24 }, arp, pad, bell },
  patterns: {
    a: {
      pad: 'A2+C3+E3 . . . . . . . . . . . . . . .',
      arp: 'A3 C4 E4 A4 E4 C4 A3 C4 E4 A4 E4 C4 A3 C4 E4 C4',
      bass: 'A1 . . . . . . . A1 . . . . . . -',
      bell: '. . . . . . . . . . . . E5 . . .',
    },
    b: {
      pad: 'F2+A2+C3 . . . . . . . . . . . . . . .',
      arp: 'F3 A3 C4 F4 C4 A3 F3 A3 C4 F4 C4 A3 F3 A3 C4 A3',
      bass: 'F1 . . . . . . . F1 . . . . . . -',
      bell: '. . . . C5 . . . . . . . . . . .',
    },
    c: {
      pad: 'G2+B2+D3 . . . . . . . E2+G#2+B2 . . . . . . .',
      arp: 'G3 B3 D4 G4 D4 B3 G3 B3 E3 G#3 B3 E4 B3 G#3 E3 G#3',
      bass: 'G1 . . . . . . . E1 . . . . . . -',
      bell: 'D5 . . . . . . . B4 . . . . . . .',
    },
  },
  sequence: ['a', 'a', 'b', 'c', 'a', 'a', 'b', 'c'],
  volume: 0.9,
});

