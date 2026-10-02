import { defineItem } from '../../engine/defs.js';

const badge = (color, glyph, label) =>
  defineItem({
    id: `badge-${color}`,
    name: `${label} Badge`,
    glyph,
    sheet: { src: `assets/sprites/items/badge-${color}.png`, frameWidth: 16, frameHeight: 16 },
    anims: { idle: { frames: [0, 1], fps: 2, loop: true, fullbright: [0] } },
    pickup: { key: color, always: true },
    message: `Picked up the ${label.toLowerCase()} access badge.`,
    sound: 'key-pickup',
  });

export default [badge('blue', 'b', 'BLUE'), badge('yellow', 'y', 'YELLOW'), badge('red', 'R', 'RED')];
