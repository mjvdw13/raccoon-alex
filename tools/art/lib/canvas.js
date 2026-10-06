// A tiny RGBA raster canvas for generating crisp pixel art in Node (no anti-aliasing).
// Colours are [r, g, b] or [r, g, b, a] arrays; null means transparent.

export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mul = (c, f) => [c[0] * f, c[1] * f, c[2] * f];
export const lighten = (c, f) => mix(c, [255, 255, 255], f);
export const darken = (c, f) => mix(c, [0, 0, 0], f);

export class PixelCanvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  clone() {
    const c = new PixelCanvas(this.w, this.h);
    c.data.set(this.data);
    return c;
  }

  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  set(x, y, c) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const o = (y * this.w + x) * 4;
    if (c == null) {
      this.data[o + 3] = 0;
      return;
    }
    this.data[o] = c[0];
    this.data[o + 1] = c[1];
    this.data[o + 2] = c[2];
    this.data[o + 3] = c[3] ?? 255;
  }

  get(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    const o = (y * this.w + x) * 4;
    if (this.data[o + 3] < 128) return null;
    return [this.data[o], this.data[o + 1], this.data[o + 2], this.data[o + 3]];
  }

  /** Wrapping get (for seamless textures). */
  getWrap(x, y) {
    return this.get(((Math.floor(x) % this.w) + this.w) % this.w, ((Math.floor(y) % this.h) + this.h) % this.h);
  }

  opaque(x, y) {
    if (!this.inside(Math.floor(x), Math.floor(y))) return false;
    return this.data[(Math.floor(y) * this.w + Math.floor(x)) * 4 + 3] >= 128;
  }

  fill(c) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.set(x, y, c);
    return this;
  }

  rect(x, y, w, h, c) {
    for (let yy = Math.floor(y); yy < Math.floor(y + h); yy++) {
      for (let xx = Math.floor(x); xx < Math.floor(x + w); xx++) this.set(xx, yy, c);
    }
    return this;
  }

  frame(x, y, w, h, c) {
    this.rect(x, y, w, 1, c);
    this.rect(x, y + h - 1, w, 1, c);
    this.rect(x, y, 1, h, c);
    this.rect(x + w - 1, y, 1, h, c);
    return this;
  }

  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let guard = 0; guard < 10000; guard++) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
    return this;
  }

  /** Filled ellipse; a pixel is inside if its centre is. */
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    }
    return this;
  }

  circle(cx, cy, r, c) {
    return this.ellipse(cx, cy, r, r, c);
  }

  ring(cx, cy, r, thickness, c) {
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) {
      for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d <= r && d > r - thickness) this.set(x, y, c);
      }
    }
    return this;
  }

  /** Filled polygon (even-odd rule). points: [[x, y], ...] */
  poly(points, c) {
    const ys = points.map((p) => p[1]);
    const y0 = Math.floor(Math.min(...ys));
    const y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const sy = y + 0.5;
      const xs = [];
      for (let i = 0; i < points.length; i++) {
        const [ax, ay] = points[i];
        const [bx, by] = points[(i + 1) % points.length];
        if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) xs.push(ax + ((sy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) this.set(x, y, c);
      }
    }
    return this;
  }

  /** Thick line with round caps, radius tapering from r0 to r1. Great for limbs. */
  capsule(x0, y0, x1, y1, r0, c, r1 = r0) {
    const minX = Math.floor(Math.min(x0, x1) - Math.max(r0, r1) - 1);
    const maxX = Math.ceil(Math.max(x0, x1) + Math.max(r0, r1) + 1);
    const minY = Math.floor(Math.min(y0, y1) - Math.max(r0, r1) - 1);
    const maxY = Math.ceil(Math.max(y0, y1) + Math.max(r0, r1) + 1);
    const vx = x1 - x0;
    const vy = y1 - y0;
    const len2 = vx * vx + vy * vy || 1e-9;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5 - x0;
        const py = y + 0.5 - y0;
        const t = Math.max(0, Math.min(1, (px * vx + py * vy) / len2));
        const dx = px - vx * t;
        const dy = py - vy * t;
        const r = r0 + (r1 - r0) * t;
        if (dx * dx + dy * dy <= r * r) this.set(x, y, c);
      }
    }
    return this;
  }

  /** Map every pixel: fn(x, y, rgba|null) returns a new colour, null (clear) or undefined (keep). */
  each(fn) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const r = fn(x, y, this.get(x, y));
        if (r !== undefined) this.set(x, y, r);
      }
    }
    return this;
  }

  /** Apply fn only to opaque pixels. */
  eachOpaque(fn) {
    return this.each((x, y, c) => (c ? fn(x, y, c) : undefined));
  }

  /** Draw another canvas on top (pixels with alpha < 128 are skipped). */
  blit(src, dx, dy, { flipX = false, flipY = false } = {}) {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const c = src.get(flipX ? src.w - 1 - x : x, flipY ? src.h - 1 - y : y);
        if (c) this.set(dx + x, dy + y, c);
      }
    }
    return this;
  }

  /** Add a 1px outline around the opaque shape. */
  outline(c, corners = false) {
    const src = this.clone();
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (src.opaque(x, y)) continue;
        let hit = src.opaque(x - 1, y) || src.opaque(x + 1, y) || src.opaque(x, y - 1) || src.opaque(x, y + 1);
        if (!hit && corners) {
          hit = src.opaque(x - 1, y - 1) || src.opaque(x + 1, y - 1) || src.opaque(x - 1, y + 1) || src.opaque(x + 1, y + 1);
        }
        if (hit) this.set(x, y, c);
      }
    }
    return this;
  }

  /**
   * Cheap volume shading: brighten pixels on the side facing the light
   * (top-left by default) and darken the far side.
   */
  rim({ lx = -1, ly = -1, hi = 0.22, lo = 0.35 } = {}) {
    const src = this.clone();
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = src.get(x, y);
        if (!c) continue;
        const lit = !src.opaque(x + lx, y) || !src.opaque(x, y + ly);
        const dark = !src.opaque(x - lx, y) || !src.opaque(x, y - ly);
        if (lit && !dark) this.set(x, y, lighten(c, hi));
        else if (dark && !lit) this.set(x, y, darken(c, lo));
      }
    }
    return this;
  }

  /** Nearest-neighbour upscale (previews). */
  scale(n) {
    const out = new PixelCanvas(this.w * n, this.h * n);
    for (let y = 0; y < out.h; y++) {
      for (let x = 0; x < out.w; x++) {
        const o = (Math.floor(y / n) * this.w + Math.floor(x / n)) * 4;
        const p = (y * out.w + x) * 4;
        out.data[p] = this.data[o];
        out.data[p + 1] = this.data[o + 1];
        out.data[p + 2] = this.data[o + 2];
        out.data[p + 3] = this.data[o + 3];
      }
    }
    return out;
  }

  crop(x, y, w, h) {
    const out = new PixelCanvas(w, h);
    out.blit(this, -x, -y);
    return out;
  }

  /** Copy mirrored horizontally. */
  flipped() {
    const out = new PixelCanvas(this.w, this.h);
    out.blit(this, 0, 0, { flipX: true });
    return out;
  }
}

/** Lay frames out left-to-right (wrapping after `cols`) into one sheet canvas. */
export function strip(frames, cols = frames.length) {
  const fw = frames[0].w;
  const fh = frames[0].h;
  const rows = Math.ceil(frames.length / cols);
  const out = new PixelCanvas(fw * Math.min(cols, frames.length), fh * rows);
  frames.forEach((f, i) => out.blit(f, (i % cols) * fw, Math.floor(i / cols) * fh));
  return out;
}
