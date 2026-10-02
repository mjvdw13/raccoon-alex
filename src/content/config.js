// Game-wide settings the engine reads from content.
export default {
  /** Font ids used by the engine for each role. */
  fonts: { small: 'small', big: 'big', hud: 'hud', tiny: 'tiny', gold: 'gold' },
  /** Keys (access badges). `icon` is the frame in assets/ui/hud-icons.png; `ramp` colours the automap. */
  keys: [
    { id: 'blue', name: 'BLUE BADGE', icon: 0, ramp: 'steel' },
    { id: 'yellow', name: 'YELLOW BADGE', icon: 1, ramp: 'yellow' },
    { id: 'red', name: 'RED BADGE', icon: 2, ramp: 'blood' },
  ],
  colors: { message: 'beige' },
  titleMusic: 'title',
  intermissionMusic: 'intermission',
  /** Where a custom face photo goes on the title screen (see hero.js). */
  titlePortrait: { x: 22, y: 64 },
};
