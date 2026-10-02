import test from 'node:test';
import assert from 'node:assert/strict';
import { noteToFreq, parsePattern, compileSong } from '../src/engine/audio/music.js';
import { renderSynth, SYNTH_RATE } from '../src/engine/audio/synth.js';
import { registry } from './helpers.js';

test('note names map to frequencies', () => {
  assert.ok(Math.abs(noteToFreq('A4') - 440) < 1e-9);
  assert.ok(Math.abs(noteToFreq('A5') - 880) < 1e-9);
  assert.ok(Math.abs(noteToFreq('C4') - 261.6256) < 1e-3);
});

test('patterns parse notes, rests and holds', () => {
  const steps = parsePattern('C4 . - E4');
  assert.equal(steps.length, 4);
  assert.ok(steps[0]);
});

test('every song compiles', () => {
  for (const song of registry.songs.values()) {
    if (song.src) continue;
    assert.doesNotThrow(() => compileSong(song), song.id);
  }
});

test('every synth sound renders audible samples of a sane length', () => {
  for (const s of registry.sounds.values()) {
    if (!s.synth) continue;
    const buf = renderSynth(s.synth, SYNTH_RATE, s.id);
    const data = buf.data ?? buf;
    assert.ok(data.length > SYNTH_RATE * 0.02 && data.length < SYNTH_RATE * 8, `${s.id}: ${data.length} samples`);
    let peak = 0;
    for (const v of data) peak = Math.max(peak, Math.abs(v));
    assert.ok(peak > 0.01, `${s.id} is not silent`);
    assert.ok(peak <= 1.0001, `${s.id} does not clip`);
  }
});
