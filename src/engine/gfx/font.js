import { TRANSPARENT } from '../config.js';

/**
 * A bitmap font cut from a PNG grid of equally sized cells, starting at the
 * character code `first` (default 32, space) and running left-to-right,
 * top-to-bottom. Glyph widths are measured from the opaque pixels, so
 * proportional fonts work without extra metadata.
 */
export class BitmapFont {
  /**
   * @param {import('./image.js').IndexedImage} image
   * @param {{cellW:number, cellH:number, first?:number, spacing?:number, spaceWidth?:number,
   *          lineHeight?:number, upper?:boolean, mono?:boolean}} opts
   */
  constructor(image, opts) {
    this.image = image;
    this.cellW = opts.cellW;
    this.cellH = opts.cellH;
    this.first = opts.first ?? 32;
    this.spacing = opts.spacing ?? 1;
    this.spaceWidth = opts.spaceWidth ?? Math.ceil(this.cellW / 2);
    this.lineHeight = opts.lineHeight ?? this.cellH + 2;
    this.upper = !!opts.upper;
    this.mono = !!opts.mono;
    this.height = this.cellH;

    const cols = Math.floor(image.width / this.cellW);
    const rows = Math.floor(image.height / this.cellH);
    this.glyphs = new Map();
    for (let i = 0; i < cols * rows; i++) {
      const cx = (i % cols) * this.cellW;
      const cy = Math.floor(i / cols) * this.cellH;
      let left = -1;
      let right = -1;
      for (let x = 0; x < this.cellW; x++) {
        for (let y = 0; y < this.cellH; y++) {
          if (image.pixels[(cy + y) * image.width + cx + x] !== TRANSPARENT) {
            if (left < 0) left = x;
            right = x;
            break;
          }
        }
      }
      const code = this.first + i;
      if (left < 0) {
        this.glyphs.set(code, { sx: cx, sy: cy, w: code === 32 ? this.spaceWidth : 0, empty: true });
      } else if (this.mono) {
        this.glyphs.set(code, { sx: cx, sy: cy, w: this.cellW, empty: false });
      } else {
        this.glyphs.set(code, { sx: cx + left, sy: cy, w: right - left + 1, empty: false });
      }
    }
    if (!this.glyphs.has(32)) this.glyphs.set(32, { sx: 0, sy: 0, w: this.spaceWidth, empty: true });
  }

  _glyph(ch) {
    let code = ch.charCodeAt(0);
    if (this.upper && code >= 97 && code <= 122) code -= 32;
    const g = this.glyphs.get(code);
    if (g && (!g.empty || code === 32)) return g;
    if (!this.upper && code >= 97 && code <= 122) return this.glyphs.get(code - 32) ?? this.glyphs.get(32);
    return this.glyphs.get(32);
  }

  /** Width in pixels of one line of text. */
  measure(text) {
    let w = 0;
    let n = 0;
    for (const ch of String(text)) {
      if (ch === '\n') break;
      const g = this._glyph(ch);
      w += g.w;
      n++;
    }
    return n ? w + (n - 1) * this.spacing : 0;
  }

  /** Word-wrap text into lines that fit `maxWidth`. */
  wrap(text, maxWidth) {
    const lines = [];
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const attempt = line ? `${line} ${word}` : word;
        if (line && this.measure(attempt) > maxWidth) {
          lines.push(line);
          line = word;
        } else {
          line = attempt;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  /**
   * Draw text. Supports '\n'. Returns the x after the last glyph.
   * @param {import('./surface.js').Surface} surface
   * @param {{remap?: Uint8Array, align?: 'left'|'center'|'right', shadow?: Uint8Array|number}} [opts]
   */
  draw(surface, text, x, y, opts = {}) {
    const lines = String(text).split('\n');
    let endX = x;
    lines.forEach((line, li) => {
      let cx = x;
      const width = this.measure(line);
      if (opts.align === 'center') cx = Math.round(x - width / 2);
      else if (opts.align === 'right') cx = x - width;
      const cy = y + li * this.lineHeight;
      if (opts.shadow !== undefined) this._drawLine(surface, line, cx + 1, cy + 1, null, opts.shadow);
      endX = this._drawLine(surface, line, cx, cy, opts.remap, undefined);
    });
    return endX;
  }

  _drawLine(surface, line, x, y, remap, solid) {
    const img = this.image;
    for (const ch of line) {
      const g = this._glyph(ch);
      if (!g.empty) {
        if (solid === undefined) {
          surface.blit(img, x, y, { sx: g.sx, sy: g.sy, sw: g.w, sh: this.cellH, remap });
        } else {
          // Solid-colour silhouette (drop shadows).
          for (let yy = 0; yy < this.cellH; yy++) {
            for (let xx = 0; xx < g.w; xx++) {
              const c = img.pixels[(g.sy + yy) * img.width + g.sx + xx];
              if (c !== TRANSPARENT) surface.pixel(x + xx, y + yy, typeof solid === 'number' ? solid : solid[c]);
            }
          }
        }
      }
      x += g.w + this.spacing;
    }
    return x;
  }
}
