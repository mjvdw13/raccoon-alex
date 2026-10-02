import { defineLevel } from '../../engine/defs.js';

// TEMPORARY test map (replaced by the real E1M1 later).
export default defineLevel({
  id: 'e1m1',
  mapLabel: 'E1M1',
  name: 'CUBICLE FARM',
  music: 'office',
  sky: 'sky-city',
  par: 90,
  tiles: [
    '########################',
    '#......#.....#.........#',
    '#..:...D..;..D....:....#',
    '#......#.....#.........#',
    '####D###.....####1######',
    '#......#.....#eeeeeeeee#',
    '#..CC..#..*..LeeeeeeeeX#',
    '#..CC..D.....#eeeeeeeee#',
    '#......#######EEEEEEEEE#',
    '########################',
  ],
  things: [
    '                        ',
    '  ^  d  s  i     m      ',
    '        3       a       ',
    '   b      W       c     ',
    '                        ',
    '  o    S                ',
    '  i         l           ',
    '                        ',
  ],
});
