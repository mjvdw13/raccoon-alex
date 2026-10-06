import { SCREEN_W, SCREEN_H } from '../config.js';

/** Shown while assets load. */
export class LoadingScene {
  constructor(game) {
    this.game = game;
    this.done = 0;
    this.total = 1;
  }

  progress(done, total) {
    this.done = done;
    this.total = Math.max(1, total);
  }

  update() {}

  render() {
    const g = this.game;
    const s = g.surface;
    const pal = g.palette;
    s.clear(0);
    const font = g.font('small');
    const label = g.registry.strings.loading ?? 'LOADING...';
    font?.draw(s, label, SCREEN_W / 2, SCREEN_H / 2 - 16, { align: 'center', remap: pal.tint('gray', 'blood') });
    const w = 160;
    const x = (SCREEN_W - w) / 2;
    const y = SCREEN_H / 2;
    s.rect(x - 2, y - 2, w + 4, 10, pal.ramp('blood', 0.5));
    s.fillRect(x, y, Math.round((w * this.done) / this.total), 6, pal.ramp('blood', 0.85));
  }
}
