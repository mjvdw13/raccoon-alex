import { defineLevel } from '../../engine/defs.js';

// E1M1: CUBICLE FARM. 3:07 AM, the 13th floor. Alex steps out of the
// elevator into a brightly lit, ordinary office. The lobby is safe: no
// bugs, just the coworkers pulling an all-nighter, and his staple gun
// waiting in front of the elevator (he starts with only his paws). The night only goes
// wrong once he walks out through one of its doors (closed doors keep the
// bugs from seeing or hearing him in there).
//
// Route: lobby (staple gun) -> cubicle farm -> conference room (tack shotgun; taking it
// opens the closets) -> manager's office (blue badge) -> back through the
// break room -> blue door -> copy room -> stairwell exit.
// Secrets: the cubicle without a door (top right of the farm), the vending
// machine on the break room's south wall, and the dark panel on the east wall
// of the manager's office (rooftop balcony with the Chicago Typewriter).
export default defineLevel({
id: 'e1m1',
  mapLabel: 'E1M1',
  name: 'CUBICLE FARM',
  music: 'office',
  sky: 'sky-city',
  par: 90,
  legend: {
    x: { base: 'r', tag: 'conf' }, // conference room floor (its lights go out)
    q: { door: 'door-office', jamb: 'door-jamb', lock: 'remote', tag: 'closets' },
    u: { door: 'cubicle', secret: true },
    v: { door: 'vending', secret: true },
    y: { door: 'wood-panel-dark', secret: true },
    z: { floor: 'concrete-floor', ceiling: 'sky', light: 168, secret: true },
    a: { base: '.', light: 212 }, // the lobby: brighter than the rest of the floor
    p: { base: ':', light: 244 }, // lobby ceiling lights
    h: { base: ':', tag: 'left-lobby' }, // just past the lobby's north door
    i: { base: '_', tag: 'left-lobby' }, // just past the lobby's east door
  },
  thingLegend: {
    Z: { type: 'firefly', tag: 'closet-flies' },
    9: { type: 'firefly', tag: 'closet-flies', skill: [3, 4, 5] },
  },
  // Coworkers (friendlies) and the staple gun, listed by position rather than
  // in the things grid. The coworkers are working late in the lobby outside
  // the elevator, off to the sides; the staple gun is in the middle.
  list: [
    { type: 'pickup-staple-gun', x: 12.5, y: 28.5 },
    { type: 'dale', x: 9.5, y: 25.5 },
    { type: 'vera', x: 9.5, y: 31.5 },
    { type: 'terry', x: 12.5, y: 32.5 },
    { type: 'gus', x: 10.5, y: 22.5 },
    { type: 'benny', x: 13.5, y: 30.5 },
  ],
  tiles: [
    '                                                               ',
    ' #############B#####B######## ##### ##### wwNwNNwNNwNNwNNww    ',
    ' #,+,,,,,,,,,,,,,,,,,,,,,,,,# #...# #...# wrrrrrrrrrrrrrrrw    ',
    ' #,,,,,,,,,,,,,,,,,,,,,,,,,,# #...# #...# wrrrrrrrrrrrrrrrw    ',
    ' #,,CCCC,,c,,c,,CCCC,,PPPP,,# #...# #...# wrrrrrrrrrrrrrrrwOOOO',
    ' #,,C,,C,,c,,c,,C,,C,,P??P,,#WWWqWWBBWqWWWWrrrrrrrrrrrrrrrwzzzO',
    ' #,,C,,C,,c,,c,,C,,C,,P??P,,#xxxxxxxxxxxxxWrrrrrr:::rrrrrrwzzzO',
    ' #,,C,,C,,cccc,,C,,C,,PuPP,,#xxxxxxxxxxxxxWrrrrrr:::rrrrrrwzzzO',
    ' #,,,,,,,,,,,,,,,,,,,,,,,,,,#xxxxxxxxxxxxxWrrrrrr:::rrrrrryzzzO',
    ' #,,,;,,,,,;,,,,,;,,,,,;,,,,DxxxxxxxxxxxxxWrrrrrrrrrrrrrrrwzzzO',
    ' #,,,,,,,,,,,,,,,,,,,,,,,,,,#xxxxxxxxxxxxxWrrrrrrrrrrrrrrrwzzzO',
    ' #,,Q,,Q,,CCCC,,c,,c,,CCCC,,#xxxxxxxxxxxxxDrrrrrrrrrrrrrrrwzzzO',
    ' #,,Q,,Q,,C,,C,,c,,c,,C,,C,,#xxxxxxxxxxxxxWrrrrrrrrrrrrrrrwOOOO',
    ' #,,Q,,Q,,C,,C,,c,,c,,C,,C,,#xxxxxxxxxxxxxWrrrrrrrrrrrrrrrw    ',
    ' #,,QQQQ,,C,,C,,cccc,,C,,C,,#xxxxxxxxxxxxxWrrrrrrrrrrrrrrrw    ',
    ' #,,,,,,,,,,,,,,,,,,,,,,,,,,#xxxxxxxxxxxxxWwwwwwwwwwwwwwwww    ',
    ' #,,,,,,,,,:::,,,,,,,,,,,,,,#xxxxxxxxxxxxxW...............#    ',
    ' #,,,,,,,,,:::,,,,,,,,,,,,,,#WWWWWDWWWWWWWW...............#    ',
    ' #,,,,,,,,,:h:,,,,,,,,,,,,,!#    #_#      #...............#    ',
    ' ###########D#####################_###    #...............#    ',
    '     WaaaaaaaaaaaaaW_________________#    #...;.......;...#    ',
    '     WaaaaaaaaaaaaaW_________________#    #...............#    ',
    '     WaaaaaaaaaaaaaW_________________V    #...............#    ',
    '     WaaapaaaaapaaaW_________________V    #...............#    ',
    '     WaaaaaaaaaaaaaW____=_______=____V    #...............#    ',
    'EEEEEEaaaaaaaaaaaaaW_________________#    #...............#    ',
    'EeeeeEaaaaaaaaaaaaaW_________________#    #...............#    ',
    'EeeeeEaaaaaaaaaaaaaW_________________######...............#    ',
    'EeeeeLaaapaaaaapaaaW______________________1...............#    ',
    'EeeeeEaaaaaaaaaaaaaW_________________######...;.......;...#    ',
    'EeeeeEaaaaaaaaaaaaaDi________________#    #...............#    ',
    'EEEEEEaaaaaaaaaaaaaW_________________#    #...............#    ',
    '     WaaapaaaaapaaaW____=_______=____#    #...............#    ',
    '     WaaaaaaaaaaaaaW_________________#    ########M########    ',
    '     WaaaaaaaaaaaaaW_________________#        H-------H        ',
    '     WaaaaaaaaaaaaaW_________________#        H-------H        ',
    '     WaaaaaaaaaaaaaW_________________#        H-------H        ',
    '     WWWWWWWAWWWWWWW####v#############        H-------H        ',
    '                      #???#                   H-------H        ',
    '                      #???#                   H-------H        ',
    '                      #???#                   H-------H        ',
    '                      #####                   HHHHXHHHH        ',
  ],
  things: [
    '',
    '',
    '  ;                        ;',
    '         d                m    Z 9   Z 9    l;          l',
    '                                                  h   &',
    '     h      H          p                         HHH',
    '      i           h     z                                   4',
    '                                                  b',
    '                                                             U',
    '        ,     ,     @             h',
    '  ;                             hHHHH         m             S',
    '                                 HHHHh',
    '      h           i     h          h                   m',
    '           ih    H      !                   F           a',
    '                                   3',
    '                              t         F',
    '                    ,    s',
    '   m    k            k                      X  X  X      L',
    '  +                                                    m L',
    '                                                         L',
    '      F           F W',
    '                  L                @              ,',
    '       ,    h    ,L         m',
    '      l  u     u                                i',
    '          HHHHH k                            S',
    '                                                        d',
    '                 =             h                     i',
    '                         HHd  HH',
    '  >      u     u         h            s',
    '',
    '          s          ,              ,             ,',
    '                             d              &       !',
    '         u     u                                        l',
    '      l               i',
    '              HH                 m             Y     Y',
    '              h',
    '      F X         W "               k               i',
    '',
    '                                                i',
    '                        a                         &',
    '                       S ,                           t',
  ],
triggers: [
    { on: 'start', do: [{ action: 'message', text: '13TH FLOOR. 3:07 AM. JUST ANOTHER LATE NIGHT AT THE OFFICE.' }] },
    { on: 'enter', tag: 'left-lobby', do: [{ action: 'message', text: 'THE LIGHTS BUZZ. SOMETHING IS SCREAMING IN THE BREAK ROOM.' }] },
    {
      on: 'pickup',
      thing: 'pickup-tack-shotgun',
      do: [
        { action: 'setLight', tag: 'conf', light: 56 },
        { action: 'openDoors', tag: 'closets' },
        { action: 'message', text: 'MANDATORY TEAM-BUILDING HAS BEGUN.' },
      ],
    },
    { on: 'killed', tag: 'closet-flies', do: [{ action: 'setLight', tag: 'conf', light: 128 }] },
  ],
});
