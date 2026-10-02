// A tiny software "clay model" renderer for sprites.
//
// Instead of flat colours and outlines, sprites are built from 3D-ish
// primitives (ellipsoids, tapered capsules, bevelled slabs) that write depth,
// normals, colour and material into a G-buffer. A lighting pass then adds
// soft directional light, specular highlights, ambient occlusion and surface
// grain, which gives the sculpted, digitized look of classic 90s shooter
// sprites rather than a cartoon.
import { PixelCanvas } from './canvas.js';
import { hash2, valueNoise } from './noise.js';

const BASE = { spec: 0.08, shine: 10, grain: 0.05, emissive: false, wrap: 0.25 };

/** Material presets. Any object with these keys works too. */
export const MAT = {
  skin: { spec: 0.14, shine: 14, grain: 0.05 },
  flesh: { spec: 0.3, shine: 18, grain: 0.08 },
  cloth: { spec: 0.03, shine: 6, grain: 0.07 },
  hair: { spec: 0.12, shine: 9, grain: 0.22 },
  fur: { spec: 0.05, shine: 6, grain: 0.2 },
  metal: { spec: 0.6, shine: 30, grain: 0.04 },
  brass: { spec: 0.7, shine: 26, grain: 0.04 },
  plastic: { spec: 0.4, shine: 22, grain: 0.03 },
  bag: { spec: 0.55, shine: 16, grain: 0.05 },
  leather: { spec: 0.25, shine: 16, grain: 0.06 },
  wood: { spec: 0.08, shine: 8, grain: 0.12 },
  glass: { spec: 0.9, shine: 40, grain: 0.01 },
  // Eyeballs: wet and mostly self-lit so sockets don't swallow them.
  eye: { spec: 0.7, shine: 36, grain: 0.01, flat: 0.75 },
  paper: { spec: 0.02, shine: 4, grain: 0.06 },
  bone: { spec: 0.2, shine: 12, grain: 0.08 },
  glow: { emissive: true, grain: 0 },
};

const norm = (x, y, z) => {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
};

export class Model {
  constructor(w, h, { seed = 1 } = {}) {
    this.w = w;
    this.h = h;
    this.seed = seed;
    const n = w * h;
    this.depth = new Float32Array(n).fill(-Infinity);
    this.nx = new Float32Array(n);
    this.ny = new Float32Array(n);
    this.nz = new Float32Array(n);
    this.cr = new Float32Array(n);
    this.cg = new Float32Array(n);
    this.cb = new Float32Array(n);
    this.mat = new Uint8Array(n);
    this.mats = [BASE];
    this.matIndex = new Map([[BASE, 0]]);
  }

  _m(mat) {
    if (!mat) return 0;
    let i = this.matIndex.get(mat);
    if (i === undefined) {
      i = this.mats.length;
      this.mats.push({ ...BASE, ...mat });
      this.matIndex.set(mat, i);
    }
    return i;
  }

  _put(x, y, z, nx, ny, nz, col, m) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    if (z <= this.depth[i]) return;
    this.depth[i] = z;
    this.nx[i] = nx;
    this.ny[i] = ny;
    this.nz[i] = nz;
    this.cr[i] = col[0];
    this.cg[i] = col[1];
    this.cb[i] = col[2];
    this.mat[i] = m;
  }

  has(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    return x >= 0 && y >= 0 && x < this.w && y < this.h && this.depth[y * this.w + x] > -Infinity;
  }

  /** Ellipsoid centred at (cx, cy, cz) with radii (rx, ry, rz). */
  ellipsoid(cx, cy, cz, rx, ry, rz, col, mat) {
    const m = this._m(mat);
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        const dz = Math.sqrt(1 - d2);
        const [nx, ny, nz] = norm(dx / rx, dy / ry, dz / rz);
        this._put(x, y, cz + dz * rz, nx, ny, nz, col, m);
      }
    }
    return this;
  }

  sphere(cx, cy, cz, r, col, mat) {
    return this.ellipsoid(cx, cy, cz, r, r, r, col, mat);
  }

  /** Tapered capsule from (x0,y0,z0) radius r0 to (x1,y1,z1) radius r1. */
  capsule(x0, y0, z0, x1, y1, z1, r0, r1, col, mat) {
    const m = this._m(mat);
    const vx = x1 - x0;
    const vy = y1 - y0;
    const len2 = vx * vx + vy * vy || 1e-9;
    const rmax = Math.max(r0, r1);
    for (let y = Math.floor(Math.min(y0, y1) - rmax - 1); y <= Math.ceil(Math.max(y0, y1) + rmax + 1); y++) {
      for (let x = Math.floor(Math.min(x0, x1) - rmax - 1); x <= Math.ceil(Math.max(x0, x1) + rmax + 1); x++) {
        const px = x + 0.5 - x0;
        const py = y + 0.5 - y0;
        const t = Math.max(0, Math.min(1, (px * vx + py * vy) / len2));
        const ox = px - vx * t;
        const oy = py - vy * t;
        const d = Math.hypot(ox, oy);
        const r = r0 + (r1 - r0) * t;
        if (d > r) continue;
        const dz = Math.sqrt(r * r - d * d);
        const [nx, ny, nz] = norm(ox, oy, dz);
        this._put(x, y, z0 + (z1 - z0) * t + dz, nx, ny, nz, col, m);
      }
    }
    return this;
  }

  /**
   * A flat polygon with rounded, bevelled edges (boxes, guns, briefcases).
   * tilt = [tx, ty] tips the face normal (e.g. [0, -0.4] faces it upward).
   */
  slab(points, z, col, mat, { bevel = 2, thickness = 2, tilt = [0, 0] } = {}) {
    const m = this._m(mat);
    const ys = points.map((p) => p[1]);
    const xs = points.map((p) => p[0]);
    const base = norm(tilt[0], tilt[1], 1);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        // Inside test and nearest edge.
        let inside = false;
        let best = Infinity;
        let ex = 0;
        let ey = 0;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const [ax, ay] = points[j];
          const [bx, by] = points[i];
          if (ay > py !== by > py && px < ((bx - ax) * (py - ay)) / (by - ay) + ax) inside = !inside;
          const sx = bx - ax;
          const sy = by - ay;
          const l2 = sx * sx + sy * sy || 1e-9;
          const t = Math.max(0, Math.min(1, ((px - ax) * sx + (py - ay) * sy) / l2));
          const qx = px - (ax + sx * t);
          const qy = py - (ay + sy * t);
          const d = Math.hypot(qx, qy);
          if (d < best) {
            best = d;
            ex = qx;
            ey = qy;
          }
        }
        if (!inside) continue;
        let n = base;
        let zz = z;
        if (best < bevel) {
          const k = 1 - best / bevel;
          const l = Math.hypot(ex, ey) || 1;
          n = norm(base[0] - (ex / l) * k * 1.2, base[1] - (ey / l) * k * 1.2, base[2] * (1 - k * 0.6));
          zz = z - k * thickness;
        }
        this._put(x, y, zz, n[0], n[1], n[2], col, m);
      }
    }
    return this;
  }

  /** Recolour already-modelled pixels inside an ellipse (no change to shape). */
  paint(cx, cy, rx, ry, col, mat, { minZ = -Infinity } = {}) {
    const m = mat ? this._m(mat) : -1;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy > 1 || !this.has(x, y)) continue;
        const i = y * this.w + x;
        if (this.depth[i] < minZ) continue;
        this.cr[i] = col[0];
        this.cg[i] = col[1];
        this.cb[i] = col[2];
        if (m >= 0) this.mat[i] = m;
      }
    }
    return this;
  }

  /** Recolour a single pixel if modelled. */
  dot(x, y, col, mat) {
    return this.paint(x + 0.5, y + 0.5, 0.5, 0.5, col, mat);
  }

  /** Recolour along a line (stripes, ties, scratches). */
  stroke(x0, y0, x1, y1, w, col, mat) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      this.paint(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, w / 2 + 0.01, w / 2 + 0.01, col, mat);
    }
    return this;
  }

  /** Recolour inside a polygon. */
  paintPoly(points, col, mat) {
    const m = mat ? this._m(mat) : -1;
    const ys = points.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const sy = y + 0.5;
      const xs = [];
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [ax, ay] = points[j];
        const [bx, by] = points[i];
        if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) xs.push(ax + ((sy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) {
          if (!this.has(x, y)) continue;
          const i = y * this.w + x;
          this.cr[i] = col[0];
          this.cg[i] = col[1];
          this.cb[i] = col[2];
          if (m >= 0) this.mat[i] = m;
        }
      }
    }
    return this;
  }

  /** Push the surface in (eye sockets, mouths, creases): normals bend inward, depth drops. */
  dent(cx, cy, rx, ry, amount = 1) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1 || !this.has(x, y)) continue;
        const i = y * this.w + x;
        const k = (1 - d2) * amount;
        const [nx, ny, nz] = norm(this.nx[i] - dx * k, this.ny[i] - dy * k, this.nz[i]);
        this.nx[i] = nx;
        this.ny[i] = ny;
        this.nz[i] = nz;
        this.depth[i] -= k * 1.5;
      }
    }
    return this;
  }

  /** Multiply colours by a pattern fn(x, y) -> factor (grime, stains). */
  tint(fn) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const i = y * this.w + x;
        if (this.depth[i] === -Infinity || this.mats[this.mat[i]].emissive) continue;
        const r = fn(x, y, [this.cr[i], this.cg[i], this.cb[i]]);
        if (!r) continue;
        if (typeof r === 'number') {
          this.cr[i] *= r;
          this.cg[i] *= r;
          this.cb[i] *= r;
        } else {
          this.cr[i] = r[0];
          this.cg[i] = r[1];
          this.cb[i] = r[2];
        }
      }
    }
    return this;
  }

  /** Light the G-buffer into an RGBA canvas. */
  render({
    light = [-0.5, -0.62, 0.6],
    ambient = 0.26,
    bounce = 0.12,
    aoRadius = 3,
    aoStrength = 0.5,
    contrast = 1.08,
  } = {}) {
    const out = new PixelCanvas(this.w, this.h);
    const L = norm(...light);
    const H = norm(L[0], L[1], L[2] + 1);
    const noise = valueNoise(this.seed, 4096, 4096);
    const W = this.w;
    const offsets = [];
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      for (const d of [1.5, aoRadius]) offsets.push([Math.round(Math.cos(a) * d), Math.round(Math.sin(a) * d)]);
    }
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const z = this.depth[i];
        if (z === -Infinity) continue;
        const m = this.mats[this.mat[i]];
        let r = this.cr[i];
        let g = this.cg[i];
        let b = this.cb[i];
        if (m.emissive) {
          out.set(x, y, [r, g, b]);
          continue;
        }
        // Grain: fine speckle plus a lower-frequency mottle.
        const gr = (hash2(x, y, this.seed) - 0.5) * 1.4 + (noise(x * 0.35, y * 0.35) - 0.5);
        const gm = 1 + gr * m.grain * 2;
        r *= gm;
        g *= gm;
        b *= gm;
        // Ambient occlusion from nearby closer surfaces.
        let occ = 0;
        for (const [ox, oy] of offsets) {
          const xx = x + ox;
          const yy = y + oy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= this.h) continue;
          const zn = this.depth[yy * W + xx];
          if (zn !== -Infinity && zn - z > 1.2) occ += Math.min(1, (zn - z - 1.2) / 3);
        }
        const ao = 1 - aoStrength * Math.min(1, occ / (offsets.length * 0.45));
        const nx = this.nx[i];
        const ny = this.ny[i];
        const nz = this.nz[i];
        const ndl = nx * L[0] + ny * L[1] + nz * L[2];
        const diffuse = Math.max(0, (ndl + m.wrap) / (1 + m.wrap));
        const up = Math.max(0, ny) * bounce; // light bouncing off the floor
        let shade = (ambient + (1 - ambient) * diffuse) * ao + up;
        shade = Math.pow(shade, contrast);
        if (m.flat) shade += (0.92 - shade) * m.flat;
        const ndh = Math.max(0, nx * H[0] + ny * H[1] + nz * H[2]);
        const spec = m.spec * Math.pow(ndh, m.shine) * 255 * ao;
        out.set(x, y, [
          Math.min(255, r * shade + spec),
          Math.min(255, g * shade + spec * 0.95),
          Math.min(255, b * shade + spec * 0.85),
        ]);
      }
    }
    return out;
  }
}

/** Rotate/translate a list of 3D points [x, y, z] in the image plane (for falling bodies). */
export function rotatePoints(points, angle, px, py, dx = 0, dy = 0) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return points.map(([x, y, z]) => [px + (x - px) * c - (y - py) * s + dx, py + (x - px) * s + (y - py) * c + dy, z]);
}
