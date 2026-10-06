#!/usr/bin/env node
// Generates the built-in RACCOON ALEX art as PNG files in assets/.
//
//   node tools/art/generate.mjs                 regenerate everything
//   node tools/art/generate.mjs --only carpet   only assets whose name contains "carpet"
//   node tools/art/generate.mjs --list          list asset names
//   node tools/art/generate.mjs --preview       also write 4x previews to tools/art/out/
//
// Each module in tools/art/{textures,sprites,ui}/ exports an array of
// { name, out, draw(): PixelCanvas, dither? } descriptors. Output is snapped to
// the game palette, so what you see in the PNG is what you get in the game.
// NOTE: this overwrites the PNGs it owns. If you hand-edit one of them, don't
// regenerate it (use --only to target other assets).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { encodePNG } from './lib/png.js';
import { quantize } from './lib/pal.js';
import { PixelCanvas } from './lib/canvas.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const list = args.includes('--list');
const preview = args.includes('--preview');

async function loadModules() {
  const assets = [];
  for (const dir of ['textures', 'sprites', 'ui']) {
    const full = path.join(here, dir);
    if (!fs.existsSync(full)) continue;
    for (const file of fs.readdirSync(full).sort()) {
      if (!file.endsWith('.js')) continue;
      const mod = await import(pathToFileURL(path.join(full, file)).href);
      for (const a of mod.default ?? []) assets.push({ ...a, group: dir, module: file });
    }
  }
  return assets;
}

function contactSheet(items, scale) {
  const pad = 4;
  const cols = Math.max(1, Math.floor(1600 / (64 * scale + pad)));
  const cells = items.map(({ canvas }) => canvas.scale(scale));
  const rowHeights = [];
  for (let i = 0; i < cells.length; i += cols) rowHeights.push(Math.max(...cells.slice(i, i + cols).map((c) => c.h)));
  const width = Math.min(cells.length, cols) * (64 * scale + pad) + pad;
  const maxW = Math.max(...cells.map((c) => c.w));
  const sheetW = Math.max(width, maxW + pad * 2);
  const sheet = new PixelCanvas(sheetW, rowHeights.reduce((a, b) => a + b + pad, pad));
  sheet.fill([40, 0, 40]);
  let y = pad;
  rowHeights.forEach((rh, r) => {
    let x = pad;
    for (let k = 0; k < cols && r * cols + k < cells.length; k++) {
      const cell = cells[r * cols + k];
      sheet.blit(cell, x, y);
      x += Math.max(64 * scale, cell.w) + pad;
    }
    y += rh + pad;
  });
  return sheet;
}

const assets = await loadModules();
if (list) {
  for (const a of assets) console.log(`${a.name.padEnd(28)} ${a.out}`);
  process.exit(0);
}

const selected = assets.filter((a) => !only || a.name.includes(only));
if (selected.length === 0) {
  console.error(`No assets match "${only}". Use --list to see names.`);
  process.exit(1);
}

const outDir = path.join(here, 'out');
fs.mkdirSync(outDir, { recursive: true });
const byGroup = new Map();
let count = 0;
for (const asset of selected) {
  const canvas = asset.draw();
  if (!asset.raw) quantize(canvas, { dither: asset.dither ?? 0 });
  const file = path.join(root, asset.out);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, encodePNG(canvas.w, canvas.h, canvas.data));
  count++;
  if (!byGroup.has(asset.group)) byGroup.set(asset.group, []);
  byGroup.get(asset.group).push({ name: asset.name, canvas });
  if (preview) {
    const s = canvas.w > 200 ? 2 : 4;
    const big = canvas.scale(s);
    fs.writeFileSync(path.join(outDir, `${asset.name}.png`), encodePNG(big.w, big.h, big.data));
  }
}
for (const [group, items] of byGroup) {
  const sheet = contactSheet(items, items.every((i) => i.canvas.w <= 64) ? 3 : 2);
  fs.writeFileSync(path.join(outDir, `preview-${group}.png`), encodePNG(sheet.w, sheet.h, sheet.data));
}
console.log(`Generated ${count} asset(s). Previews in ${path.relative(root, outDir)}/`);
