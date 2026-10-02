import { defineMonster } from '../../engine/defs.js';

// Sewer rats: small, quick, and there are always more of them.
export default defineMonster({
  id: 'rat',
  name: 'Sewer Rat',
  glyph: 'r',
  sheet: { src: 'assets/sprites/monsters/rat.png', frameWidth: 48, frameHeight: 32 },
  health: 12,
  speed: 4.8,
  radius: 0.2,
  height: 0.35,
  painChance: 1,
  reactionTime: 0.1,
  mass: 30,
  cooldown: [0.3, 0.7],
  melee: { kind: 'melee', damage: [2, 8], range: 0.8, hitSound: 'rat-bite' },
  anims: {
    idle: { frames: [0, 1], fps: 4, loop: true },
    walk: { frames: [0, 1, 2, 1], fps: 12 },
    melee: { frames: [3, 4], durations: [0.12, 0.15], fireAt: 1 },
    pain: { frames: [5], durations: [0.1] },
    death: { frames: [6, 7, 8, 9], fps: 10 },
  },
  sounds: { sight: 'rat-sight', active: 'rat-active', pain: 'rat-pain', death: 'rat-death' },
});
