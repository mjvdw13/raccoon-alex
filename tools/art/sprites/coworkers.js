// Alex's coworkers: friendly NPCs who are also stuck in the office at 3 AM.
// Each one is hand-drawn pixel art (people/), drawn from their photo in
// assets/custom/coworkers/: 64x64 frames, shown 1:1 in the game.
import { Model, MAT } from '../lib/model.js';
import { sheet } from '../lib/sprite.js';
import { gusSheet } from './people/gus.js';
import { bennySheet } from './people/benny.js';
import { daleSheet } from './people/dale.js';
import { terrySheet } from './people/terry.js';
import { veraSheet } from './people/vera.js';

const OUT = (name) => `assets/sprites/coworkers/${name}.png`;

// ------------------------------------------------------------------ speech bubbles

/** Little speech bubbles that pop up when a coworker reacts. */
function bubbles() {
  const out = [];
  const draw = (fn) => {
    const m = new Model(24, 20, { seed: 710 });
    const pts = [];
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      pts.push([12 + Math.cos(a) * 10.5, 8 + Math.sin(a) * 6.6]);
    }
    m.slab(pts, 4, [255, 255, 255], { ...MAT.plastic, flat: 0.8 }, { bevel: 1.5, thickness: 1 });
    m.slab([[9, 13], [14, 13], [8.5, 19]], 4, [255, 255, 255], { ...MAT.plastic, flat: 0.8 }, { bevel: 0.6, thickness: 0.5 });
    const c = m.render({ light: [-0.3, -0.5, 0.8], ambient: 0.8 });
    fn(c);
    return c;
  };
  const ink = [12, 10, 14];
  const text = (c, rows, x0, y0, col = ink) => rows.forEach((r, y) => [...r].forEach((ch, x) => ch === '#' && c.set(x0 + x, y0 + y, col)));
  out.push(draw((c) => text(c, ['##.##.##', '##.##.##'], 8, 7))); // ...
  out.push(draw((c) => text(c, ['.###.', '#...#', '...#.', '..#..', '.....', '..#..'], 10, 4))); // ?
  out.push(draw((c) => text(c, ['#', '#', '#', '#', '.', '#'], 12, 4))); // !
  out.push(draw((c) => text(c, ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'], 9, 4, [210, 24, 30]))); // heart
  out.push(draw((c) => text(c, ['#..#..###.#..#', '#..#.#....#..#', '#..#.#.##.####', '#..#.#..#.#..#', '.##...###.#..#'], 5, 5))); // UGH
  out.push(draw((c) => text(c, ['.#....##..###..##', '##...#....#...#..', '.#....#...##..#..', '.#.....#..#...#..', '###..##...###..##'], 4, 5))); // 1 SEC
  return sheet(out);
}

export default [
  { name: 'coworker-dale', out: OUT('dale'), draw: daleSheet },
  { name: 'coworker-vera', out: OUT('vera'), draw: veraSheet },
  { name: 'coworker-gus', out: OUT('gus'), draw: gusSheet },
  { name: 'coworker-terry', out: OUT('terry'), draw: terrySheet },
  { name: 'coworker-benny', out: OUT('benny'), draw: bennySheet },
  { name: 'speech-bubbles', out: 'assets/sprites/fx/bubbles.png', draw: bubbles },
];
