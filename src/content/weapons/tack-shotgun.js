import { defineWeapon } from '../../engine/defs.js';

// Slot 3: a pump-action that sprays seven thumbtacks per shot (Doom's shotgun).
export default defineWeapon({
  id: 'tack-shotgun',
  name: 'THUMBTACK SHOTGUN',
  slot: 3,
  ammo: 'tacks',
  priority: 4,
  flashLight: 1,
  sheet: { src: 'assets/sprites/weapons/tack-shotgun.png', frameWidth: 128, frameHeight: 96 },
  offset: [0, 18], // sits low, so the middle of the view stays clear
  anims: {
    idle: [0],
    fire: {
      frames: [1, 2, 0, 3, 4, 3, 0],
      durations: [0.07, 0.1, 0.1, 0.15, 0.15, 0.12, 0.14],
      fireAt: 0,
      fullbright: [0],
      events: { 3: 'sound:tack-pump' },
    },
  },
  fire: { kind: 'hitscan', damage: [5, 15], pellets: 7, spread: 0.1, range: 40 },
  sounds: { fire: 'tack-fire' },
});
