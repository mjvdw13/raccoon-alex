import { defineMonster } from '../../engine/defs.js';

// What's left of an unpaid intern: a rotting, shambling corpse with a staple
// gun (Doom's zombieman).
export default defineMonster({
  id: 'intern',
  name: 'Zombie Intern',
  glyph: 'i',
  sheet: { src: 'assets/sprites/monsters/intern.png', frameWidth: 64, frameHeight: 64 },
  health: 20,
  speed: 2.0,
  radius: 0.28,
  painChance: 0.78,
  reactionTime: 0.5,
  cooldown: [1.1, 2.6],
  attack: { kind: 'hitscan', damage: [3, 12], spread: 0.11, range: 24, sound: 'staple-fire' },
  anims: {
    idle: { frames: [0, 2], fps: 2, loop: true },
    walk: { frames: [0, 1, 2, 3], fps: 6 },
    attack: { frames: [4, 5, 4], durations: [0.3, 0.12, 0.2], fireAt: 1, fullbright: [1] },
    pain: { frames: [6], durations: [0.15] },
    death: { frames: [7, 8, 9, 10, 11], fps: 8 },
  },
  sounds: { sight: 'intern-sight', active: 'intern-active', pain: 'intern-pain', death: 'intern-death' },
  drops: ['staples-clip'],
});
