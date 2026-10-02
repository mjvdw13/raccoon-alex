import { defineMonster } from '../../engine/defs.js';

// A lumbering heap of garbage bags with a tin-can head. Lobs bursting trash
// bags in an arc and hits like a dumpster lid.
export default defineMonster({
  id: 'golem',
  name: 'Garbage Golem',
  glyph: 'G',
  sheet: { src: 'assets/sprites/monsters/golem.png', frameWidth: 80, frameHeight: 80 },
  health: 300,
  speed: 1.6,
  radius: 0.42,
  height: 1.2,
  painChance: 0.3,
  reactionTime: 0.6,
  mass: 900,
  cooldown: [1.4, 2.8],
  attack: { kind: 'projectile', projectile: 'trash-bag', range: 18, minRange: 2 },
  melee: { kind: 'melee', damage: [8, 50], range: 1.15, hitSound: 'golem-punch' },
  anims: {
    idle: { frames: [0, 2], fps: 1.5, loop: true },
    walk: { frames: [0, 1, 2, 3], fps: 4 },
    attack: { frames: [4, 5, 6], durations: [0.35, 0.25, 0.3], fireAt: 2 },
    pain: { frames: [7], durations: [0.2] },
    death: { frames: [8, 9, 10, 11, 12, 13], fps: 7 },
  },
  sounds: { sight: 'golem-sight', active: 'golem-active', pain: 'golem-pain', death: 'golem-death' },
  bleeds: false,
  blood: 'puff',
});
