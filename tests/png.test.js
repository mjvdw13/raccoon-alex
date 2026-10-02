import test from 'node:test';
import assert from 'node:assert/strict';
import { encodePNG, decodePNG, readPNGSize } from '../tools/art/lib/png.js';

test('the art toolchain PNG encoder round-trips', () => {
  const w = 7;
  const h = 5;
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < rgba.length; i++) rgba[i] = (i * 37) & 255;
  const png = encodePNG(w, h, rgba);
  assert.deepEqual(readPNGSize(Buffer.from(png)), { width: w, height: h });
  const back = decodePNG(Buffer.from(png));
  assert.equal(back.width, w);
  assert.deepEqual([...back.data], [...rgba]);
});
