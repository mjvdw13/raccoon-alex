import { defineWeapon } from '../../engine/defs.js';

// Slot 2: the trusty heavy-duty staple gun (Doom's pistol).
export default defineWeapon({
  id: 'staple-gun',
  name: 'STAPLE GUN',
  slot: 2,
  ammo: 'staples',
  priority: 2,
  accurateFirstShot: true,
  flashLight: 1,
  sheet: { src: 'assets/sprites/weapons/staple-gun.png', frameWidth: 96, frameHeight: 88 },
  anims: {
    idle: [0],
    fire: { frames: [1, 2, 3, 0], durations: [0.06, 0.08, 0.12, 0.14], fireAt: 0, fullbright: [0] },
  },
  fire: { kind: 'hitscan', damage: [5, 15], spread: 0.05, range: 48 },
  sounds: { fire: 'staple-fire' },
});
