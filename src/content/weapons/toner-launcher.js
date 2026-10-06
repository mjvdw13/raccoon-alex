import { defineWeapon } from '../../engine/defs.js';

// Slot 5: launches explosive toner cartridges (Doom's rocket launcher).
// Mind the splash damage.
export default defineWeapon({
  id: 'toner-launcher',
  name: 'TONER LAUNCHER',
  slot: 5,
  ammo: 'toner',
  priority: 1,
  flashLight: 2,
  sheet: { src: 'assets/sprites/weapons/toner-launcher.png', frameWidth: 128, frameHeight: 96 },
  offset: [0, 18], // sits low, so the middle of the view stays clear
  anims: {
    idle: [0],
    fire: { frames: [1, 2, 0], durations: [0.1, 0.18, 0.4], fireAt: 0, fullbright: [0] },
  },
  fire: { kind: 'projectile', projectile: 'toner-rocket' },
  sounds: { fire: 'toner-fire' },
});
