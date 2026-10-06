import { defineItem } from '../../engine/defs.js';

const S = (name) => ({ src: `assets/sprites/items/${name}.png`, frameWidth: 64, frameHeight: 32 });

// Weapon pickups: the weapon plus some ammo for it.
export default [
  defineItem({
    id: 'pickup-staple-gun',
    name: 'Staple Gun',
    sheet: S('pickup-staple-gun'),
    radius: 0.35,
    // Alex's first gun (he starts with his paws), so it comes with the
    // 50 staples he used to start with.
    pickup: { weapon: 'staple-gun', ammo: { staples: 50 } },
    message: 'You got the staple gun!',
    sound: 'weapon-pickup',
  }),
  defineItem({
    id: 'pickup-tack-shotgun',
    name: 'Thumbtack Shotgun',
    glyph: '3',
    sheet: S('pickup-tack-shotgun'),
    radius: 0.35,
    pickup: { weapon: 'tack-shotgun', ammo: { tacks: 8 } },
    message: 'You got the thumbtack shotgun!',
    sound: 'weapon-pickup',
  }),
  defineItem({
    id: 'pickup-typewriter',
    name: 'Chicago Typewriter',
    glyph: '4',
    sheet: S('pickup-typewriter'),
    radius: 0.35,
    pickup: { weapon: 'typewriter', ammo: { staples: 20 } },
    message: 'You got the Chicago Typewriter!',
    sound: 'weapon-pickup',
  }),
  defineItem({
    id: 'pickup-toner-launcher',
    name: 'Toner Launcher',
    glyph: '5',
    sheet: S('pickup-toner-launcher'),
    radius: 0.35,
    pickup: { weapon: 'toner-launcher', ammo: { toner: 2 } },
    message: 'You got the toner launcher!',
    sound: 'weapon-pickup',
  }),
  defineItem({
    id: 'pickup-bfc',
    name: 'B.F.C. 9000',
    glyph: '6',
    sheet: S('pickup-bfc'),
    radius: 0.35,
    pickup: { weapon: 'bfc', ammo: { pods: 40 } },
    message: 'You got the B.F.C. 9000! Oh, yes.',
    sound: 'weapon-pickup',
  }),
];
