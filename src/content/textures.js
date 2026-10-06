import { defineTexture } from '../engine/defs.js';

// Wall, floor, ceiling and sky textures. Walls/flats are 64x64 PNGs in
// assets/textures/ (animated ones are horizontal strips of 64x64 frames).
// To add a texture: drop a PNG in assets/textures/ and add its name here.

const STATIC = [
  // Office
  'carpet', 'carpet-red', 'carpet-brown', 'ceiling-tile', 'ceiling-stained', 'ceiling-light', 'ceiling-light-broken',
  'cubicle', 'cubicle-memo', 'cubicle-poster', 'cubicle-beige', 'drywall', 'drywall-outlet', 'drywall-blood',
  'wood-panel', 'wood-panel-dark', 'whiteboard', 'window-night', 'vending', 'linoleum', 'poster-alex',
  'elevator-wall', 'elevator-floor',
  // Doors and switches
  'door-office', 'door-metal', 'door-rusty', 'door-blue', 'door-yellow', 'door-red', 'door-elevator',
  'door-jamb', 'door-jamb-rust', 'switch-exit', 'switch-exit-on', 'switch', 'switch-on', 'switch-concrete',
  'switch-concrete-on',
  // Server room
  'server-floor', 'tech-panel', 'tech-vent', 'cable-wall',
  // Basement
  'concrete', 'concrete-dark', 'concrete-floor', 'concrete-stripe', 'pipes', 'metal-grate', 'rust-panel',
  'brick-dirty',
  // Underworld
  'sewer-brick', 'sewer-brick-slime', 'sewer-floor', 'trash-wall', 'flesh-trash', 'landfill', 'dirt',
  'bone-wall',
];

const ANIMATED = {
  'server-rack': { frames: 4, fps: 3 },
  'crt-wall': { frames: 4, fps: 6 },
  boiler: { frames: 3, fps: 8 },
  sewage: { frames: 4, fps: 4 },
  'flesh-eye': { frames: 4, fps: 2 },
};

export default [
  ...STATIC.map((id) => defineTexture({ id, src: `assets/textures/${id}.png` })),
  ...Object.entries(ANIMATED).map(([id, a]) => defineTexture({ id, src: `assets/textures/${id}.png`, ...a })),
  defineTexture({ id: 'sky-city', src: 'assets/textures/sky-city.png', sky: true }),
  defineTexture({ id: 'sky-hell', src: 'assets/textures/sky-hell.png', sky: true }),
];
