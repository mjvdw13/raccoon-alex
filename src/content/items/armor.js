import { defineItem } from '../../engine/defs.js';

const S = (name, w, h) => ({ src: `assets/sprites/items/${name}.png`, frameWidth: w, frameHeight: h });

// Caffeine is armor. Class 1 absorbs a third of incoming damage, class 2 half.
export default [
  defineItem({
    id: 'coffee-bean',
    name: 'Coffee Bean',
    glyph: ';',
    sheet: S('coffee-bean', 16, 16),
    anims: { idle: { frames: [0, 1, 2, 3, 2, 1], fps: 8, loop: true } },
    radius: 0.25,
    pickup: { armor: 1, maxArmor: 200 },
    countItem: true,
    message: 'Chewed a coffee bean.',
    sound: 'item',
  }),
  defineItem({
    id: 'cup-of-joe',
    name: 'Cup of Joe',
    glyph: 'a',
    sheet: S('cup-of-joe', 24, 24),
    pickup: { armor: 100, armorClass: 1 },
    message: 'Picked up a cup of joe. Still warm!',
    sound: 'item-slurp',
  }),
  defineItem({
    id: 'triple-espresso',
    name: 'Triple Espresso',
    glyph: 'A',
    sheet: S('triple-espresso', 32, 32),
    anims: { idle: { frames: [0, 1], fps: 3, loop: true } },
    pickup: { armor: 200, armorClass: 2 },
    message: 'TRIPLE ESPRESSO! Your heart is racing.',
    sound: 'item-slurp',
  }),
];
