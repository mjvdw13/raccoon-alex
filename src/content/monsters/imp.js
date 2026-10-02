import { defineMonster } from '../../engine/defs.js';

// A hunched, spiny demon with a barbed tail that hurls flaming reply-all
// emails (Doom's imp).
export default defineMonster({
  id: 'imp',
  name: 'Reply-All Imp',
  glyph: 'm',
  sheet: { src: 'assets/sprites/monsters/imp.png', frameWidth: 64, frameHeight: 64 },
  health: 60,
  speed: 2.4,
  radius: 0.3,
  painChance: 0.7,
  reactionTime: 0.45,
  cooldown: [1.2, 2.6],
  attack: { kind: 'projectile', projectile: 'email-fireball', range: 32 },
  melee: { kind: 'melee', damage: [3, 24], range: 1.0, hitSound: 'claw' },
  anims: {
    idle: { frames: [0, 2], fps: 2, loop: true },
    walk: { frames: [0, 1, 2, 3], fps: 6 },
    attack: { frames: [4, 5, 6], durations: [0.25, 0.2, 0.25], fireAt: 2 },
    pain: { frames: [7], durations: [0.15] },
    death: { frames: [8, 9, 10, 11, 12], fps: 8 },
  },
  sounds: { sight: 'imp-sight', active: 'imp-active', pain: 'imp-pain', death: 'imp-death' },
});
