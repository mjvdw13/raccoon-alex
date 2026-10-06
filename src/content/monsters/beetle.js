import { defineMonster } from '../../engine/defs.js';

// The Deadlock Beetle: a stag beetle the size of a desk. Its mandibles cross
// and lock; it spits globs of glowing acid through the gap, and whatever gets
// caught between them stays there (Doom's hell knight).
export default defineMonster({
  id: 'beetle',
  name: 'Deadlock Beetle',
  glyph: 'M',
  sheet: { src: 'assets/sprites/monsters/beetle.png', frameWidth: 80, frameHeight: 80 },
  health: 400,
  speed: 2.0,
  radius: 0.36,
  height: 1.1,
  painChance: 0.22,
  reactionTime: 0.5,
  mass: 1000,
  cooldown: [1.2, 2.4],
  attack: { kind: 'projectile', projectile: 'acid-glob', range: 34 },
  melee: { kind: 'melee', damage: [10, 70], range: 1.1, hitSound: 'mandible-snap' },
  anims: {
    idle: { frames: [0, 2], fps: 2, loop: true },
    walk: { frames: [0, 1, 2, 3], fps: 5 },
    attack: { frames: [4, 5, 6], durations: [0.3, 0.2, 0.3], fireAt: 2 },
    pain: { frames: [7], durations: [0.18] },
    death: { frames: [8, 9, 10, 11, 12, 13], fps: 7 },
  },
  sounds: { sight: 'beetle-sight', active: 'beetle-active', pain: 'beetle-pain', death: 'beetle-death' },
  blood: 'ichor',
});
