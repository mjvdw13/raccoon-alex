import test from 'node:test';
import assert from 'node:assert/strict';
import { wanderArea } from '../src/engine/things/npc.js';
import { makeWorld, mockInput, room, run } from './helpers.js';

// Dale ('1') never wanders, so he makes a reliable target to shoot past.
const hall = room(['###########', '#.........#', '#.........#', '#.........#', '###########'], ['', '', ' >  1   i']);

const npc = (w, id) => w.things.find((t) => t.def.id === id);
const said = (w, name) => w.messages.filter((m) => m.startsWith(`${name}: `));

test('coworkers are friendlies: bullets, explosions and fireballs pass through them', () => {
  const w = makeWorld(hall);
  const dale = npc(w, 'dale');
  const ant = w.things.find((t) => t.kind === 'monster');
  assert.equal(dale.kind, 'npc');
  assert.equal(w.stats.totalKills, 1, 'coworkers are not counted as kills');
  assert.equal(w.hitscan(w.player, 0, 20, 5), ant, 'a shot straight through Dale hits the ant behind him');
  assert.equal(ant.health, ant.def.health - 5);
  w.radiusDamage(dale.x, dale.y, 3, 500, null, w.player);
  w.damage(dale, 1000, w.player, w.player);
  assert.ok(!dale.dead && !dale.removed, 'Dale is fine');

  const quiet = makeWorld(hall, { noMonsters: true });
  const shooter = { x: 8.5, y: 2.5, radius: 0.3, kind: 'monster' };
  quiet.spawnProjectile('exception-fireball', shooter, Math.PI);
  run(quiet, mockInput(), 2);
  assert.ok(quiet.player.player.health < 100, 'the fireball went through Dale and hit Alex');
});

test('bumping into a coworker makes them react', () => {
  const w = makeWorld(hall, { noMonsters: true });
  const dale = npc(w, 'dale');
  const input = mockInput();
  input.hold('forward');
  run(w, input, 1.5);
  assert.ok(w.player.x < dale.x - dale.radius, 'Alex cannot walk through Dale');
  assert.equal(said(w, 'DALE').length, 1, 'one line per bump, then a cooldown');
  assert.equal(dale.state, 'react');
  const bubble = w.things.find((t) => t.def.id === 'bubble-ugh' && !t.removed);
  assert.ok(bubble, 'a speech bubble pops up');
  input.release('forward');
  run(w, input, 2.5);
  assert.ok(bubble.removed, 'and goes away again');
  assert.equal(dale.state, 'idle');
});

test('pressing use on a coworker makes them say something new', () => {
  const w = makeWorld(hall, { noMonsters: true });
  const input = mockInput();
  w.player.x = 3.6;
  input.tap('use');
  run(w, input, 0.1);
  input.tap('use');
  run(w, input, 0.1);
  assert.equal(said(w, 'DALE').length, 1, 'mashing use is ignored during the cooldown');
  run(w, input, 3);
  input.tap('use');
  run(w, input, 0.1);
  const lines = said(w, 'DALE');
  assert.equal(lines.length, 2);
  assert.notEqual(lines[0], lines[1], 'no line twice in a row');
});

// Terry ('8') may wander 4 tiles from (3, 2). A door, a sewage puddle and a
// one-tile passage to a second room are all within reach.
const office = room(
  [
    '#############',
    '#.....#######',
    '#.....D.....#',
    '#.....#######',
    '#~~...#######',
    '###.#########',
    '###.#########',
    '##...########',
    '##...########',
    '#############',
  ],
  ['', '', '   8     <'],
);

test('coworkers stay out of doorways, hazards and narrow passages', () => {
  const w = makeWorld(office, { noMonsters: true });
  const terry = npc(w, 'terry');
  const at = (x, y) => w.map.index(x, y);
  assert.equal(terry.area.size, 17);
  for (const [x, y] of [[3, 2], [1, 1], [5, 1], [5, 4], [3, 4]]) assert.ok(terry.area.has(at(x, y)), `(${x}, ${y}) is fine`);
  for (const [x, y, why] of [[6, 2, 'the door'], [5, 2, 'next to the door'], [1, 4, 'sewage'], [3, 5, 'a narrow passage'], [3, 7, 'past the passage']]) {
    assert.ok(!terry.area.has(at(x, y)), `not ${why}`);
  }
  // A coworker placed in a doorway or corridor just stays put.
  assert.equal(wanderArea(w, { x: 3.5, y: 5.5, def: { wander: 3 } }).size, 0);

  const input = mockInput();
  let far = 0;
  run(w, input, 90, () => {
    assert.ok(terry.area.has(at(Math.floor(terry.x), Math.floor(terry.y))), 'Terry stays inside his area');
    far = Math.max(far, Math.hypot(terry.x - 3.5, terry.y - 2.5));
  });
  assert.ok(far > 0.8, 'and does wander around');
});

test('monsters never go after coworkers', () => {
  const w = makeWorld(room(['#########', '#.......#', '#.......#', '#.......#', '#########'], ['', ' > 0  i', '    2']));
  w.player.player.god = true;
  const monster = w.things.find((t) => t.kind === 'monster');
  run(w, mockInput(), 15, () => assert.notEqual(monster.target?.kind, 'npc'));
  assert.ok(monster.target === w.player, 'the ant went for Alex');
  assert.ok(w.things.filter((t) => t.kind === 'npc').every((t) => !t.dead && !t.removed));
});
