import test from 'node:test';
import assert from 'node:assert/strict';
import { tryPickup } from '../src/engine/things/pickups.js';
import { makeWorld, mockInput, room, run } from './helpers.js';

const arena = room(['#########', '#.......#', '#.......#', '#.......#', '#########'], ['', ' >     i']);

test('armor absorbs a third (class 1) or half (class 2) of the damage', () => {
  const w = makeWorld(arena, { noMonsters: true });
  const p = w.player.player;
  p.armor = 100;
  p.armorClass = 1;
  w.damage(w.player, 30, null, null);
  assert.equal(p.armor, 90);
  assert.equal(p.health, 80);
  p.armorClass = 2;
  w.damage(w.player, 30, null, null);
  assert.equal(p.armor, 75);
  assert.equal(p.health, 65);
});

test('running out of armor drops the armor class', () => {
  const w = makeWorld(arena, { noMonsters: true });
  const p = w.player.player;
  p.armor = 5;
  p.armorClass = 2;
  w.damage(w.player, 40, null, null);
  assert.equal(p.armor, 0);
  assert.equal(p.armorClass, 0);
  assert.equal(p.health, 65);
});

test('the easiest skill halves the damage the player takes', () => {
  const w = makeWorld(arena, { noMonsters: true, skill: 1 });
  w.damage(w.player, 30, null, null);
  assert.equal(w.player.player.health, 85);
});

test('god mode ignores damage', () => {
  const w = makeWorld(arena, { noMonsters: true });
  w.player.player.god = true;
  w.damage(w.player, 500, null, null);
  assert.equal(w.player.player.health, 100);
});

test('killing a monster counts the kill and drops its item', () => {
  const w = makeWorld(arena);
  const intern = w.things.find((t) => t.kind === 'monster');
  assert.ok(intern);
  w.damage(intern, 1000, w.player, w.player);
  assert.ok(intern.dead);
  assert.equal(w.stats.kills, 1);
  run(w, mockInput(), 0.5);
  assert.ok(w.things.some((t) => t.def.id === 'staples-clip'), 'interns drop staples');
});

test('pickups respect their limits', () => {
  const w = makeWorld(arena, { noMonsters: true });
  const p = w.player.player;
  const item = (id) => w.spawn(id, 2.5, 2.5);
  assert.equal(tryPickup(w, w.player, item('donut')), false, 'full health: the donut stays');
  p.health = 95;
  assert.equal(tryPickup(w, w.player, item('donut')), true);
  assert.equal(p.health, 100);
  assert.equal(tryPickup(w, w.player, item('dream-orb')), true, 'the orb goes over 100');
  assert.ok(p.health > 100 && p.health <= 200);
  p.ammo.staples = p.maxAmmo.staples;
  assert.equal(tryPickup(w, w.player, item('staples-box')), false, 'ammo is capped');
  const max = p.maxAmmo.staples;
  assert.equal(tryPickup(w, w.player, item('laptop-bag')), true);
  assert.equal(p.maxAmmo.staples, max * 2, 'the backpack doubles capacity');
});

test('the staple gun hits what it is pointed at', () => {
  const w = makeWorld(arena);
  const intern = w.things.find((t) => t.kind === 'monster');
  const input = mockInput();
  input.hold('fire');
  const start = w.player.player.ammo.staples;
  run(w, input, 3);
  assert.ok(w.player.player.ammo.staples < start, 'ammo was spent');
  assert.ok(intern.dead, 'the intern in front of the player went down');
});

test('effects (puffs, blood, explosions) play once and disappear', () => {
  const w = makeWorld(arena, { noMonsters: true });
  const fx = ['puff', 'blood', 'explosion', 'teleport-fog'].map((id) => w.spawnEffect(id, 4.5, 2.5, 0.5));
  run(w, mockInput(), 1);
  for (const e of fx) assert.ok(e.removed, `${e.def.id} is gone`);
});
