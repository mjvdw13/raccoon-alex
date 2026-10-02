import { defineEffect, defineProjectile } from '../engine/defs.js';

const FX = (name, w, h) => ({ src: `assets/sprites/fx/${name}.png`, frameWidth: w, frameHeight: h });

export const effects = [
  defineEffect({ id: 'puff', sheet: FX('puff', 16, 16), anims: { idle: { frames: [0, 1, 2, 3], fps: 14, fullbright: [0] } }, rise: 0.3 }),
  defineEffect({ id: 'blood', sheet: FX('blood', 16, 16), anims: { idle: { frames: [0, 1, 2], fps: 10 } }, rise: -0.4 }),
  defineEffect({ id: 'explosion', sheet: FX('explosion', 64, 64), anims: { idle: { frames: [0, 1, 2, 3, 4], fps: 12 } }, fullbright: true }),
  defineEffect({ id: 'teleport-fog', sheet: FX('teleport-fog', 48, 64), anims: { idle: { frames: [0, 1, 2, 3, 4, 5], fps: 10 } }, fullbright: true }),
  // Speech bubbles that pop up beside a coworker when they react.
  ...['dots', 'question', 'exclaim', 'heart', 'ugh', 'sec'].map((name, frame) =>
    defineEffect({ id: `bubble-${name}`, sheet: FX('bubbles', 24, 20), anims: { idle: { frames: [frame], durations: [1.6] } }, fullbright: true, rise: 0.04 }),
  ),
];

export const projectiles = [
  defineProjectile({
    id: 'email-fireball',
    sheet: FX('email-fireball', 32, 32),
    anims: { fly: { frames: [0, 1], fps: 10, loop: true }, explode: { frames: [2, 3, 4], fps: 12 } },
    speed: 8,
    damage: [3, 24],
    radius: 0.14,
    sounds: { fire: 'fireball-launch', explode: 'fireball-hit' },
  }),
  defineProjectile({
    id: 'pip-ball',
    sheet: FX('pip-ball', 32, 32),
    anims: { fly: { frames: [0, 1], fps: 10, loop: true }, explode: { frames: [2, 3, 4], fps: 12 } },
    speed: 9,
    damage: [8, 56],
    radius: 0.16,
    sounds: { fire: 'pip-launch', explode: 'fireball-hit' },
  }),
  defineProjectile({
    id: 'trash-bag',
    sheet: FX('trash-bag', 32, 32),
    anims: { fly: { frames: [0, 1, 2, 3], fps: 10, loop: true }, explode: { frames: [4, 5, 6], fps: 10 } },
    fullbright: false,
    speed: 7,
    gravity: 6,
    damage: [5, 20],
    splash: { radius: 1.6, damage: 40 },
    radius: 0.2,
    sounds: { fire: 'trash-throw', explode: 'trash-splat' },
  }),
  defineProjectile({
    id: 'toner-rocket',
    sheet: FX('toner-rocket', 64, 64),
    anims: { fly: { frames: [0, 1], fps: 12, loop: true }, explode: { frames: [2, 3, 4, 5], fps: 10 } },
    speed: 15,
    damage: [20, 100],
    splash: { radius: 2.5, damage: 128 },
    radius: 0.14,
    sounds: { explode: 'explode' },
  }),
  defineProjectile({
    id: 'bell-rocket',
    sheet: FX('bell-rocket', 64, 64),
    anims: { fly: { frames: [0, 1], fps: 12, loop: true }, explode: { frames: [2, 3, 4, 5], fps: 10 } },
    speed: 13,
    damage: [20, 100],
    splash: { radius: 2.3, damage: 110 },
    radius: 0.16,
    sounds: { fire: 'bell-launch', explode: 'explode' },
  }),
  defineProjectile({
    id: 'bfc-blast',
    sheet: FX('bfc-blast', 64, 64),
    anims: { fly: { frames: [0, 1], fps: 10, loop: true }, explode: { frames: [2, 3, 4, 5, 6], fps: 9 } },
    speed: 11,
    damage: [100, 400],
    splash: { radius: 4.5, damage: 400 },
    radius: 0.3,
    sounds: { explode: 'bfc-explode' },
  }),
];
