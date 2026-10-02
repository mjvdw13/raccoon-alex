// Shared synth patches for the soundtrack (see src/engine/audio/music.js).
export const bass = { wave: 'saw', cutoff: 420, resonance: 8, filterEnv: 3.5, filterDecay: 0.14, attack: 0.004, decay: 0.16, sustain: 0.5, release: 0.06, volume: 0.3 };
export const sub = { wave: 'square', cutoff: 260, resonance: 2, attack: 0.005, decay: 0.3, sustain: 0.7, release: 0.1, volume: 0.22 };
export const arp = { wave: 'pulse', duty: 0.25, cutoff: 2400, resonance: 3, attack: 0.002, decay: 0.12, sustain: 0.25, release: 0.08, volume: 0.1, echo: 0.35 };
export const pad = { wave: 'saw', unison: 3, detune: 10, cutoff: 1000, resonance: 1, attack: 0.7, decay: 1, sustain: 0.8, release: 1.4, volume: 0.06, maxLength: 12 };
export const lead = { wave: 'square', cutoff: 1800, resonance: 2, attack: 0.01, decay: 0.25, sustain: 0.6, release: 0.18, volume: 0.09, vibrato: { rate: 5.5, depth: 14 }, echo: 0.3 };
export const bell = { wave: 'sine', attack: 0.002, decay: 0.7, sustain: 0, release: 0.5, volume: 0.13, echo: 0.55 };
export const pluck = { wave: 'triangle', attack: 0.002, decay: 0.3, sustain: 0.04, release: 0.12, volume: 0.17, echo: 0.3 };
export const stab = { wave: 'saw', unison: 2, detune: 12, cutoff: 1600, filterEnv: 2, filterDecay: 0.1, attack: 0.003, decay: 0.2, sustain: 0.2, release: 0.1, volume: 0.08 };
export const kick = { drum: 'kick', volume: 0.5 };
export const snare = { drum: 'snare', volume: 0.28 };
export const hat = { drum: 'hat', volume: 0.09 };
export const openhat = { drum: 'openhat', volume: 0.08 };
export const clap = { drum: 'clap', volume: 0.2 };
export const tom = { drum: 'tom', volume: 0.35 };
