import { defineMonster } from '../../engine/defs.js';

// A towering middle manager who lobs glowing green Performance Improvement
// Plans and has a devastating briefcase backhand (Doom's hell knight).
export default defineMonster({
  id: 'manager',
  name: 'Middle Manager',
  glyph: 'M',
  sheet: { src: 'assets/sprites/monsters/manager.png', frameWidth: 64, frameHeight: 80 },
  scale: 1.05,
  health: 400,
  speed: 2.0,
  radius: 0.36,
  height: 1.1,
  painChance: 0.22,
  reactionTime: 0.5,
  mass: 1000,
  cooldown: [1.2, 2.4],
  attack: { kind: 'projectile', projectile: 'pip-ball', range: 34 },
  melee: { kind: 'melee', damage: [10, 70], range: 1.1, hitSound: 'briefcase' },
  anims: {
    idle: { frames: [0, 2], fps: 2, loop: true },
    walk: { frames: [0, 1, 2, 3], fps: 5 },
    attack: { frames: [4, 5, 6], durations: [0.3, 0.2, 0.3], fireAt: 2 },
    pain: { frames: [7], durations: [0.18] },
    death: { frames: [8, 9, 10, 11, 12, 13], fps: 7 },
  },
  sounds: { sight: 'manager-sight', active: 'manager-active', pain: 'manager-pain', death: 'manager-death' },
});
