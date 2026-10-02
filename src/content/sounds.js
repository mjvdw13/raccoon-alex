import { defineSound } from '../engine/defs.js';

// Every sound effect, synthesized from parameters (see src/engine/audio/synth.js).
// To use a recorded sound instead: defineSound({ id: 'staple-fire', src: 'assets/sounds/staple.wav' }).

const crunch = { bits: 7 };

// Reusable building blocks.
const thump = (freq = 120, end = 45, duration = 0.18, volume = 0.8) => ({ wave: 'sine', freq, freqEnd: end, duration, attack: 0.002, release: duration * 0.9, volume });
const burst = (duration = 0.2, lowpass = [6000, 800], volume = 0.8, noiseHold = 1) => ({ wave: 'noise', duration, attack: 0.001, release: duration * 0.95, lowpass, volume, noiseHold });
const click = (freq = 1400, volume = 0.4) => ({ wave: 'square', freq, freqEnd: freq * 0.7, duration: 0.025, attack: 0.001, release: 0.02, volume });
const groan = (freq, end, duration, volume = 0.7, extra = {}) => ({
  wave: 'saw', freq, freqEnd: end, duration, attack: 0.04, release: duration * 0.4, lowpass: 900,
  vibrato: { rate: 5, depth: 0.6 }, volume, distortion: 0.3,
  layers: [{ wave: 'noise', duration, attack: 0.05, release: duration * 0.5, lowpass: 700, volume: 0.25 }],
  ...extra,
});
const screech = (freq, end, duration, volume = 0.6) => ({
  wave: 'saw', freq, freqEnd: end, duration, attack: 0.01, release: duration * 0.5, distortion: 0.6,
  vibrato: { rate: 11, depth: 0.8 }, volume, highpass: 300,
  layers: [{ wave: 'noise', duration, release: duration * 0.6, highpass: 2000, volume: 0.25 }],
});
const ring = (freq, count, interval, volume = 0.45) => ({
  wave: 'square', freq, duration: 0.03, attack: 0.001, release: 0.025, volume, highpass: 600,
  repeat: { count, interval, decay: 0.985 },
  layers: [{ wave: 'square', freq: freq * 1.19, duration: 0.03, release: 0.025, volume: volume * 0.7, repeat: { count, interval, decay: 0.985 }, delay: interval / 2 }],
});
const squeak = (freq, duration = 0.07, volume = 0.35) => ({ wave: 'sine', freq, freqEnd: freq * 1.3, duration, attack: 0.005, release: duration * 0.6, volume, vibrato: { rate: 30, depth: 1 } });

export default [
  // --------------------------------------------------------- weapons
  defineSound({
    id: 'staple-fire',
    synth: { ...burst(0.2, [7000, 700], 0.85, 2), layers: [thump(190, 60, 0.12, 0.6), click(2200, 0.3)], ...crunch },
    pitchVariance: 0.06,
  }),
  defineSound({
    id: 'tack-fire',
    synth: { ...burst(0.5, [5000, 300], 1, 3), distortion: 0.5, layers: [thump(110, 35, 0.35, 1), click(1600, 0.35)], ...crunch },
    pitchVariance: 0.04,
  }),
  defineSound({
    id: 'tack-pump',
    synth: { ...click(700, 0.5), highpass: 300, layers: [{ ...burst(0.05, [3000, 1500], 0.4), delay: 0 }, { ...click(500, 0.5), delay: 0.16 }, { ...burst(0.05, [2500, 1200], 0.4), delay: 0.16 }] },
  }),
  defineSound({
    id: 'typewriter-fire',
    synth: { ...burst(0.12, [8000, 1500], 0.75, 2), layers: [click(2600, 0.45), thump(160, 70, 0.08, 0.5), { ...click(3200, 0.2), delay: 0.03 }], ...crunch },
    pitchVariance: 0.08,
  }),
  defineSound({
    id: 'toner-fire',
    synth: { wave: 'noise', duration: 0.5, attack: 0.01, release: 0.4, lowpass: [400, 3500], volume: 0.8, noiseHold: 2, layers: [thump(90, 50, 0.25, 0.6)] },
  }),
  defineSound({
    id: 'explode',
    synth: {
      wave: 'noise', duration: 1.1, attack: 0.002, decay: 0.2, sustain: 0.45, release: 0.8, lowpass: [2400, 150], noiseHold: 4,
      distortion: 0.5, volume: 1, layers: [thump(70, 28, 0.7, 1)], ...crunch,
    },
    pitchVariance: 0.08,
  }),
  defineSound({
    id: 'bfc-charge',
    synth: {
      wave: 'saw', freq: 90, freqEnd: 700, duration: 0.6, attack: 0.05, release: 0.1, lowpass: [400, 3000], vibrato: { rate: 14, depth: 1 }, volume: 0.6,
      layers: [{ wave: 'noise', duration: 0.6, noiseHold: 40, lowpass: 900, volume: 0.35, release: 0.2 }],
    },
  }),
  defineSound({
    id: 'bfc-fire',
    synth: { wave: 'noise', duration: 0.7, attack: 0.01, release: 0.5, lowpass: [3000, 400], noiseHold: 3, volume: 0.9, distortion: 0.4, layers: [thump(60, 30, 0.5, 1), { wave: 'sine', freq: 300, freqEnd: 80, duration: 0.6, vibrato: { rate: 20, depth: 2 }, volume: 0.4 }] },
  }),
  defineSound({
    id: 'bfc-explode',
    synth: {
      wave: 'noise', duration: 1.6, attack: 0.002, decay: 0.3, sustain: 0.5, release: 1.2, lowpass: [3000, 100], noiseHold: 5, distortion: 0.6, volume: 1,
      layers: [thump(55, 22, 1.2, 1), { wave: 'noise', duration: 1.4, delay: 0.2, highpass: 3000, volume: 0.2, release: 1 }],
      ...crunch,
    },
  }),
  defineSound({ id: 'paw-swipe', synth: { wave: 'noise', duration: 0.16, attack: 0.03, release: 0.1, highpass: 1200, lowpass: [5000, 1500], volume: 0.5 }, pitchVariance: 0.1 }),
  defineSound({ id: 'paw-hit', synth: { ...thump(140, 50, 0.14, 0.9), layers: [burst(0.06, [3000, 600], 0.6)] }, pitchVariance: 0.1 }),

  // --------------------------------------------------------- world
  defineSound({
    id: 'door-open',
    synth: { wave: 'saw', freq: 55, freqEnd: 85, duration: 0.75, attack: 0.05, release: 0.2, lowpass: 700, volume: 0.45, vibrato: { rate: 30, depth: 0.5 }, layers: [{ wave: 'noise', duration: 0.75, lowpass: 1400, volume: 0.25, release: 0.2 }] },
  }),
  defineSound({
    id: 'door-close',
    synth: { wave: 'saw', freq: 85, freqEnd: 55, duration: 0.6, attack: 0.05, release: 0.1, lowpass: 700, volume: 0.45, vibrato: { rate: 30, depth: 0.5 }, layers: [{ ...thump(90, 40, 0.2, 0.9), delay: 0.55 }, { ...burst(0.1, [2000, 400], 0.5), delay: 0.55 }] },
  }),
  defineSound({ id: 'switch', synth: { ...click(1200, 0.6), layers: [burst(0.04, [4000, 2000], 0.4), { ...click(800, 0.5), delay: 0.09 }] } }),
  defineSound({
    id: 'secret',
    synth: { wave: 'triangle', freq: 523, duration: 0.14, attack: 0.005, release: 0.1, volume: 0.5, repeat: { count: 4, interval: 0.09, pitch: 1.26 }, echo: { time: 0.12, feedback: 0.4, mix: 0.5 } },
  }),
  defineSound({ id: 'oof', synth: groan(150, 95, 0.22, 0.6) }),
  defineSound({
    id: 'teleport',
    synth: { wave: 'sine', freq: 200, freqEnd: 1600, duration: 0.7, attack: 0.02, release: 0.3, vibrato: { rate: 18, depth: 2 }, volume: 0.5, layers: [{ wave: 'noise', duration: 0.7, highpass: 3000, volume: 0.2, release: 0.5 }] },
  }),

  // --------------------------------------------------------- items
  defineSound({ id: 'item', synth: { wave: 'square', freq: 880, freqEnd: 1320, duration: 0.09, attack: 0.002, release: 0.05, volume: 0.35, duty: 0.25 } }),
  defineSound({ id: 'item-food', synth: { ...burst(0.06, [1800, 600], 0.6, 6), repeat: { count: 3, interval: 0.08, decay: 0.8 } } }),
  defineSound({ id: 'item-slurp', synth: { wave: 'sine', freq: 250, freqEnd: 900, duration: 0.35, attack: 0.02, release: 0.1, vibrato: { rate: 16, depth: 1.5 }, volume: 0.45, layers: [{ wave: 'noise', duration: 0.35, lowpass: 1200, volume: 0.15 }] } }),
  defineSound({ id: 'item-ammo', synth: { ...click(1800, 0.45), layers: [{ ...click(2600, 0.35), delay: 0.05 }, { ...burst(0.05, [6000, 3000], 0.3), delay: 0.02 }] } }),
  defineSound({
    id: 'weapon-pickup',
    synth: { wave: 'saw', freq: 110, duration: 0.45, attack: 0.01, release: 0.3, lowpass: 2500, volume: 0.45, layers: [{ wave: 'saw', freq: 165, duration: 0.45, release: 0.3, lowpass: 2500, volume: 0.4 }, { wave: 'square', freq: 440, duration: 0.07, volume: 0.25, duty: 0.25, repeat: { count: 4, interval: 0.06, pitch: 1.19 }, delay: 0.05 }], ...crunch },
  }),
  defineSound({ id: 'key-pickup', synth: { wave: 'triangle', freq: 1046, duration: 0.3, release: 0.25, volume: 0.45, layers: [{ wave: 'triangle', freq: 1568, duration: 0.35, delay: 0.08, release: 0.3, volume: 0.4 }] } }),
  defineSound({
    id: 'powerup',
    synth: { wave: 'square', duty: 0.25, freq: 392, duration: 0.09, release: 0.06, volume: 0.35, repeat: { count: 6, interval: 0.07, pitch: 1.122 }, echo: { time: 0.1, feedback: 0.45, mix: 0.6 } },
  }),

  // --------------------------------------------------------- player
  defineSound({ id: 'player-pain', synth: groan(240, 130, 0.25, 0.7) }),
  defineSound({ id: 'player-pain-low', synth: groan(200, 110, 0.3, 0.7, { vibrato: { rate: 9, depth: 1.5 } }) }),
  defineSound({
    id: 'player-death',
    synth: {
      ...groan(230, 60, 1.1, 0.8),
      // ...and then, finally, a snore.
      layers: [
        { wave: 'noise', duration: 1.1, release: 0.5, lowpass: 700, volume: 0.25 },
        { wave: 'noise', duration: 0.7, delay: 1.3, attack: 0.3, release: 0.3, lowpass: 260, noiseHold: 12, volume: 0.5 },
        { wave: 'noise', duration: 0.7, delay: 2.3, attack: 0.3, release: 0.3, lowpass: 260, noiseHold: 12, volume: 0.45 },
      ],
    },
  }),

  // --------------------------------------------------------- menus / screens
  defineSound({ id: 'menu-open', synth: { wave: 'square', freq: 440, freqEnd: 660, duration: 0.06, volume: 0.3, duty: 0.25 } }),
  defineSound({ id: 'menu-move', synth: { wave: 'square', freq: 600, duration: 0.03, volume: 0.25, duty: 0.25 } }),
  defineSound({ id: 'menu-select', synth: { ...burst(0.12, [6000, 900], 0.6, 2), layers: [thump(180, 70, 0.1, 0.5)], ...crunch } }),
  defineSound({ id: 'menu-back', synth: { wave: 'square', freq: 500, freqEnd: 300, duration: 0.07, volume: 0.3, duty: 0.25 } }),
  defineSound({ id: 'tally', synth: { wave: 'square', freq: 1100, duration: 0.02, volume: 0.25 } }),
  defineSound({ id: 'tally-done', synth: { ...burst(0.25, [5000, 500], 0.8, 2), layers: [thump(110, 45, 0.2, 0.8)], ...crunch } }),
  defineSound({
    id: 'quit',
    synth: { wave: 'saw', freq: 300, duration: 0.32, attack: 0.02, release: 0.1, lowpass: 1200, volume: 0.5, vibrato: { rate: 6, depth: 0.4 }, repeat: { count: 4, interval: 0.36, pitch: 0.94 } },
  }),

  // --------------------------------------------------------- monsters
  defineSound({ id: 'intern-sight', synth: groan(110, 95, 0.8, 0.7) }),
  defineSound({ id: 'intern-active', synth: groan(95, 85, 0.6, 0.45) }),
  defineSound({ id: 'intern-pain', synth: groan(200, 120, 0.18, 0.6) }),
  defineSound({ id: 'intern-death', synth: groan(260, 60, 0.8, 0.7) }),

  defineSound({ id: 'imp-sight', synth: screech(900, 480, 0.55) }),
  defineSound({ id: 'imp-active', synth: { wave: 'noise', duration: 0.45, attack: 0.1, release: 0.3, highpass: 2200, volume: 0.35 } }),
  defineSound({ id: 'imp-pain', synth: screech(700, 420, 0.16) }),
  defineSound({ id: 'imp-death', synth: screech(850, 140, 0.9) }),
  defineSound({ id: 'claw', synth: { wave: 'noise', duration: 0.18, attack: 0.02, release: 0.12, highpass: 1500, volume: 0.5, layers: [thump(160, 60, 0.1, 0.5)] } }),

  defineSound({ id: 'clock-sight', synth: ring(1750, 22, 0.035, 0.42) }),
  defineSound({
    id: 'clock-active',
    synth: { ...click(2400, 0.35), layers: [{ ...click(1700, 0.35), delay: 0.25 }, { ...click(2400, 0.3), delay: 0.5 }, { ...click(1700, 0.3), delay: 0.75 }] },
  }),
  defineSound({ id: 'clock-pain', synth: ring(1650, 6, 0.035, 0.4) }),
  defineSound({
    id: 'clock-death',
    synth: {
      wave: 'sine', freq: 180, freqEnd: 1400, duration: 0.5, attack: 0.005, release: 0.2, vibrato: { rate: 22, depth: 3 }, volume: 0.5,
      layers: [{ ...ring(1500, 10, 0.05, 0.3), delay: 0.2 }, { ...burst(0.6, [4000, 500], 0.5, 2), delay: 0.1 }],
    },
  }),
  defineSound({ id: 'clock-bite', synth: { ...burst(0.12, [5000, 800], 0.7, 2), layers: [{ wave: 'square', freq: 320, freqEnd: 120, duration: 0.12, volume: 0.5 }, { ...click(2600, 0.4), delay: 0.08 }] } }),

  defineSound({ id: 'manager-sight', synth: groan(62, 55, 1.1, 0.8, { lowpass: 450, distortion: 0.7, unison: true }) }),
  defineSound({ id: 'manager-active', synth: groan(80, 70, 0.5, 0.5, { lowpass: 400 }) }),
  defineSound({ id: 'manager-pain', synth: groan(110, 70, 0.3, 0.7, { lowpass: 500 }) }),
  defineSound({ id: 'manager-death', synth: groan(85, 28, 1.6, 0.9, { lowpass: 500, distortion: 0.8 }) }),
  defineSound({ id: 'briefcase', synth: { ...thump(100, 40, 0.25, 1), layers: [burst(0.15, [3000, 400], 0.7, 3)] } }),

  defineSound({ id: 'rat-sight', synth: { ...squeak(2100), repeat: { count: 3, interval: 0.09, pitch: 1.05 } } }),
  defineSound({ id: 'rat-active', synth: { ...squeak(2400, 0.05, 0.25), repeat: { count: 2, interval: 0.08 } } }),
  defineSound({ id: 'rat-pain', synth: squeak(2600, 0.12, 0.4) }),
  defineSound({ id: 'rat-death', synth: { wave: 'sine', freq: 2800, freqEnd: 900, duration: 0.35, release: 0.2, vibrato: { rate: 30, depth: 1.5 }, volume: 0.4 } }),
  defineSound({ id: 'rat-bite', synth: { ...burst(0.05, [6000, 2000], 0.4), layers: [click(3000, 0.3)] } }),

  defineSound({
    id: 'golem-sight',
    synth: { wave: 'saw', freq: 48, freqEnd: 40, duration: 1.1, attack: 0.1, release: 0.5, lowpass: 380, distortion: 0.9, volume: 0.8, layers: [{ wave: 'noise', duration: 1.1, lowpass: 600, noiseHold: 6, volume: 0.5, release: 0.6 }] },
  }),
  defineSound({ id: 'golem-active', synth: { wave: 'noise', duration: 0.08, highpass: 900, lowpass: 3000, volume: 0.35, noiseHold: 3, repeat: { count: 5, interval: 0.09, decay: 0.85 } } }),
  defineSound({ id: 'golem-pain', synth: { ...burst(0.3, [2500, 300], 0.8, 5), layers: [thump(90, 40, 0.2, 0.6)] } }),
  defineSound({
    id: 'golem-death',
    synth: { wave: 'noise', duration: 1.4, attack: 0.01, release: 1, lowpass: [2000, 200], noiseHold: 6, volume: 0.9, layers: [{ ...click(1300, 0.4), repeat: { count: 6, interval: 0.17, pitch: 0.9, decay: 0.85 }, delay: 0.3 }] },
  }),
  defineSound({ id: 'golem-punch', synth: { ...thump(80, 35, 0.3, 1), layers: [burst(0.2, [2000, 300], 0.7, 4)] } }),
  defineSound({ id: 'trash-throw', synth: { wave: 'noise', duration: 0.3, attack: 0.05, release: 0.2, lowpass: [600, 2000], volume: 0.5 } }),
  defineSound({ id: 'trash-splat', synth: { ...burst(0.35, [1500, 200], 0.9, 3), layers: [thump(100, 40, 0.2, 0.8)] } }),

  defineSound({ id: 'fireball-launch', synth: { wave: 'noise', duration: 0.4, attack: 0.02, release: 0.3, lowpass: [700, 3200], volume: 0.6, layers: [{ wave: 'noise', duration: 0.4, noiseHold: 25, volume: 0.2, lowpass: 2000 }] } }),
  defineSound({ id: 'fireball-hit', synth: { ...burst(0.45, [3500, 300], 0.8, 3), distortion: 0.3, layers: [{ wave: 'noise', duration: 0.4, noiseHold: 30, volume: 0.25 }] } }),
  defineSound({ id: 'pip-launch', synth: { wave: 'sine', freq: 300, freqEnd: 1100, duration: 0.4, attack: 0.01, release: 0.25, vibrato: { rate: 25, depth: 2 }, volume: 0.45, layers: [burst(0.4, [800, 3000], 0.35)] } }),

  defineSound({ id: 'king-sight', synth: { ...ring(700, 40, 0.04, 0.5), layers: [groan(55, 45, 1.6, 0.6, { lowpass: 400 })] } }),
  defineSound({ id: 'king-active', synth: { ...click(900, 0.5), layers: [{ ...click(650, 0.5), delay: 0.4 }] } }),
  defineSound({ id: 'king-pain', synth: { ...ring(600, 8, 0.05, 0.5), layers: [thump(80, 40, 0.3, 0.7)] } }),
  defineSound({
    id: 'king-death',
    synth: {
      ...ring(650, 70, 0.045, 0.45),
      layers: [
        { wave: 'noise', duration: 3, attack: 0.01, release: 2.5, lowpass: [2500, 120], noiseHold: 5, distortion: 0.5, volume: 0.8 },
        thump(60, 20, 2, 1),
      ],
    },
  }),
  defineSound({ id: 'king-stomp', synth: { ...thump(55, 25, 0.35, 1), layers: [burst(0.2, [900, 150], 0.5, 6)] } }),
  defineSound({ id: 'king-ring', synth: ring(820, 45, 0.035, 0.5) }),
  defineSound({ id: 'bell-launch', synth: { wave: 'triangle', freq: 880, duration: 0.6, release: 0.5, volume: 0.45, vibrato: { rate: 7, depth: 0.3 }, layers: [{ wave: 'noise', duration: 0.4, attack: 0.02, release: 0.3, lowpass: [600, 3000], volume: 0.5 }] } }),
];
