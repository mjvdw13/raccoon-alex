import { defineMonster } from '../../engine/defs.js';

// The Off-By-One Ant: a worker ant the size of a dog that spits acid. Weak,
// and always one step off. It hoards staples and drops them when squashed
// (Doom's zombieman).
export default defineMonster({
  id: 'ant',
  name: 'Off-By-One Ant',
  glyph: 'i',
  sheet: { src: 'assets/sprites/monsters/ant.png', frameWidth: 64, frameHeight: 64 },
  health: 20,
  speed: 2.0,
  radius: 0.28,
  painChance: 0.78,
  reactionTime: 0.5,
  cooldown: [1.1, 2.6],
  attack: { kind: 'hitscan', damage: [3, 12], spread: 0.11, range: 24, sound: 'acid-spit' },
  anims: {
    idle: { frames: [0, 2], fps: 2, loop: true },
    walk: { frames: [0, 1, 2, 3], fps: 6 },
    attack: { frames: [4, 5, 4], durations: [0.3, 0.12, 0.2], fireAt: 1, fullbright: [1] },
    pain: { frames: [6], durations: [0.15] },
    death: { frames: [7, 8, 9, 10, 11], fps: 8 },
  },
  sounds: { sight: 'ant-sight', active: 'ant-active', pain: 'ant-pain', death: 'ant-death' },
  blood: 'ichor',
  drops: ['staples-clip'],
});
