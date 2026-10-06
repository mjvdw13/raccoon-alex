import { defineItem } from '../../engine/defs.js';

const S = (name, w, h) => ({ src: `assets/sprites/items/${name}.png`, frameWidth: w, frameHeight: h });

export default [
  // Berserk: full health and 10x punching power until the level ends.
  defineItem({
    id: 'espresso-shot',
    name: 'Espresso Shot',
    glyph: 'e',
    sheet: S('espresso-shot', 16, 24),
    pickup: { powerup: 'berserk' },
    countItem: true,
    message: 'ESPRESSO SHOT! Your paws are shaking with rage!',
    sound: 'powerup',
  }),
  // Invulnerability for 30 seconds (inverted colours).
  defineItem({
    id: 'dnd-sign',
    name: 'Do Not Disturb Sign',
    glyph: 'D',
    sheet: S('dnd-sign', 24, 32),
    anims: { idle: { frames: [0, 1], fps: 3, loop: true, fullbright: true } },
    pickup: { powerup: 'invulnerable', duration: 30 },
    countItem: true,
    message: 'DO NOT DISTURB! Nothing can touch you.',
    sound: 'powerup',
  }),
  // Light amplification for 120 seconds.
  defineItem({
    id: 'night-goggles',
    name: 'Night-Vision Goggles',
    glyph: 'g',
    sheet: S('night-goggles', 24, 16),
    pickup: { powerup: 'nightvision', duration: 120 },
    countItem: true,
    message: 'Night-vision goggles! Raccoon vision engaged.',
    sound: 'powerup',
  }),
  // Protection from sewage floors for 60 seconds.
  defineItem({
    id: 'waders',
    name: 'Rubber Waders',
    glyph: 'w',
    sheet: S('waders', 24, 32),
    pickup: { powerup: 'hazard', duration: 60 },
    countItem: true,
    message: 'Rubber waders! The sewage can\'t hurt you.',
    sound: 'powerup',
  }),
  // Reveals the whole automap.
  defineItem({
    id: 'floor-plan',
    name: 'Floor Plan',
    glyph: 'f',
    sheet: S('floor-plan', 24, 24),
    pickup: { map: true },
    countItem: true,
    message: 'Found the fire-escape floor plan.',
    sound: 'powerup',
  }),
];
