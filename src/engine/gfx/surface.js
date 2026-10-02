import { TRANSPARENT } from '../config.js';

/**
 * An 8-bit palette-indexed drawing surface (the framebuffer and any scratch
 * buffers). All UI drawing happens at 1:1 pixel scale.
 */
export class Surface {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.px = new Uint8Array(w * h);
  }

  clear(color = 0) {
    this.px.fill(color);
  }

  pixel(x, y, c) {
    x |= 0;
    y |= 0;
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c;
  }

  fillRect(x, y, w, h, c) {
    const x0 = Math.max(0, x | 0);
    const y0 = Math.max(0, y | 0);
    const x1 = Math.min(this.w, (x + w) | 0);
    const y1 = Math.min(this.h, (y + h) | 0);
    for (let yy = y0; yy < y1; yy++) this.px.fill(c, yy * this.w + x0, yy * this.w + x1);
  }

  /** Outline rectangle. */
  rect(x, y, w, h, c) {
    this.fillRect(x, y, w, 1, c);
    this.fillRect(x, y + h - 1, w, 1, c);
    this.fillRect(x, y, 1, h, c);
    this.fillRect(x + w - 1, y, 1, h, c);
  }

  /** Recolour a region through a 256-entry remap table (e.g. a darkening colormap). */
  shadeRect(x, y, w, h, remap) {
    const x0 = Math.max(0, x | 0);
    const y0 = Math.max(0, y | 0);
    const x1 = Math.min(this.w, (x + w) | 0);
    const y1 = Math.min(this.h, (y + h) | 0);
    const px = this.px;
    for (let yy = y0; yy < y1; yy++) {
      let o = yy * this.w + x0;
      for (let xx = x0; xx < x1; xx++, o++) px[o] = remap[px[o]];
    }
  }

  /** Bresenham line, clipped per pixel. */
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
    let guard = 4096;
    while (guard-- > 0) {
      this.pixel(x0, y0, c);
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
  }

  /**
   * Draw an indexed image (IndexedImage or Frame) with transparency.
   * @param {{width?:number,height?:number,pixels?:Uint8Array,w?:number,h?:number,px?:Uint8Array}} src
   * @param {{remap?: Uint8Array, flipX?: boolean, sx?: number, sy?: number, sw?: number, sh?: number}} [opts]
   */
  blit(src, dx, dy, opts = {}) {
    const srcW = src.width ?? src.w;
    const srcH = src.height ?? src.h;
    const pixels = src.pixels ?? src.px;
    const sx = opts.sx ?? 0;
    const sy = opts.sy ?? 0;
    const sw = opts.sw ?? srcW;
    const sh = opts.sh ?? srcH;
    const remap = opts.remap;
    const flip = opts.flipX;
    dx |= 0;
    dy |= 0;
    const W = this.w;
    const px = this.px;
    for (let y = 0; y < sh; y++) {
      const ty = dy + y;
      if (ty < 0 || ty >= this.h) continue;
      const row = (sy + y) * srcW;
      for (let x = 0; x < sw; x++) {
        const tx = dx + x;
        if (tx < 0 || tx >= W) continue;
        const c = pixels[row + sx + (flip ? sw - 1 - x : x)];
        if (c === TRANSPARENT) continue;
        px[ty * W + tx] = remap ? remap[c] : c;
      }
    }
  }

  /** Copy every pixel of another same-sized surface. */
  copyFrom(other) {
    this.px.set(other.px);
  }
}
