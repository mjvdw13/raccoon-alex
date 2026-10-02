import { defineWeapon } from '../../engine/defs.js';

// Slot 1: Alex's own two (slightly raccoon-like) hands. An espresso shot
// (berserk) makes them ten times deadlier.
export default defineWeapon({
  id: 'paws',
  name: 'RACCOON PAWS',
  slot: 1,
  ammo: null,
  priority: 0,
  noise: false,
  sheet: { src: 'assets/sprites/weapons/paws.png', frameWidth: 160, frameHeight: 80 },
  anims: {
    idle: [0],
    fire: { frames: [1, 2, 3, 0], durations: [0.07, 0.1, 0.12, 0.1], fireAt: 1 },
  },
  fire: { kind: 'melee', damage: [2, 20], range: 1.15, arc: 0.6, berserkMultiplier: 10, hitSound: 'paw-hit', missSound: 'paw-swipe' },
  bob: 1.2,
});
