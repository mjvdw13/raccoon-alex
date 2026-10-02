// Full-screen pictures (320x200): the title screen, the intermission map,
// the finale text backdrop and the end picture. Painted with the same clay
// renderer as the sprites, then dithered into the palette.
import { PixelCanvas, mix, darken, lighten } from '../lib/canvas.js';
import { C, G } from '../lib/pal.js';
import { Model, MAT } from '../lib/model.js';
import { fbm, hash2, rng, seedFrom, valueNoise } from '../lib/noise.js';
import { tinyText, tinyTextWidth } from '../lib/tex.js';
import { box, cylinder, ellipse } from '../lib/props.js';
import { smallGlyphs } from './fonts.js';
import { alexPortrait } from './face.js';
import { clockModel } from '../sprites/creatures.js';
import { fireBlob, FIRE } from '../sprites/fx.js';

const W = 320;
const H = 200;
const U = (name) => `assets/ui/${name}.png`;

/** Where the portrait sits on the title (keep in sync with titlePortrait in src/content/config.js). */
export const PORTRAIT = { x: 22, y: 64, w: 72, h: 90 };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const norm3 = (x, y, z) => {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
};

/** Colour at t along [[t, rgb], ...] stops. */
function ramp(stops, t) {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i];
    if (t <= t1) {
      const [t0, c0] = stops[i - 1];
      return mix(c0, c1, (t - t0) / (t1 - t0 || 1));
    }
  }
  return stops[stops.length - 1][1];
}

/** Blend a colour into an existing pixel. */
function blend(c, x, y, col, a) {
  const p = c.get(x, y);
  if (!p || a <= 0) return;
  c.set(x, y, mix(p, col, clamp(a, 0, 1)));
}

/** Soft radial glow added over what is already painted. */
function glow(c, cx, cy, r, col, strength = 0.5) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) {
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
      if (d < 1) blend(c, x, y, col, (1 - d) * (1 - d) * strength);
    }
  }
}

/** Text in the game's small 5x7 font. */
function smallText(c, text, x, y, col, { shadow, align = 'left' } = {}) {
  const glyphs = smallGlyphs();
  const width = text.length * 6 - 1;
  const x0 = align === 'center' ? Math.round(x - width / 2) : x;
  [...text].forEach((ch, i) => {
    const rows = glyphs.get(ch);
    if (!rows) return;
    rows.forEach((row, gy) => {
      for (let gx = 0; gx < 5; gx++) {
        if (row[gx] !== '#') continue;
        if (shadow) c.set(x0 + i * 6 + gx + 1, y + gy + 1, shadow);
        c.set(x0 + i * 6 + gx, y + gy, typeof col === 'function' ? col(gy / 6) : col);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Chrome logo: font glyphs scaled up, smoothed, bevelled with a distance field
// and shaded with an 80s sky-over-sunset reflection, then dirtied up.

function textMask(text, scale) {
  const glyphs = smallGlyphs();
  const adv = 6 * scale;
  const w = text.length * adv - scale;
  const h = 7 * scale;
  const m = new Float32Array(w * h);
  [...text].forEach((ch, i) => {
    const rows = glyphs.get(ch);
    rows?.forEach((row, gy) => {
      for (let gx = 0; gx < 5; gx++) {
        if (row[gx] !== '#') continue;
        for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) m[(gy * scale + sy) * w + i * adv + gx * scale + sx] = 1;
      }
    });
  });
  return { w, h, m };
}

function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += src[y * w + clamp(x + k, 0, w - 1)];
      tmp[y * w + x] = s / (2 * r + 1);
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += tmp[clamp(y + k, 0, h - 1) * w + x];
      out[y * w + x] = s / (2 * r + 1);
    }
  }
  return out;
}

function dilate(src, w, h, r) {
  const out = new Float32Array(w * h);
  const R = Math.ceil(r);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let dy = -R; dy <= R && v < 1; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          if (dx * dx + dy * dy > r * r) continue;
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h && src[yy * w + xx] > v) v = src[yy * w + xx];
        }
      }
      out[y * w + x] = v;
    }
  }
  return out;
}

/** Chamfer distance from each inside pixel to the outside. */
function insideDistance(mask, w, h) {
  const d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = mask[i] ? 1e9 : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (d[i]) d[i] = Math.min(d[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.414, at(x + 1, y - 1) + 1.414);
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (d[i]) d[i] = Math.min(d[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.414, at(x - 1, y + 1) + 1.414);
    }
  }
  return d;
}

const CHROME = [
  [0, [236, 240, 252]],
  [0.25, [168, 186, 220]],
  [0.48, [76, 88, 124]],
  [0.5, [30, 16, 12]],
  [0.6, [104, 34, 10]],
  [0.82, [206, 96, 24]],
  [1, [255, 200, 110]],
];

export function chromeLogo(text, scale, { bevel = 3.4, extrude = 5, seed = 7, stops = CHROME, bold = 1.2 } = {}) {
  const pad = extrude + 3;
  const t = textMask(text, scale);
  const w = t.w + pad * 2;
  const h = t.h + pad * 2;
  let f = new Float32Array(w * h);
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) f[(y + pad) * w + x + pad] = t.m[y * t.w + x];
  // Embolden (joins the diagonal staircases), then round the corners off.
  f = dilate(f, w, h, bold);
  f = boxBlur(boxBlur(f, w, h, 1), w, h, 1);
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = f[i] > 0.5 ? 1 : 0;
  const dist = insideDistance(mask, w, h);
  const hgt = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : Math.min(1, dist[y * w + x] / bevel));
  const c = new PixelCanvas(w, h);
  // Extruded sides, falling away down and to the right.
  for (let e = extrude; e >= 1; e--) {
    const k = 1 - e / extrude;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) c.set(x + e, y + e, mix(C('blood', 0.1), C('blood', 0.42), k));
  }
  const noise = valueNoise(seed, 4096, 4096);
  const rr = rng(seed);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      const gx = hgt(x + 1, y) - hgt(x - 1, y);
      const gy = hgt(x, y + 1) - hgt(x, y - 1);
      const [nx, ny] = norm3(-gx * 1.7, -gy * 1.7, 1);
      const ty = (y - pad) / t.h;
      // Reflection: flat faces show the horizon, bevels tilt it.
      let col = ramp(stops, clamp(ty * 0.9 + 0.05 + ny * 0.6 + nx * 0.12, 0, 1));
      const lit = clamp(1 + (-nx * 0.35 - ny * 0.45), 0.55, 1.25);
      col = col.map((v) => Math.min(255, v * lit));
      // Grime and rust creeping up from the bottom.
      const g = noise(x * 0.3, y * 0.3);
      col = mix(col, C('rust', 0.22), clamp((g - 0.45) * 2.2, 0, 0.75) * (0.25 + ty * 0.75));
      if (hash2(x, y, seed) > 0.97) col = darken(col, 0.35);
      c.set(x, y, col);
    }
  }
  // Scratches across the faces.
  for (let i = 0; i < text.length * 4; i++) {
    const x0 = rr.range(pad, w - pad);
    const y0 = rr.range(pad, h - pad);
    const len = rr.range(3, scale * 3);
    const a = rr.range(-0.5, 0.5) + (rr.chance(0.5) ? 0 : Math.PI / 2);
    for (let k = 0; k < len; k++) {
      const x = Math.round(x0 + Math.cos(a) * k);
      const y = Math.round(y0 + Math.sin(a) * k);
      if (mask[y * w + x]) c.set(x, y, mix(c.get(x, y), k % 3 ? [250, 250, 255] : [20, 12, 10], 0.45));
    }
  }
  c.outline([6, 2, 2]);
  // Star glints on a few top-left corners.
  const corners = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (mask[y * w + x] && !mask[(y - 1) * w + x] && !mask[y * w + x - 1] && hash2(x, y, seed + 3) > 0.9) corners.push([x, y]);
    }
  }
  for (const [x, y] of corners.slice(0, 4)) glint(c, x + 1, y + 1, 3);
  return c;
}

function glint(c, x, y, len) {
  c.set(x, y, [255, 255, 255]);
  for (let k = 1; k <= len; k++) {
    const col = k === 1 ? G('pale', 1) : G('yellow', 0.8);
    for (const [dx, dy] of [[k, 0], [-k, 0], [0, k], [0, -k]]) if (c.opaque(x + dx, y + dy) || k === 1) c.set(x + dx, y + dy, col);
  }
}

// ---------------------------------------------------------------------------
// Scenery pieces.

function nightSky(c, seed, horizon = 160) {
  const clouds = fbm(seed, 128, { cells: 5, octaves: 4 });
  const r = rng(seed);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = y / horizon;
      let col = ramp([[0, [6, 6, 16]], [0.5, [18, 12, 34]], [0.85, [52, 18, 34]], [1, [96, 34, 30]]], t);
      // Smog bands lit from below by the city.
      const n = clouds((x * 0.6) % 128, (y * 1.6) % 128);
      const band = clamp((n - 0.5) * 3, 0, 1) * clamp(t * 1.2, 0, 1);
      col = mix(col, mix([40, 20, 40], [120, 50, 40], t), band * 0.6);
      c.set(x, y, col);
    }
  }
  for (let i = 0; i < 90; i++) {
    const x = r.int(0, W - 1);
    const y = r.int(0, horizon * 0.55);
    blend(c, x, y, [200, 200, 230], r.range(0.25, 0.8));
  }
}

function skyline(c, seed, { base = 200, x0 = 0, x1 = W, minH = 30, maxH = 90 } = {}) {
  const r = rng(seed);
  let x = x0 - r.int(0, 10);
  while (x < x1) {
    const bw = r.int(16, 34);
    const bh = r.int(minH, maxH);
    const top = base - bh;
    const body = mix([8, 8, 14], [16, 14, 24], r());
    for (let y = top; y < base; y++) for (let xx = x; xx < x + bw; xx++) c.set(xx, y, mix(body, [40, 20, 26], ((y - top) / bh) * 0.25));
    for (let xx = x; xx < x + bw; xx++) c.set(xx, top, lighten(body, 0.08));
    if (r.chance(0.35)) {
      // Antenna with a red aircraft light.
      const ax = x + r.int(3, bw - 4);
      for (let y = top - 9; y < top; y++) c.set(ax, y, [24, 22, 30]);
      c.set(ax, top - 10, G('red', 1));
      glow(c, ax, top - 10, 4, [255, 40, 30], 0.5);
    }
    // Windows: mostly dark, a few people still working.
    for (let wy = top + 4; wy < base - 4; wy += 4) {
      for (let wx = x + 2; wx < x + bw - 2; wx += 3) {
        const lit = hash2(wx, wy, seed);
        if (lit > 0.9) c.set(wx, wy, lit > 0.97 ? G('lamp', 1) : C('yellow', 0.45));
        else if (lit > 0.75) c.set(wx, wy, [26, 24, 40]);
      }
    }
    x += bw + r.int(-4, 3);
  }
}

function trashHeap(c, seed, { top = 176, amp = 10 } = {}) {
  const n = fbm(seed, 128, { cells: 6, octaves: 4 });
  for (let x = 0; x < W; x++) {
    const hy = top + Math.round((n(x % 128, 7) - 0.5) * amp * 2 + Math.sin(x * 0.02) * amp * 0.5);
    for (let y = hy; y < H; y++) {
      const v = n(x % 128, (y * 3) % 128);
      let col = mix([10, 8, 8], [32, 24, 18], v);
      if (y === hy) col = lighten(col, 0.12);
      if (hash2(x, y, seed) > 0.985) col = C('rust', 0.3);
      c.set(x, y, col);
    }
  }
}

function fire(c, x, y, size, seed) {
  glow(c, x, y - size * 0.6, size * 3.2, [255, 110, 30], 0.45);
  const f = new PixelCanvas(size * 4, size * 5);
  fireBlob(f, size * 2, size * 3, size, seed, FIRE, { holes: 0.15 });
  // Stretch upward: re-blit with rows sampled so flames lick upward.
  const out = new PixelCanvas(size * 4, size * 5);
  for (let yy = 0; yy < size * 5; yy++) {
    for (let xx = 0; xx < size * 4; xx++) {
      const sy = Math.round(size * 3 + (yy - size * 3) * (yy < size * 3 ? 0.6 : 1));
      const p = f.get(xx, sy);
      if (p) out.set(xx, yy, p);
    }
  }
  c.blit(out, Math.round(x - size * 2), Math.round(y - size * 4));
}

function smokeColumn(c, x, y, height, seed) {
  const n = fbm(seed, 64, { cells: 4, octaves: 3 });
  for (let yy = 0; yy < height; yy++) {
    const t = yy / height;
    const cx = x + Math.sin(yy * 0.08 + seed) * (3 + t * 10) + t * 14;
    const rw = 3 + t * 12;
    for (let xx = Math.floor(cx - rw); xx <= cx + rw; xx++) {
      const d = Math.abs(xx - cx) / rw;
      const v = n(((xx % 64) + 64) % 64, (yy * 2) % 64);
      const a = (1 - d) * (1 - t) * 0.55 * clamp(v * 1.6 - 0.3, 0, 1);
      blend(c, xx, y - yy, [30, 26, 30], a);
    }
  }
}

// ---------------------------------------------------------------------------
// Title screen.

function idBadge(c, x, y, w, h) {
  const m = new Model(W, H, { seed: 77 });
  const rounded = (x0, y0, x1, y1, rad) => {
    const pts = [];
    const corner = (cx, cy, a0) => {
      for (let k = 0; k <= 4; k++) {
        const a = a0 + (k / 4) * (Math.PI / 2);
        pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
      }
    };
    corner(x1 - rad, y0 + rad, -Math.PI / 2);
    corner(x1 - rad, y1 - rad, 0);
    corner(x0 + rad, y1 - rad, Math.PI / 2);
    corner(x0 + rad, y0 + rad, Math.PI);
    return pts;
  };
  const card = { ...MAT.plastic, spec: 0.5, shine: 30, grain: 0.03 };
  m.slab(rounded(x, y, x + w, y + h, 5), 4, C('beige', 0.86), card, { bevel: 2.5, thickness: 1.5 });
  // Red header band.
  m.paintPoly([[x, y], [x + w, y], [x + w, y + 13], [x, y + 13]], C('blood', 0.42));
  // Slot punched for the clip, and the clip itself.
  const cx = x + w / 2;
  m.dent(cx, y + 4, 6, 1.6, 2);
  m.paint(cx, y + 4, 5.5, 1.2, C('gray', 0.05));
  m.slab([[cx - 5, y - 9], [cx + 5, y - 9], [cx + 5, y + 4], [cx - 5, y + 4]], 7, C('steel', 0.55), MAT.metal, { bevel: 1.5, thickness: 1.5 });
  m.capsule(cx, y - 14, 6, cx, y - 9, 6, 2.2, 2.2, C('steel', 0.5), MAT.metal);
  m.paint(cx, y - 3, 3, 1.5, C('steel', 0.3));
  // Grime: thumb smudges, a coffee ring, scratches in the laminate.
  m.tint((px, py, col) => {
    const d = Math.hypot(px - (x + w - 16), py - (y + h - 18));
    if (Math.abs(d - 11) < 1.2) return mix(col, C('rust', 0.4), 0.55);
    if (d < 10) return mix(col, C('rust', 0.55), 0.12);
    return hash2(px, py, 9) > 0.992 ? darken(col, 0.3) : undefined;
  });
  const out = m.render({ light: [-0.4, -0.55, 0.75], ambient: 0.5, aoStrength: 0.3 });
  c.blit(out, 0, 0);
  tinyText(c, 'NIGHT SHIFT', Math.round(cx - tinyTextWidth('NIGHT SHIFT') / 2), y + 5, C('beige', 0.95));
  // Photo backdrop (a custom photo is drawn over this whole slot by the game).
  const { x: px, y: py, w: pw, h: ph } = PORTRAIT;
  const n = fbm(55, 128, { cells: 3, octaves: 3 });
  for (let yy = 0; yy < ph; yy++) {
    for (let xx = 0; xx < pw; xx++) c.set(px + xx, py + yy, mix([54, 70, 100], [92, 110, 140], n(xx, yy) * 0.6 + (1 - yy / ph) * 0.4));
  }
  c.blit(alexPortrait(), px, py);
  c.frame(px - 1, py - 1, pw + 2, ph + 2, C('gray', 0.3));
  smallText(c, 'ALEX', cx, py + ph + 3, C('gray', 0.08), { align: 'center' });
  tinyText(c, 'EMPLOYEE NO. 0072', Math.round(cx - tinyTextWidth('EMPLOYEE NO. 0072') / 2), py + ph + 12, C('gray', 0.25));
  // Barcode.
  const br = rng(72);
  let bx = x + 12;
  while (bx < x + w - 12) {
    const bw = br.chance(0.3) ? 2 : 1;
    for (let yy = 0; yy < 5; yy++) for (let k = 0; k < bw; k++) c.set(bx + k, y + h - 9 + yy, C('gray', 0.1));
    bx += bw + br.int(1, 2);
  }
}

function alarmMoon(c, cx, cy, r) {
  glow(c, cx, cy, r * 2.1, [150, 20, 20], 0.55);
  const size = Math.ceil(r * 3.4);
  const m = new Model(size, size, { seed: 501 });
  clockModel(m, size / 2, size / 2 + r * 0.45, r, { noLegs: true, mouth: 0.55, unit: r / 14, caseColor: C('blood', 0.4), crack: true });
  const img = m.render({ light: [-0.3, 0.5, 0.8], ambient: 0.22, aoStrength: 0.45, bounce: 0 });
  // Dim it into the haze: the King is far away and huge.
  img.eachOpaque((x, y, p) => mix(p, [70, 20, 30], 0.35));
  c.blit(img, Math.round(cx - size / 2), Math.round(cy - size / 2 - r * 0.45));
  // The eyes glow through the haze.
  for (const side of [-1, 1]) glow(c, cx + side * r * 0.3, cy - r * 0.3, r * 0.35, [255, 40, 20], 0.6);
}

function title() {
  const c = new PixelCanvas(W, H);
  const seed = seedFrom('title');
  nightSky(c, seed, 165);
  alarmMoon(c, 236, 104, 46);
  skyline(c, seed + 1, { base: 200, minH: 24, maxH: 62 });
  skyline(c, seed + 2, { base: 200, x0: 140, minH: 14, maxH: 36 });
  smokeColumn(c, 290, 186, 90, 11);
  smokeColumn(c, 150, 190, 70, 12);
  trashHeap(c, seed + 3, { top: 182, amp: 7 });
  fire(c, 292, 186, 4, 21);
  fire(c, 150, 190, 3, 22);
  fire(c, 214, 192, 2, 23);
  idBadge(c, 12, 48, 92, 132);
  const logo = chromeLogo('RACCOON ALEX', 4, { seed: 9 });
  c.blit(logo, Math.round((W - logo.w) / 2), 1);
  const sub = 'KNEE-DEEP IN THE DEADLINE';
  smallText(c, sub, 212, 44, (t) => mix(G('yellow', 0.3), C('blood', 0.7), t), { align: 'center', shadow: [0, 0, 0] });
  return c;
}

// ---------------------------------------------------------------------------
// Intermission: a coffee-stained evacuation plan of the building, sliced from
// the roof down to the landfill under the sewers.

/** Map spots for each level on the intermission picture (used by the episode def). */
export const MAP_SPOTS = { e1m1: [82, 34], e1m2: [234, 70], e1m3: [92, 108], e1m4: [212, 142], e1m5: [146, 180] };

function intermission() {
  const c = new PixelCanvas(W, H);
  const seed = seedFrom('intermission');
  const paper = fbm(seed, 128, { cells: 4, octaves: 4 });
  const base = [16, 24, 46];
  c.each((x, y) => {
    let col = mix(base, [26, 36, 64], paper(x % 128, y % 128));
    if (x % 8 === 0 || y % 8 === 0) col = mix(col, [44, 60, 96], 0.35);
    if (x % 32 === 0 || y % 32 === 0) col = mix(col, [60, 80, 120], 0.35);
    return col;
  });
  const ink = [104, 136, 186];
  const faint = [70, 92, 136];
  const line = (x0, y0, x1, y1, col = ink) => c.line(x0, y0, x1, y1, col);
  const rect = (x, y, w, h, col = ink) => c.frame(x, y, w, h, col);
  // Ground level and the office tower.
  line(0, 56, W - 1, 56);
  rect(40, 4, 110, 52);
  for (let y = 12; y < 56; y += 9) line(41, y, 148, y, faint);
  for (let y = 7; y < 54; y += 9) for (let x = 46; x < 146; x += 8) c.frame(x, y, 4, 3, faint);
  rect(170, 22, 60, 34);
  for (let y = 28; y < 56; y += 9) for (let x = 174; x < 226; x += 8) c.frame(x, y, 4, 3, faint);
  // Server room: rack rows.
  rect(180, 60, 110, 26);
  for (let x = 188; x < 286; x += 12) rect(x, 64, 6, 19, faint);
  // Elevator shaft linking it all.
  rect(152, 4, 12, 118, faint);
  for (let y = 8; y < 120; y += 6) line(154, y, 162, y, faint);
  // Sub-basement: boiler, pipes, parking.
  rect(20, 92, 130, 30);
  c.ring(52, 107, 10, 1, faint);
  for (let x = 74; x < 146; x += 16) rect(x, 110, 12, 6, faint);
  line(20, 98, 150, 98, faint);
  // Sewers: a round tunnel with water.
  c.ring(212, 142, 26, 1, ink);
  line(188, 150, 236, 150, [70, 130, 120]);
  line(150, 142, 186, 142, faint);
  line(238, 142, 300, 142, faint);
  // The landfill under it all: a jagged cave.
  const r = rng(seed);
  let px = 60;
  let py = 170;
  for (let x = 66; x < 260; x += 6) {
    const ny = 166 + r.int(-6, 6);
    line(px, py, x, ny, [150, 70, 70]);
    px = x;
    py = ny;
  }
  line(60, 170, 60, 196, [150, 70, 70]);
  line(px, py, px, 196, [150, 70, 70]);
  line(60, 196, px, 196, [150, 70, 70]);
  // Stamps, notes and grime.
  tinyText(c, 'EVACUATION PLAN - FLOOR B', 6, 190, faint);
  tinyText(c, 'NO EXIT', 266, 190, [150, 70, 70]);
  for (let i = 0; i < 3; i++) {
    const cx = r.int(30, 290);
    const cy = r.int(20, 180);
    const rad = r.int(9, 14);
    for (let y = cy - rad; y <= cy + rad; y++) {
      for (let x = cx - rad; x <= cx + rad; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (Math.abs(d - rad + 1) < 1.3) blend(c, x, y, [90, 60, 40], 0.5);
        else if (d < rad - 1) blend(c, x, y, [70, 50, 40], 0.12);
      }
    }
  }
  // Tape on the corners.
  for (const [x, y] of [[0, 0], [W - 18, 0], [0, H - 10], [W - 18, H - 10]]) {
    for (let yy = 0; yy < 10; yy++) for (let xx = 0; xx < 18; xx++) blend(c, x + xx, y + yy, [200, 190, 150], 0.55);
  }
  // Age the paper: dark blotches, creases, and a dim middle for the tally text.
  const blot = fbm(seed + 5, 64, { cells: 3, octaves: 3 });
  c.eachOpaque((x, y, p) => {
    let col = mix(p, [8, 10, 20], 0.45 * (1 - Math.min(1, Math.hypot((x - 160) / 170, (y - 100) / 110))));
    col = mix(col, [10, 10, 16], clamp((blot(x % 64, y % 64) - 0.5) * 1.6, 0, 0.5));
    if (x === 107 || y === 99) col = mix(col, [4, 6, 12], 0.45);
    if (x === 108 || y === 100) col = mix(col, [70, 90, 130], 0.2);
    return col;
  });
  return c;
}

// ---------------------------------------------------------------------------
// Finale: dark backdrop for the text crawl, and the end picture.

function finaleBackdrop() {
  const c = new PixelCanvas(W, H);
  const seed = seedFrom('finale-bg');
  const n = fbm(seed, 128, { cells: 6, octaves: 5 });
  const cells = fbm(seed + 1, 64, { cells: 8, octaves: 2 });
  c.each((x, y) => {
    const v = n(x % 128, y % 128);
    const k = cells(x % 64, y % 64);
    let col = mix([12, 12, 10], [36, 30, 22], v);
    col = mix(col, [26, 32, 18], clamp((k - 0.55) * 3, 0, 0.6));
    if (hash2(x, y, seed) > 0.97) col = lighten(col, 0.08);
    const vig = Math.hypot((x - 160) / 180, (y - 100) / 120);
    return darken(col, clamp(vig - 0.4, 0, 0.6));
  });
  return c;
}

function finaleEnd() {
  const c = new PixelCanvas(W, H);
  const seed = seedFrom('finale-end');
  const wall = fbm(seed, 128, { cells: 4, octaves: 4 });
  // Dark office wall, dawn light leaking through the blinds.
  c.each((x, y) => mix([16, 14, 20], [30, 26, 34], wall(x % 128, y % 128)));
  const win = { x: 196, y: 8, w: 104, h: 88 };
  for (let y = win.y; y < win.y + win.h; y++) {
    const slat = (y - win.y) % 6;
    for (let x = win.x; x < win.x + win.w; x++) {
      const t = (y - win.y) / win.h;
      const dawn = ramp([[0, [255, 150, 120]], [0.5, [255, 186, 120]], [1, [255, 214, 150]]], t);
      c.set(x, y, slat < 2 ? mix([40, 30, 40], [90, 70, 70], t) : mix(dawn, [140, 70, 80], (x - win.x) / win.w * 0.4));
    }
  }
  c.frame(win.x - 2, win.y - 2, win.w + 4, win.h + 4, [44, 40, 46]);
  c.frame(win.x - 1, win.y - 1, win.w + 2, win.h + 2, [20, 18, 22]);
  // Light stripes falling across the wall and desk.
  for (let y = 40; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x - (196 - (y - 40) * 0.9);
      if (u < -120 || u > 30 || x >= win.x - 3 && y < win.y + win.h + 3) continue;
      if (Math.floor((y + x * 0.35) / 6) % 2 === 0) blend(c, x, y, [255, 170, 120], 0.12 * (1 - Math.abs(u + 45) / 80));
    }
  }

  const m = new Model(W, H, { seed: 900 });
  // Desk top (seen from slightly above) and front edge.
  m.slab([[0, 128], [W, 118], [W, 168], [0, 176]], 0, C('rust', 0.32), MAT.wood, { bevel: 2, thickness: 1, tilt: [0, -1.4] });
  m.slab([[0, 176], [W, 168], [W, H], [0, H]], 2, C('rust', 0.2), MAT.wood, { bevel: 1.5, thickness: 1 });
  // CRT monitor on the left, screen still glowing.
  box(m, 18, 50, 76, 64, 10, C('beige', 0.55), MAT.plastic, { z: 10, bevel: 3 });
  m.slab([[26, 58], [86, 58], [86, 104], [26, 104]], 12, C('gray', 0.1), MAT.glass, { bevel: 3, thickness: 2 });
  box(m, 40, 114, 32, 10, 3, C('beige', 0.5), MAT.plastic, { z: 8 });
  // Keyboard pushed aside.
  m.slab([[14, 150], [70, 146], [74, 158], [16, 163]], 6, C('beige', 0.5), MAT.plastic, { bevel: 1.5, thickness: 1.5, tilt: [0, -1] });
  // Alex: face-down on his folded arms.
  const SHIRT = C('steel', 0.7);
  const HAIR = C('rust', 0.15);
  const SKIN = C('skin', 0.62);
  m.ellipsoid(160, 98, 0, 54, 24, 24, darken(SHIRT, 0.1), MAT.cloth); // hunched back
  m.ellipsoid(118, 110, 6, 24, 17, 18, SHIRT, MAT.cloth); // shoulders
  m.ellipsoid(202, 110, 6, 24, 17, 18, SHIRT, MAT.cloth);
  m.capsule(108, 116, 10, 98, 142, 16, 12, 11, SHIRT, MAT.cloth); // upper arms
  m.capsule(212, 116, 10, 222, 142, 16, 12, 11, SHIRT, MAT.cloth);
  m.capsule(98, 145, 20, 178, 151, 24, 10.5, 9, SHIRT, MAT.cloth); // folded forearms
  m.capsule(222, 145, 20, 142, 151, 24, 10.5, 9, SHIRT, MAT.cloth);
  m.ellipsoid(184, 152, 26, 7, 5, 5, SKIN, MAT.skin); // hands poking out
  m.ellipsoid(136, 152, 26, 7, 5, 5, SKIN, MAT.skin);
  m.ellipsoid(138, 130, 26, 4.5, 6.5, 4, SKIN, MAT.skin); // ears
  m.ellipsoid(182, 130, 26, 4.5, 6.5, 4, SKIN, MAT.skin);
  m.ellipsoid(160, 128, 28, 23, 19, 20, HAIR, MAT.hair); // back of the head
  for (let k = 0; k < 12; k++) {
    const a = -2.7 + k * 0.2;
    const len = 6 + ((k * 7) % 5);
    const x0 = 160 + Math.cos(a) * 15;
    const y0 = 126 + Math.sin(a) * 12;
    m.capsule(x0, y0, 44, x0 + Math.cos(a) * len, y0 + Math.sin(a) * len, 40, 3.5, 1.2, HAIR, MAT.hair);
  }
  // A small puddle of drool on the sleeve.
  m.paint(150, 149, 5, 1.5, lighten(SHIRT, 0.25), MAT.glass);
  // Coffee: a full cup and a knocked-over one.
  cylinder(m, 246, 120, 142, 10, C('gray', 0.85), MAT.plastic, { z: 18, open: true, inside: C('rust', 0.12) });
  m.capsule(270, 150, 14, 292, 156, 14, 7, 6.5, C('blood', 0.4), MAT.plastic);
  m.slab(ellipse(282, 162, 18, 4), 6, C('rust', 0.14), MAT.glass, { bevel: 2, thickness: 0.5, tilt: [0, -2] });
  // Report pages and the phone, buzzing.
  m.slab([[52, 160], [104, 156], [108, 172], [54, 177]], 8, C('beige', 0.9), MAT.paper, { bevel: 1, thickness: 0.4, tilt: [0, -1.2] });
  m.slab([[214, 158], [244, 155], [246, 176], [216, 179]], 10, C('gray', 0.12), MAT.plastic, { bevel: 2, thickness: 1.5, tilt: [0, -1.2] });
  m.slab([[218, 160], [241, 158], [242, 174], [219, 176]], 12, G('cyan', 0.6), MAT.glow, { bevel: 0, thickness: 0 });
  // A little alarm clock on the shelf, watching.
  m.slab([[0, 34], [70, 34], [70, 38], [0, 38]], 4, C('rust', 0.25), MAT.wood, { bevel: 1, thickness: 1 });
  clockModel(m, 50, 24, 8, { mouth: 0.4, unit: 0.6 });
  const out = m.render({ light: [0.65, -0.35, 0.65], ambient: 0.3, aoStrength: 0.5 });
  c.blit(out, 0, 0);
  // Screen contents: the finished report.
  for (let y = 62; y < 100; y += 4) {
    const len = 20 + (hash2(y, 1, 3) * 34) | 0;
    for (let x = 32; x < 32 + len; x++) if (hash2(x, y, 4) > 0.2) c.set(x, y, G('green', 0.65));
  }
  tinyText(c, 'Q3 REPORT', 34, 60 - 1, G('green', 1));
  glow(c, 56, 81, 46, [60, 200, 90], 0.12);
  // The phone: 7:00, ALARM.
  tinyText(c, '7:00', 222, 163, [255, 255, 255]);
  tinyText(c, 'AM', 232, 169, G('cyan', 1));
  glow(c, 230, 167, 24, [60, 200, 255], 0.25);
  for (const [x, y, d] of [[210, 160, -1], [250, 158, 1], [208, 172, -1], [252, 170, 1]]) {
    c.line(x, y, x + d * 4, y - 2, G('yellow', 0.7));
  }
  // Zzz drifting up from Alex.
  const zs = [[178, 78, 1], [188, 62, 2], [204, 40, 3]];
  for (const [x, y, s] of zs) tinyText(c, 'Z', x, y, C('beige', 0.75), { scale: s });
  return c;
}

export default [
  { name: 'title', out: U('title'), draw: title, dither: 'fs' },
  { name: 'intermission', out: U('intermission'), draw: intermission, dither: 'fs' },
  { name: 'finale-bg', out: U('finale-bg'), draw: finaleBackdrop, dither: 'fs' },
  { name: 'finale-end', out: U('finale-end'), draw: finaleEnd, dither: 'fs' },
];
