import { F_SKY } from '../world/tilemap.js';
import { DIMINISH } from './view.js';

const TAU = Math.PI * 2;

/**
 * Draw floors and ceilings row by row (perspective floor casting), plus the
 * sky on tiles whose ceiling is open. Walls are drawn over this afterwards.
 *
 * @param {import('./view.js').View} view
 * @param {import('../world/tilemap.js').TileMap} map
 * @param {import('../assets.js').Texture[]} textures
 * @param {import('../assets.js').Texture|null} sky
 */
export function drawFlats(view, map, textures, sky, fb, fbW, colormaps) {
  const { W, H, x: px, y: py, dirX, dirY, planeX, planeY, fy, camZ, horizon, fog } = view;
  const mw = map.w;
  const mh = map.h;
  const flags = map.flags;
  const floorTex = map.floorTex;
  const ceilTex = map.ceilTex;
  const light = map.light;
  const lightStart = view.lightStart;
  const fixed = view.fixedColormap;

  const rdx0 = dirX - planeX;
  const rdy0 = dirY - planeY;
  const rdx1 = dirX + planeX;
  const rdy1 = dirY + planeY;

  // Sky: horizontal texel per column from the view angle; the texture spans 180 degrees.
  let skyOffset = 0;
  if (sky) {
    for (let x = 0; x < W; x++) {
      const camX = (2 * (x + 0.5)) / W - 1;
      let a = view.angle + Math.atan(camX * view.planeLen);
      a = ((a % TAU) + TAU) % TAU;
      view.skyU[x] = Math.floor((a / TAU) * sky.w * 2) % sky.w;
    }
    skyOffset = sky.h - 6 - Math.round(horizon);
  }

  for (let y = 0; y < H; y++) {
    const p = y + 0.5 - horizon;
    if (p > -0.01 && p < 0.01) continue;
    const isFloor = p > 0;
    const rowDist = ((isFloor ? camZ : 1 - camZ) * fy) / Math.abs(p);
    const stepX = (rowDist * (rdx1 - rdx0)) / W;
    const stepY = (rowDist * (rdy1 - rdy0)) / W;
    let wx = px + rowDist * rdx0 + stepX * 0.5;
    let wy = py + rowDist * rdy0 + stepY * 0.5;
    let bright = DIMINISH / Math.max(0.25, rowDist);
    if (bright > 24) bright = 24;
    const rowShift = -bright + rowDist * fog;
    let o = y * fbW;
    const skyRow = sky ? Math.max(0, Math.min(sky.h - 1, y + skyOffset)) * sky.w : 0;

    for (let x = 0; x < W; x++, wx += stepX, wy += stepY, o++) {
      if (wx < 0 || wy < 0) {
        fb[o] = 0;
        continue;
      }
      const cx = wx | 0;
      const cy = wy | 0;
      if (cx >= mw || cy >= mh) {
        fb[o] = 0;
        continue;
      }
      const i = cy * mw + cx;
      let slot;
      if (isFloor) {
        slot = floorTex[i];
      } else {
        if (flags[i] & F_SKY) {
          if (sky) {
            const c = sky.cur[skyRow + view.skyU[x]];
            fb[o] = fixed >= 0 ? colormaps[fixed * 256 + c] : c;
          } else fb[o] = 0;
          continue;
        }
        slot = ceilTex[i];
      }
      if (slot < 0) {
        fb[o] = 0;
        continue;
      }
      const t = textures[slot];
      const tw = t.w;
      const tx = ((wx - cx) * tw) | 0;
      const ty = ((wy - cy) * t.h) | 0;
      const c = t.cur[ty * tw + tx];
      let lv;
      if (fixed >= 0) lv = fixed;
      else {
        lv = (lightStart[light[i]] + rowShift) | 0;
        if (lv < 0) lv = 0;
        else if (lv > 31) lv = 31;
      }
      fb[o] = colormaps[lv * 256 + c];
    }
  }
}
