import { defineCheat } from '../engine/defs.js';

// Type these during play. '#' matches one digit.
export default [
  defineCheat({
    code: 'iddqd',
    run(game, world) {
      const p = world.player.player;
      p.god = !p.god;
      if (p.god) p.health = Math.max(p.health, 100);
      return p.god ? 'WELL RESTED MODE ON' : 'WELL RESTED MODE OFF';
    },
  }),
  defineCheat({
    code: 'nap',
    run(game, world) {
      const p = world.player.player;
      p.god = !p.god;
      return p.god ? 'POWER NAP: INVINCIBLE' : 'NAP OVER';
    },
  }),
  defineCheat({
    code: 'idkfa',
    run(game, world) {
      game.giveEverything(world);
      return 'VERY HAPPY AMMO ADDED';
    },
  }),
  defineCheat({
    code: 'espresso',
    run(game, world) {
      game.giveEverything(world);
      world.player.player.health = Math.max(world.player.player.health, 100);
      return 'QUADRUPLE SHOT. HANDS SHAKING.';
    },
  }),
  defineCheat({
    code: 'idclip',
    run(game, world) {
      const p = world.player.player;
      p.noclip = !p.noclip;
      return p.noclip ? 'NO CLIPPING MODE ON' : 'NO CLIPPING MODE OFF';
    },
  }),
  defineCheat({
    code: 'iddt',
    run(game) {
      game.hud.revealThings = !game.hud.revealThings;
      return game.hud.revealThings ? 'MAP REVEALED' : 'MAP HIDDEN';
    },
  }),
  defineCheat({
    code: 'idclev##',
    run(game, world, a, b) {
      const ep = Number(a);
      const map = Number(b);
      const episode = [...game.registry.episodes.values()][ep - 1];
      const id = episode?.levels[map - 1];
      if (!id) return 'NO SUCH LEVEL';
      game.startLevel(id, world.player.player.snapshot());
      return `WARPING TO ${id.toUpperCase()}`;
    },
  }),
];
