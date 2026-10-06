// Panoramic skies: 512x128, seamless horizontally. The horizon sits near the bottom.
import { PixelCanvas, mix, darken, lighten } from '../lib/canvas.js';
import { fbm, hash2, rng, seedFrom } from '../lib/noise.js';
import { C, G } from '../lib/pal.js';
import { tinyText } from '../lib/tex.js';

const W = 512;
const H = 128;

function gradient(c, stops, seed) {
  const smog = fbm(seed, W, { cells: 6, octaves: 4, sizeY: H, cellsY: 2 });
  c.each((x, y) => {
    const t = y / (H - 1);
    let k = 0;
    while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [t0, c0] = stops[k];
    const [t1, c1] = stops[k + 1];
    const f = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
    const base = mix(c0, c1, f);
    const s = smog(x, y);
    return s > 0.55 ? lighten(base, (s - 0.55) * 0.5) : darken(base, (0.55 - s) * 0.35);
  });
}

function skyline(c, r, { baseY = 128, minH = 20, maxH = 58 } = {}) {
  let x = 0;
  while (x < W) {
    const bw = r.int(12, 34);
    const bh = r.int(minH, maxH);
    const top = baseY - bh;
    const body = C('navy', r.range(0.02, 0.18));
    for (let yy = top; yy < baseY; yy++) {
      for (let xx = x; xx < x + bw; xx++) c.set(xx % W, yy, body);
    }
    // Roof details.
    if (r.chance(0.4)) {
      const ax = x + r.int(2, bw - 3);
      for (let yy = top - r.int(4, 12); yy < top; yy++) c.set(ax % W, yy, body);
      c.set(ax % W, top - 12, G('red', 1));
    }
    // Lit windows: most offices are dark at 3 AM.
    for (let wy = top + 3; wy < baseY - 2; wy += 3) {
      for (let wx = x + 2; wx < x + bw - 2; wx += 3) {
        const h = hash2(wx, wy, 77);
        if (h > 0.82) c.set(wx % W, wy, h > 0.96 ? G('cyan', 0.5) : G('lamp', h > 0.9 ? 1 : 0.5));
      }
    }
    x += bw + r.int(0, 3);
  }
}

function citySky() {
  const c = new PixelCanvas(W, H);
  const r = rng(seedFrom('sky-city'));
  gradient(
    c,
    [
      [0, C('navy', 0.08)],
      [0.45, C('purple', 0.22)],
      [0.75, C('flesh', 0.3)],
      [1, C('orange', 0.32)],
    ],
    seedFrom('smog'),
  );
  // A sick moon behind the smog.
  c.ellipse(390, 28, 16, 16, mix(C('beige', 0.5), C('purple', 0.3), 0.3));
  c.ellipse(390, 28, 11, 11, C('beige', 0.7));
  c.ellipse(386, 25, 3, 2, C('beige', 0.55));
  c.ellipse(394, 31, 2, 2, C('beige', 0.58));
  for (let i = 0; i < 70; i++) {
    const x = r.int(0, W - 1);
    const y = r.int(0, 50);
    if (Math.hypot(x - 390, y - 28) > 20) c.set(x, y, C('steel', r.range(0.4, 0.7)));
  }
  skyline(c, r, { baseY: 128, minH: 18, maxH: 40 });
  skyline(c, r, { baseY: 128, minH: 8, maxH: 26 });
  // 80s neon billboard.
  const bx = 120;
  const by = 86;
  c.rect(bx, by, 42, 13, C('gray', 0.05));
  tinyText(c, 'COFFEE', bx + 3, by + 3, G('magenta', 0.5));
  c.rect(bx, by, 42, 1, G('cyan', 0.6));
  c.rect(bx, by + 12, 42, 1, G('cyan', 0.6));
  c.rect(bx + 10, by + 13, 1, 10, C('gray', 0.1));
  c.rect(bx + 31, by + 13, 1, 10, C('gray', 0.1));
  const mx = 300;
  c.rect(mx, 92, 34, 9, C('gray', 0.04));
  tinyText(c, 'OPEN 24', mx + 2, 94, G('red', 1));
  return c;
}

function hellSky() {
  const c = new PixelCanvas(W, H);
  const r = rng(seedFrom('sky-hell'));
  gradient(
    c,
    [
      [0, C('blood', 0.06)],
      [0.4, C('blood', 0.2)],
      [0.75, C('orange', 0.28)],
      [1, C('orange', 0.5)],
    ],
    seedFrom('hellsmoke'),
  );
  // A giant jack-o'-lantern hanging in the sky like a harvest moon, grinning.
  const cx = 256;
  const cy = 42;
  for (const [dx, rx, t] of [[-17, 15, 0.42], [17, 15, 0.38], [-8, 17, 0.52], [8, 17, 0.48], [0, 15, 0.58]]) c.ellipse(cx + dx, cy, rx, 24, C('orange', t));
  for (const dx of [-12, 0, 12]) c.capsule(cx + dx, cy - 20, cx + dx * 1.2, cy + 20, 0.6, C('orange', 0.3));
  c.capsule(cx + 1, cy - 22, cx + 5, cy - 31, 2.4, C('olive', 0.3), 1.6);
  // Carved eyes and a jagged grin, lit from inside.
  const carved = G('yellow', 0.75);
  c.poly([[cx - 16, cy - 2], [cx - 5, cy - 2], [cx - 9, cy - 12]], carved);
  c.poly([[cx + 5, cy - 2], [cx + 16, cy - 2], [cx + 9, cy - 12]], carved);
  c.poly([[cx - 18, cy + 6], [cx - 12, cy + 9], [cx - 8, cy + 6], [cx - 3, cy + 10], [cx + 3, cy + 6], [cx + 8, cy + 10], [cx + 12, cy + 6], [cx + 18, cy + 6], [cx + 12, cy + 15], [cx - 12, cy + 15]], carved);
  // Embers.
  for (let i = 0; i < 90; i++) {
    c.set(r.int(0, W - 1), r.int(20, 110), r.chance(0.6) ? G('yellow', r.range(0, 0.4)) : G('red', 0.6));
  }
  // Mountains of garbage with fires.
  const n = fbm(seedFrom('heaps'), W, { cells: 10, octaves: 4, sizeY: 1, cellsY: 1 });
  for (let x = 0; x < W; x++) {
    const top = 84 + Math.floor(n(x, 0) * 34) - 10;
    for (let y = top; y < H; y++) {
      const junk = hash2(x >> 1, y >> 1, 5);
      c.set(x, y, junk > 0.85 ? C('rust', 0.15) : junk > 0.7 ? C('olive', 0.08) : C('gray', 0.04));
    }
    if (hash2(x, 3, 9) > 0.985) {
      for (let k = 0; k < 6; k++) c.set(x + r.int(-1, 1), top - k, G('yellow', r.range(0, 0.5)));
    }
  }
  return c;
}

export default [
  { name: 'sky-city', out: 'assets/textures/sky-city.png', draw: citySky, dither: 12 },
  { name: 'sky-hell', out: 'assets/textures/sky-hell.png', draw: hellSky, dither: 12 },
];
