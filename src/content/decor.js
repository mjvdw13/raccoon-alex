import { defineDecoration } from '../engine/defs.js';

const S = (name, w, h) => ({ src: `assets/sprites/decor/${name}.png`, frameWidth: w, frameHeight: h });

// Scenery. `solid` decorations block movement; `hanging` ones attach to the ceiling.
export default [
  // Office.
  defineDecoration({ id: 'office-chair', glyph: 'h', sheet: S('office-chair', 32, 32), solid: true, radius: 0.22 }),
  defineDecoration({ id: 'ficus', glyph: 'F', sheet: S('ficus', 32, 48), solid: true, radius: 0.22 }),
  defineDecoration({ id: 'water-cooler', glyph: 'W', sheet: S('water-cooler', 24, 48), solid: true, radius: 0.2 }),
  defineDecoration({ id: 'copier', glyph: 'X', sheet: S('copier', 48, 40), solid: true, radius: 0.36 }),
  defineDecoration({ id: 'filing-cabinet', glyph: 'L', sheet: S('filing-cabinet', 24, 40), solid: true, radius: 0.22 }),
  defineDecoration({
    id: 'floor-lamp',
    glyph: 'l',
    sheet: S('floor-lamp', 16, 56),
    anims: { idle: { frames: [0], fps: 1, fullbright: true } },
    solid: true,
    radius: 0.15,
  }),
  defineDecoration({
    id: 'ceiling-lamp',
    glyph: 'u',
    sheet: S('ceiling-lamp', 48, 16),
    anims: { idle: { frames: [0], fps: 1, fullbright: true } },
    hanging: true,
  }),
  defineDecoration({ id: 'trash-can', glyph: 'k', sheet: S('trash-can', 24, 24), radius: 0.18 }),
  defineDecoration({
    id: 'desk',
    glyph: 'H',
    sheet: S('desk', 48, 40),
    anims: { idle: { frames: [0, 1], fps: 2, loop: true } },
    solid: true,
    radius: 0.4,
  }),
  defineDecoration({ id: 'cone', glyph: 'Y', sheet: S('cone', 16, 24), solid: true, radius: 0.12 }),
  defineDecoration({
    id: 'sleeping-coworker',
    glyph: 'z',
    sheet: S('sleeping-coworker', 48, 24),
    anims: { idle: { frames: [0, 1], fps: 1, loop: true } },
  }),
  defineDecoration({ id: 'blood-pool', glyph: '~', sheet: S('blood-pool', 32, 8) }),
  // Tech / basement.
  defineDecoration({
    id: 'server-tower',
    glyph: 'J',
    sheet: S('server-tower', 24, 48),
    anims: { idle: { frames: [0, 1, 2], fps: 4, loop: true } },
    solid: true,
    radius: 0.22,
  }),
  defineDecoration({
    id: 'toxic-drum',
    glyph: 'o',
    sheet: S('toxic-drum', 24, 32),
    anims: {
      idle: { frames: [0, 1], fps: 3, loop: true },
      death: { frames: [2, 3, 4, 5, 6], fps: 10, fullbright: [1, 2, 3, 4] },
    },
    solid: true,
    radius: 0.22,
    health: 20,
    bleeds: false,
    explode: { radius: 2.6, damage: 128, sound: 'explode' },
    sounds: { death: 'explode' },
  }),
  // Underworld.
  defineDecoration({ id: 'trash-pile', glyph: 'P', sheet: S('trash-pile', 48, 24) }),
  defineDecoration({ id: 'tires', glyph: 'I', sheet: S('tires', 32, 24), solid: true, radius: 0.26 }),
  defineDecoration({
    id: 'crt-tv',
    glyph: 'V',
    sheet: S('crt-tv', 32, 32),
    anims: { idle: { frames: [0, 1, 2], fps: 8, loop: true, fullbright: true } },
    solid: true,
    radius: 0.24,
  }),
  defineDecoration({ id: 'shopping-cart', glyph: 'C', sheet: S('shopping-cart', 40, 32), solid: true, radius: 0.28 }),
  defineDecoration({
    id: 'burning-barrel',
    glyph: 'U',
    sheet: S('burning-barrel', 24, 40),
    anims: { idle: { frames: [0, 1, 2, 3], fps: 8, loop: true, fullbright: true } },
    solid: true,
    radius: 0.22,
  }),
  defineDecoration({ id: 'bones', glyph: 'x', sheet: S('bones', 32, 16) }),
];
