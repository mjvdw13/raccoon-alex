// Levels and episodes. To add a level: create a file like e1m1.js, import it
// here and add its id to an episode's `levels` list (or make a new episode).
import { defineEpisode } from '../../engine/defs.js';
import strings from '../strings.js';
import e1m1 from './e1m1.js';
import e1m2 from './e1m2.js';
import e1m3 from './e1m3.js';
import e1m4 from './e1m4.js';
import e1m5 from './e1m5.js';

export const levels = [e1m1, e1m2, e1m3, e1m4, e1m5];

export const episodes = [
  defineEpisode({
    id: 'e1',
    name: strings.episodeName,
    levels: ['e1m1', 'e1m2', 'e1m3', 'e1m4', 'e1m5'],
    finale: { text: strings.finale, background: 'finale-bg', endImage: 'finale-end', endText: 'THE END?', music: 'finale' },
  }),
];
