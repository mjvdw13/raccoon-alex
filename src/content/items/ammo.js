import { defineItem } from '../../engine/defs.js';

const S = (name, w, h) => ({ src: `assets/sprites/items/${name}.png`, frameWidth: w, frameHeight: h });

export default [
  defineItem({ id: 'staples-clip', name: 'Staples', glyph: 's', sheet: S('staples-clip', 16, 16), pickup: { ammo: { staples: 10 } }, message: 'Picked up some staples.', sound: 'item-ammo' }),
  defineItem({ id: 'staples-box', name: 'Box of Staples', glyph: 'S', sheet: S('staples-box', 32, 24), pickup: { ammo: { staples: 50 } }, message: 'Picked up a box of staples.', sound: 'item-ammo' }),
  defineItem({ id: 'tacks', name: 'Thumbtacks', glyph: 't', sheet: S('tacks', 24, 16), pickup: { ammo: { tacks: 4 } }, message: 'Picked up 4 thumbtacks.', sound: 'item-ammo' }),
  defineItem({ id: 'tacks-box', name: 'Box of Thumbtacks', glyph: 'T', sheet: S('tacks-box', 32, 24), pickup: { ammo: { tacks: 20 } }, message: 'Picked up a box of thumbtacks.', sound: 'item-ammo' }),
  defineItem({ id: 'toner', name: 'Toner Cartridge', glyph: 'n', sheet: S('toner', 24, 24), pickup: { ammo: { toner: 1 } }, message: 'Picked up a toner cartridge.', sound: 'item-ammo' }),
  defineItem({ id: 'toner-box', name: 'Case of Toner', glyph: 'N', sheet: S('toner-box', 40, 32), pickup: { ammo: { toner: 5 } }, message: 'Picked up a case of toner.', sound: 'item-ammo' }),
  defineItem({ id: 'pods', name: 'Coffee Pods', glyph: 'q', sheet: S('pods', 24, 16), pickup: { ammo: { pods: 20 } }, message: 'Picked up some coffee pods.', sound: 'item-ammo' }),
  defineItem({ id: 'pods-box', name: 'Pod Megapack', glyph: 'Q', sheet: S('pods-box', 32, 24), pickup: { ammo: { pods: 100 } }, message: 'Picked up a coffee pod megapack.', sound: 'item-ammo' }),
  defineItem({
    id: 'laptop-bag',
    name: 'Laptop Bag',
    glyph: 'B',
    sheet: S('laptop-bag', 32, 24),
    pickup: { backpack: true },
    message: 'Picked up a laptop bag full of supplies!',
    sound: 'item-ammo',
  }),
];
