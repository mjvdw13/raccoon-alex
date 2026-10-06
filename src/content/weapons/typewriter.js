import { defineWeapon } from '../../engine/defs.js';

// Slot 4: the "Chicago Typewriter", a possessed IBM Selectric that spits
// staples at an alarming words-per-minute (Doom's chaingun).
export default defineWeapon({
  id: 'typewriter',
  name: 'CHICAGO TYPEWRITER',
  slot: 4,
  ammo: 'staples',
  priority: 5,
  accurateFirstShot: true,
  flashLight: 1,
  sheet: { src: 'assets/sprites/weapons/typewriter.png', frameWidth: 128, frameHeight: 96 },
  offset: [0, 20], // sits low, so the middle of the view stays clear
  anims: {
    idle: [0],
    fire: { frames: [1, 2], durations: [0.07, 0.07], fireAt: [0, 1], fullbright: [0, 1] },
  },
  fire: { kind: 'hitscan', damage: [5, 15], spread: 0.06, range: 48 },
  sounds: { fire: 'typewriter-fire' },
});
