import test from 'node:test';
import assert from 'node:assert/strict';
import palette from '../src/content/palette.js';
import { Palette, NUM_PALETTES, COLORMAP_INVERSE } from '../src/engine/gfx/palette.js';
import { LIGHT_LEVELS } from '../src/engine/config.js';

test('the content palette is 256 colours with the glow range at the end', () => {
  assert.equal(palette.colors.length, 256);
  assert.equal(palette.fullbrightStart, 224);
  assert.deepEqual(palette.colors[0], [0, 0, 0]);
  for (const [name, [start, count]] of Object.entries(palette.ramps)) {
    assert.ok(start >= 1 && start + count <= 255, `ramp ${name} is inside the palette`);
  }
});

test('colormaps darken ramps but leave glowing colours alone', () => {
  const pal = new Palette(palette);
  assert.equal(pal.colormaps.length, (LIGHT_LEVELS + 1) * 256);
  const lum = (i) => pal.rgb[i * 3] * 0.3 + pal.rgb[i * 3 + 1] * 0.59 + pal.rgb[i * 3 + 2] * 0.11;
  const [gray] = palette.ramps.gray;
  const bright = gray + 20;
  let prev = Infinity;
  for (let level = 0; level < LIGHT_LEVELS; level++) {
    const l = lum(pal.colormaps[level * 256 + bright]);
    assert.ok(l <= prev + 1e-6, `level ${level} is not brighter than the one before`);
    prev = l;
  }
  for (let level = 0; level < LIGHT_LEVELS; level++) {
    for (let i = 224; i < 255; i++) assert.equal(pal.colormaps[level * 256 + i], i);
  }
  assert.ok(COLORMAP_INVERSE === LIGHT_LEVELS);
});

test('palette building is deterministic', () => {
  const a = new Palette(palette);
  const b = new Palette(palette);
  assert.deepEqual(a.colormaps, b.colormaps);
  assert.equal(a.palettes.length, NUM_PALETTES);
});
