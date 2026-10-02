import { defineAmmo } from '../engine/defs.js';

// `max` is the carry limit (doubled by a laptop bag); `clip` is what a backpack hands out.
export default [
  defineAmmo({ id: 'staples', name: 'Staples', short: 'STPL', max: 200, clip: 10 }),
  defineAmmo({ id: 'tacks', name: 'Thumbtacks', short: 'TACK', max: 50, clip: 4 }),
  defineAmmo({ id: 'toner', name: 'Toner', short: 'TONR', max: 50, clip: 1 }),
  defineAmmo({ id: 'pods', name: 'Coffee pods', short: 'PODS', max: 300, clip: 20 }),
];
