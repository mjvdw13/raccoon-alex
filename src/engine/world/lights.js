import { LIGHT_FX } from './tilemap.js';

/**
 * Animated lighting (Doom's sector light specials). Tiles that share a glyph
 * and effect form a group and change together.
 */
export class LightEffects {
  constructor(map, rng) {
    this.map = map;
    this.rng = rng;
    this.groups = [];
    const byGroup = new Map();
    for (let i = 0; i < map.w * map.h; i++) {
      const g = map.lightGroup[i];
      if (g < 0) continue;
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g).push(i);
    }
    for (const tiles of byGroup.values()) {
      const base = map.baseLight[tiles[0]];
      this.groups.push({
        tiles,
        fx: map.lightFx[tiles[0]],
        max: base,
        min: Math.max(16, base - 96),
        cur: base,
        timer: rng.range(0, 1),
        phase: rng.range(0, Math.PI * 2),
      });
    }
  }

  update(dt) {
    const r = this.rng;
    for (const g of this.groups) {
      g.timer -= dt;
      switch (g.fx) {
        case LIGHT_FX.flicker:
          if (g.timer <= 0) {
            if (g.cur === g.max) {
              g.cur = g.min;
              g.timer = r.range(0.03, 0.2);
            } else {
              g.cur = g.max;
              g.timer = r.range(0.05, 1.8);
            }
          }
          break;
        case LIGHT_FX.strobe:
          if (g.timer <= 0) {
            if (g.cur === g.max) {
              g.cur = g.min;
              g.timer = r.range(0.5, 1);
            } else {
              g.cur = g.max;
              g.timer = 0.12;
            }
          }
          break;
        case LIGHT_FX.blink:
          if (g.timer <= 0) {
            g.cur = g.cur === g.max ? g.min : g.max;
            g.timer = 0.5;
          }
          break;
        case LIGHT_FX.glow:
          g.phase += dt * 2.5;
          g.cur = Math.round(g.min + (g.max - g.min) * (0.5 + 0.5 * Math.sin(g.phase)));
          break;
        case LIGHT_FX.fire:
          if (g.timer <= 0) {
            g.cur = Math.max(g.min, g.max - r.int(0, 3) * 16);
            g.timer = 0.11;
          }
          break;
        default:
          break;
      }
      for (const i of g.tiles) this.map.light[i] = g.cur;
    }
  }

  /** Change the base light of tiles (trigger action); restarts their groups. */
  setLight(tiles, light) {
    const set = new Set(tiles);
    for (const i of tiles) {
      this.map.baseLight[i] = light;
      this.map.light[i] = light;
    }
    for (const g of this.groups) {
      if (g.tiles.some((i) => set.has(i))) {
        g.max = light;
        g.min = Math.max(16, light - 96);
        g.cur = light;
      }
    }
  }
}
