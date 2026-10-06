import { defineWeapon } from '../../engine/defs.js';

// Slot 6: the B.F.C. 9000 (Big Freakin' Coffeemaker). Brews a ball of
// scalding coffee that ruins everyone's day. Uses 40 pods per shot.
export default defineWeapon({
  id: 'bfc',
  name: 'B.F.C. 9000',
  slot: 6,
  ammo: 'pods',
  ammoPerShot: 40,
  priority: 6,
  flashLight: 2,
  sheet: { src: 'assets/sprites/weapons/bfc.png', frameWidth: 128, frameHeight: 96 },
  offset: [0, 18], // sits low, so the middle of the view stays clear
  anims: {
    idle: { frames: [0, 1], fps: 3, loop: true },
    fire: {
      frames: [2, 2, 3, 4, 0],
      durations: [0.25, 0.3, 0.12, 0.25, 0.3],
      fireAt: 2,
      fullbright: [0, 1, 2],
      events: { 0: 'sound:bfc-charge' },
    },
  },
  fire: { kind: 'projectile', projectile: 'bfc-blast' },
  sounds: { fire: 'bfc-fire' },
});
