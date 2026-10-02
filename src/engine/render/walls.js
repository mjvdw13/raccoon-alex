import { F_SOLID, F_DOOR } from '../world/tilemap.js';

const MAX_STEPS = 128;

/**
 * Cast one ray per screen column (DDA through the tile grid) and draw the
 * textured wall slice it hits. Doors are thin panels through the middle of
 * their tile that slide open; walls next to a door use the door's jamb
 * texture. Secret doors are flush with the surrounding wall instead. Fills view.zbuf with the distance per column for sprite clipping.
 *
 * @param {import('./view.js').View} view
 * @param {import('../world/tilemap.js').TileMap} map
 * @param {import('../assets.js').Texture[]} textures
 * @param {Uint8Array} fb framebuffer (palette indices)
 * @param {number} fbW framebuffer width
 * @param {Uint8Array} colormaps
 */
export function drawWalls(view, map, textures, fb, fbW, colormaps) {
  const { W, H, x: px, y: py, dirX, dirY, planeX, planeY, fy, camZ, horizon, zbuf } = view;
  const mw = map.w;
  const mh = map.h;
  const flags = map.flags;
  const wallTex = map.wallTex;
  const doorIndex = map.doorIndex;
  const doors = map.doors;
  const light = map.light;
  const seen = map.seen;

  for (let x = 0; x < W; x++) {
    const camX = (2 * (x + 0.5)) / W - 1;
    const rdx = dirX + planeX * camX;
    const rdy = dirY + planeY * camX;
    let mapX = Math.floor(px);
    let mapY = Math.floor(py);
    const ddx = rdx === 0 ? 1e30 : Math.abs(1 / rdx);
    const ddy = rdy === 0 ? 1e30 : Math.abs(1 / rdy);
    let stepX;
    let stepY;
    let sdx;
    let sdy;
    if (rdx < 0) {
      stepX = -1;
      sdx = (px - mapX) * ddx;
    } else {
      stepX = 1;
      sdx = (mapX + 1 - px) * ddx;
    }
    if (rdy < 0) {
      stepY = -1;
      sdy = (py - mapY) * ddy;
    } else {
      stepY = 1;
      sdy = (mapY + 1 - py) * ddy;
    }

    let side = 0;
    let perp = 1e6;
    let tex = -1;
    let u = 0;
    let lightTile = -1;
    let contrast = 0;

    for (let step = 0; step < MAX_STEPS; step++) {
      const prevX = mapX;
      const prevY = mapY;
      if (sdx < sdy) {
        sdx += ddx;
        mapX += stepX;
        side = 0;
      } else {
        sdy += ddy;
        mapY += stepY;
        side = 1;
      }
      if (mapX < 0 || mapY < 0 || mapX >= mw || mapY >= mh) {
        perp = side === 0 ? sdx - ddx : sdy - ddy;
        tex = -1;
        break;
      }
      const i = mapY * mw + mapX;
      const f = flags[i];
      if (f & F_DOOR) {
        const door = doors[doorIndex[i]];
        if (door.secret) {
          // Secret doors sit flush with the wall around them and slide sideways.
          const t = side === 0 ? sdx - ddx : sdy - ddy;
          let du = door.axis === 'x' ? py + rdy * t - mapY : px + rdx * t - mapX;
          if (du < door.open) continue;
          du -= door.open;
          if (side === 0 ? rdx < 0 : rdy > 0) du = 1 - du;
          perp = t;
          tex = door.tex;
          u = du;
          lightTile = prevY * mw + prevX;
          contrast = side === 0 ? 1 : -1;
          seen[i] = 1;
          break;
        }
        let t;
        if (door.axis === 'x') {
          if (rdx === 0) continue;
          t = (mapX + 0.5 - px) / rdx;
        } else {
          if (rdy === 0) continue;
          t = (mapY + 0.5 - py) / rdy;
        }
        if (t < 0) continue;
        const hx = px + rdx * t;
        const hy = py + rdy * t;
        if (Math.floor(hx) !== mapX || Math.floor(hy) !== mapY) continue;
        let du = door.axis === 'x' ? hy - mapY : hx - mapX;
        const open = door.open;
        if (door.style === 'split') {
          const half = open * 0.5;
          if (du > 0.5 - half && du < 0.5 + half) continue;
          du = du < 0.5 ? du + half : du - half;
        } else {
          if (du < open) continue;
          du -= open;
        }
        perp = t;
        tex = door.tex;
        u = du;
        lightTile = i;
        contrast = door.axis === 'x' ? 1 : -1;
        seen[i] = 1;
        break;
      }
      if (f & F_SOLID) {
        perp = side === 0 ? sdx - ddx : sdy - ddy;
        tex = wallTex[i];
        const pi = prevY * mw + prevX;
        if (flags[pi] & F_DOOR) {
          const jamb = doors[doorIndex[pi]].jamb;
          if (jamb >= 0) tex = jamb;
        }
        let wx = side === 0 ? py + perp * rdy : px + perp * rdx;
        wx -= Math.floor(wx);
        if (side === 0 ? rdx < 0 : rdy > 0) wx = 1 - wx;
        u = wx;
        lightTile = pi;
        contrast = side === 0 ? 1 : -1;
        seen[i] = 1;
        break;
      }
    }

    zbuf[x] = perp;
    const lineH = fy / perp;
    const top = horizon - (1 - camZ) * lineH;
    const bottom = horizon + camZ * lineH;
    let y0 = Math.ceil(top - 0.5);
    let y1 = Math.ceil(bottom - 0.5);
    if (y0 < 0) y0 = 0;
    if (y1 > H) y1 = H;
    if (y1 <= y0) continue;

    if (tex < 0) {
      for (let y = y0; y < y1; y++) fb[y * fbW + x] = 0;
      continue;
    }
    const t = textures[tex];
    const tw = t.w;
    const th = t.h;
    let tx = Math.floor(u * tw);
    if (tx >= tw) tx = tw - 1;
    const col = t.curCM;
    const colBase = tx * th;
    const level = lightTile >= 0 ? view.level(light[lightTile], perp) : 0;
    let lv = level + (view.fixedColormap >= 0 ? 0 : contrast);
    if (lv < 0) lv = 0;
    else if (lv > 31 && view.fixedColormap < 0) lv = 31;
    const cm = lv * 256;
    const stepV = th / lineH;
    let v = (y0 + 0.5 - top) * stepV;
    const hMask = t.hMask;
    let o = y0 * fbW + x;
    if (hMask >= 0) {
      for (let y = y0; y < y1; y++) {
        fb[o] = colormaps[cm + col[colBase + ((v | 0) & hMask)]];
        v += stepV;
        o += fbW;
      }
    } else {
      for (let y = y0; y < y1; y++) {
        fb[o] = colormaps[cm + col[colBase + ((v | 0) % th)]];
        v += stepV;
        o += fbW;
      }
    }
  }
}
