import { defineMonster } from '../../engine/defs.js';

// The Race Condition Roach: flat, glossy and fast, and it always gets there
// first. All bite (Doom's pinky demon).
export default defineMonster({
  id: 'roach',
  name: 'Race Condition Roach',
  glyph: 'c',
  sheet: { src: 'assets/sprites/monsters/roach.png', frameWidth: 64, frameHeight: 64 },
  health: 150,
  speed: 4.4,
  radius: 0.36,
  painChance: 0.7,
  reactionTime: 0.25,
  mass: 400,
  cooldown: [0.4, 0.8],
  melee: { kind: 'melee', damage: [4, 36], range: 1.05, hitSound: 'roach-bite' },
  anims: {
    idle: { frames: [0, 1], fps: 3, loop: true },
    walk: { frames: [0, 1, 2, 3], fps: 12 },
    melee: { frames: [4, 5, 6], durations: [0.2, 0.12, 0.2], fireAt: 1 },
    pain: { frames: [7], durations: [0.15] },
    death: { frames: [8, 9, 10, 11, 12], fps: 8 },
  },
  sounds: { sight: 'roach-sight', active: 'roach-active', pain: 'roach-pain', death: 'roach-death' },
  blood: 'ichor',
});
