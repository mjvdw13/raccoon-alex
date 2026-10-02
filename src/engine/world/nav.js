import { F_SOLID, F_DOOR } from './tilemap.js';

const UNREACHABLE = 32767;
const DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

/**
 * A breadth-first distance field toward the player. Monsters walk downhill to
 * find their way around walls and through (unlocked) doors.
 */
export class FlowField {
  constructor(map) {
    this.map = map;
    this.dist = new Int16Array(map.w * map.h).fill(UNREACHABLE);
    this.queue = new Int32Array(map.w * map.h);
    this.origin = -1;
  }

  passable(i) {
    const f = this.map.flags[i];
    if (f & F_SOLID) return false;
    if (f & F_DOOR) {
      const d = this.map.doors[this.map.doorIndex[i]];
      return !d.lock || d.passable;
    }
    return true;
  }

  /** Recompute distances from a tile (cheap: a few thousand tiles). */
  update(tx, ty, force = false) {
    const map = this.map;
    if (!map.inBounds(tx, ty)) return;
    const origin = ty * map.w + tx;
    if (origin === this.origin && !force) return;
    this.origin = origin;
    const { dist, queue } = this;
    dist.fill(UNREACHABLE);
    let head = 0;
    let tail = 0;
    dist[origin] = 0;
    queue[tail++] = origin;
    const w = map.w;
    while (head < tail) {
      const c = queue[head++];
      const cx = c % w;
      const cy = (c / w) | 0;
      const nd = dist[c] + 1;
      for (let k = 0; k < 4; k++) {
        const nx = cx + DIRS[k][0];
        const ny = cy + DIRS[k][1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= map.h) continue;
        const n = ny * w + nx;
        if (dist[n] <= nd || !this.passable(n)) continue;
        dist[n] = nd;
        queue[tail++] = n;
      }
    }
  }

  distanceAt(tx, ty) {
    if (!this.map.inBounds(tx, ty)) return UNREACHABLE;
    return this.dist[ty * this.map.w + tx];
  }

  /**
   * The neighbouring tile centre to walk toward from (x, y), or null.
   * Diagonals are only taken when both side tiles are open (no corner cutting).
   */
  next(x, y) {
    const map = this.map;
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    const here = this.distanceAt(tx, ty);
    let best = here;
    let bx = -1;
    let by = -1;
    for (const [dx, dy] of DIRS) {
      const nx = tx + dx;
      const ny = ty + dy;
      const d = this.distanceAt(nx, ny);
      if (d >= best) continue;
      if (dx && dy && (!this.passable(ty * map.w + nx) || !this.passable(ny * map.w + tx))) continue;
      best = d;
      bx = nx;
      by = ny;
    }
    if (bx < 0) return null;
    return { x: bx + 0.5, y: by + 0.5, tx: bx, ty: by };
  }
}

export { UNREACHABLE };
