import { defineNpc } from '../engine/defs.js';

// Alex's coworkers, also stuck in the office at 3 AM. They're friendlies: they
// can't be hurt, monsters leave them alone, and they wander around their spot.
// Bump into one (or press Use on them) and they react. Their faces come from
// the photos in assets/custom/coworkers/ (see tools/art/sprites/coworkers.js).
// Sprites are 128x128 frames drawn at half scale, so the faces stay sharp.
const S = (name) => ({ src: `assets/sprites/coworkers/${name}.png`, frameWidth: 128, frameHeight: 128 });

export default [
  // Exasperated. Stands in one spot, sighing at the ceiling.
  defineNpc({
    id: 'dale',
    name: 'DALE',
    glyph: '1',
    sheet: S('dale'),
    scale: 0.5,
    height: 0.8,
    wander: 0,
    anims: {
      idle: { frames: [0, 1, 2, 0], durations: [2.6, 0.9, 1.2, 1.6], loop: true, events: { 2: 'sound:npc-sigh' } },
      react: { frames: [3, 4], durations: [0.7, 1.2] },
    },
    lines: ['*sigh*', 'Ugh. Seriously?', 'Alex. Go home. Sleep.', 'Who books a demon invasion at 3 AM?', "I'm not even on call this week.", 'This is fine. Everything is fine.'],
    bubble: 'bubble-ugh',
    sounds: { react: 'npc-sigh' },
  }),

  // Unimpressed with everything. Arms crossed, slowly pacing.
  defineNpc({
    id: 'vera',
    name: 'VERA',
    glyph: '2',
    sheet: S('vera'),
    scale: 0.5,
    height: 0.78,
    wander: 3,
    speed: 0.8,
    idleTime: [3, 6],
    anims: {
      idle: { frames: [0, 1], durations: [2.8, 1.6], loop: true },
      walk: { frames: [2, 3, 4, 5], fps: 5 },
      react: { frames: [6] },
    },
    lines: ['Cool.', 'Wow. Riveting.', 'Nice eye bags, Alex.', 'A portal to hell. How original.', "I've seen scarier quarterly reviews.", 'Mm-hm.'],
    bubble: 'bubble-dots',
    sounds: { react: 'npc-hmph' },
  }),

  // On the phone, in a pumpkin costume, pacing back and forth.
  defineNpc({
    id: 'gus',
    name: 'GUS',
    glyph: '7',
    // Hand-drawn pixel art at 1:1 (tools/art/sprites/people/gus.js).
    sheet: { src: 'assets/sprites/coworkers/gus.png', frameWidth: 64, frameHeight: 64 },
    height: 0.8,
    wander: 2,
    speed: 0.9,
    idleTime: [1, 2.5],
    anims: {
      idle: { frames: [0, 1], durations: [1.3, 1.1], loop: true },
      walk: { frames: [2, 3, 4, 5], fps: 5 },
      react: { frames: [6] },
    },
    lines: ["Hold on, I'm on the phone.", "Can I call you back? There's a demon.", 'Yes, I am the pumpkin. Why?', 'One sec... no, he looks terrible.', 'Have you tried turning hell off?'],
    bubble: 'bubble-sec',
    sounds: { react: 'npc-phone' },
  }),

  // Confused. Scratches his head and wanders around wondering where he is.
  defineNpc({
    id: 'terry',
    name: 'TERRY',
    glyph: '8',
    sheet: S('terry'),
    scale: 0.5,
    height: 0.8,
    wander: 4,
    speed: 0.9,
    idleTime: [1.5, 4],
    anims: {
      idle: { frames: [0, 1], durations: [0.7, 0.7], loop: true },
      walk: { frames: [2, 3, 4, 5], fps: 5 },
      react: { frames: [6] },
    },
    lines: ['Wait, what?', 'Which floor is this?', 'Was the printer always on fire?', 'Is it Monday?', "Huh? Where'd everyone go?", 'Did I miss a meeting?'],
    bubble: 'bubble-question',
    sounds: { react: 'npc-huh' },
  }),

  // In his Mike Wazowski costume. Just happy to be there.
  defineNpc({
    id: 'benny',
    name: 'BENNY',
    glyph: '0',
    // Hand-drawn pixel art at 1:1 (tools/art/sprites/people/benny.js).
    sheet: { src: 'assets/sprites/coworkers/benny.png', frameWidth: 64, frameHeight: 64 },
    height: 0.55,
    radius: 0.24,
    wander: 3,
    speed: 1.3,
    idleTime: [1, 3],
    anims: {
      idle: { frames: [0, 1, 2, 1], durations: [0.6, 0.3, 0.4, 0.3], loop: true },
      walk: { frames: [3, 4, 5, 6], fps: 8 },
      react: { frames: [7, 2], durations: [0.35, 0.25] },
    },
    lines: ['Hi Alex!!', 'Happy to be here!', 'Trick or treat!', 'Best. Night shift. Ever.', 'I brought candy!', 'Want a candy corn?'],
    bubble: 'bubble-heart',
    sounds: { react: 'npc-yay' },
  }),
];
