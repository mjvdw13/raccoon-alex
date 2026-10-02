import { defineItem } from '../../engine/defs.js';

const S = (name, w, h) => ({ src: `assets/sprites/items/${name}.png`, frameWidth: w, frameHeight: h });

export default [
  // +1 health, can go over 100 (Doom's health bonus).
  defineItem({
    id: 'jelly-bean',
    name: 'Jelly Bean',
    glyph: ',',
    sheet: S('jelly-bean', 16, 16),
    anims: { idle: { frames: [0, 1, 2, 3, 2, 1], fps: 8, loop: true } },
    radius: 0.25,
    pickup: { health: 1, maxHealth: 200 },
    countItem: true,
    message: 'Ate a jelly bean.',
    sound: 'item',
  }),
  // +10 health (stimpack).
  defineItem({
    id: 'donut',
    name: 'Glazed Donut',
    glyph: 'd',
    sheet: S('donut', 24, 24),
    pickup: { health: 10 },
    message: 'Inhaled a glazed donut.',
    sound: 'item-food',
  }),
  // +25 health (medikit).
  defineItem({
    id: 'pillow',
    name: 'Power-Nap Pillow',
    glyph: 'p',
    sheet: S('pillow', 32, 24),
    pickup: { health: 25 },
    message: 'Took a 20-second power nap.',
    sound: 'item-food',
  }),
  // +100 health up to 200 (soulsphere).
  defineItem({
    id: 'dream-orb',
    name: 'Lucid Dream',
    glyph: 'O',
    sheet: S('dream-orb', 32, 32),
    anims: { idle: { frames: [0, 1, 2, 3], fps: 6, loop: true } },
    fullbright: true,
    radius: 0.3,
    pickup: { health: 100, maxHealth: 200 },
    countItem: true,
    message: 'LUCID DREAM! You feel almost rested.',
    sound: 'powerup',
  }),
];
