import test from 'node:test';
import assert from 'node:assert/strict';
import { FlowField, UNREACHABLE } from '../src/engine/world/nav.js';
import { buildLevel } from '../src/engine/world/level.js';
import { registry, room } from './helpers.js';

test('the flow field routes around walls and respects locks', () => {
  const level = room(
    ['#########', '#...#...#', '#.#.#.#.#', '#.#...#.#', '#########', '#...1...#', '#########'],
    ['', ' ^'],
  );
  const { map } = buildLevel(registry, level, {});
  const nav = new FlowField(map);
  nav.update(1, 1, true);
  const d = (x, y) => nav.dist[y * map.w + x];
  assert.equal(d(1, 1), 0);
  assert.equal(d(3, 1), 2);
  assert.equal(d(5, 1), 8, 'has to go down and around the middle walls');
  assert.equal(d(7, 3), 12);
  nav.update(1, 5, true);
  assert.equal(d(7, 5), UNREACHABLE, 'the blue door is locked for monsters');
});
