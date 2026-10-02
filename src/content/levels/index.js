// Levels and episodes. To add a level: create a file like e1m1.js, import it
// here and add its id to an episode's `levels` list (or make a new episode).
import { defineEpisode } from '../../engine/defs.js';
import strings from '../strings.js';
import e1m1 from './e1m1.js';

export const levels = [e1m1];

export const episodes = [
  defineEpisode({
    id: 'e1',
    name: strings.episodeName,
    levels: ['e1m1'],
    finale: { text: strings.finale, background: 'finale-bg', endImage: 'finale-end', endText: 'THE END?', music: 'finale' },
  }),
];
