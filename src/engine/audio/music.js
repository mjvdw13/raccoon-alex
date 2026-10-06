/**
 * A small tracker-style sequencer for synth music, played with Web Audio.
 *
 * Songs are data (see defineSong and src/content/music/):
 *   {
 *     id: 'office', bpm: 112, stepsPerBeat: 4,
 *     echo: { time: 0.375, feedback: 0.35 },
 *     instruments: {
 *       bass: { wave: 'saw', cutoff: 700, resonance: 6, attack: 0.005, decay: 0.2, sustain: 0.5, release: 0.08, volume: 0.5 },
 *       hat:  { drum: 'hat', volume: 0.3 },
 *     },
 *     patterns: { a: { bass: 'A1 . A1 . A2 - A1 .', hat: 'x . x . x . x .' } },
 *     sequence: ['a', 'a'],
 *   }
 * Pattern tokens (one per step, '|' is ignored):
 *   A2, C#3, Eb4   play a note (A2+C3+E3 for a chord, add ! for an accent: A2!)
 *   .              keep holding the previous note (or rest)
 *   -              release the previous note
 *   x X o          drum hit: normal, accent, soft
 * A song can instead be an audio file: { id, src: 'assets/music/theme.ogg' }.
 */

const NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** 'A4' -> 440. Returns null for anything that isn't a note. */
export function noteToFreq(name) {
  const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(name);
  if (!m) return null;
  const n = NOTE_INDEX[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = (Number(m[3]) + 1) * 12 + n;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Parse one pattern string into step events. */
export function parsePattern(str) {
  const steps = [];
  for (const raw of String(str).split(/\s+/)) {
    if (!raw || raw === '|') continue;
    if (raw === '.') steps.push({ type: 'hold' });
    else if (raw === '-') steps.push({ type: 'off' });
    else if (raw === 'x') steps.push({ type: 'hit', vel: 1 });
    else if (raw === 'X') steps.push({ type: 'hit', vel: 1.35 });
    else if (raw === 'o') steps.push({ type: 'hit', vel: 0.5 });
    else {
      const accent = raw.endsWith('!');
      const names = (accent ? raw.slice(0, -1) : raw).split('+');
      const freqs = names.map(noteToFreq);
      if (freqs.some((f) => f === null)) throw new Error(`Bad note token "${raw}"`);
      steps.push({ type: 'note', freqs, vel: accent ? 1.3 : 1 });
    }
  }
  return steps;
}

/** Flatten a song into a timeline: timeline[step] = [{ch, ev}]. */
export function compileSong(song) {
  const order = song.sequence ?? Object.keys(song.patterns ?? {});
  const timeline = [];
  for (const name of order) {
    const pat = song.patterns?.[name];
    if (!pat) throw new Error(`Song "${song.id}": unknown pattern "${name}"`);
    const parsed = Object.entries(pat).map(([ch, s]) => [ch, parsePattern(s)]);
    const len = Math.max(...parsed.map(([, s]) => s.length));
    for (let i = 0; i < len; i++) {
      const events = [];
      for (const [ch, steps] of parsed) {
        const ev = steps.length ? steps[i % steps.length] : null;
        if (ev && ev.type !== 'hold') events.push({ ch, ev });
      }
      timeline.push(events);
    }
  }
  return timeline;
}

const PULSE_CACHE = new WeakMap();

function pulseWave(ctx, duty) {
  let byDuty = PULSE_CACHE.get(ctx);
  if (!byDuty) PULSE_CACHE.set(ctx, (byDuty = new Map()));
  if (byDuty.has(duty)) return byDuty.get(duty);
  const n = 32;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let k = 1; k < n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  const w = ctx.createPeriodicWave(real, imag);
  byDuty.set(duty, w);
  return w;
}

export class MusicPlayer {
  /** @param {import('./audio.js').AudioSystem} audio */
  constructor(audio) {
    this.audio = audio;
    this.song = null;
    this.timer = null;
    this.element = null;
    this.voices = new Map();
  }

  get ctx() {
    return this.audio.ctx;
  }

  play(song) {
    if (this.song === song) return;
    this.stop();
    this.song = song;
    if (!song || !this.ctx) return;
    if (song.src) {
      this.element = new Audio(song.src);
      this.element.loop = song.loop ?? true;
      this.element.volume = Math.min(1, this.audio.musicLevel * (song.volume ?? 1));
      this.element.play().catch(() => {});
      return;
    }
    try {
      this.timeline = compileSong(song);
    } catch (err) {
      console.warn(err);
      this.song = null;
      return;
    }
    const ctx = this.ctx;
    this.bus = ctx.createGain();
    this.bus.gain.value = song.volume ?? 1;
    this.bus.connect(this.audio.musicGain);
    const echo = song.echo ?? { time: 0.3, feedback: 0.3 };
    this.echoIn = ctx.createGain();
    this.delay = ctx.createDelay(2);
    this.delay.delayTime.value = echo.time;
    this.feedback = ctx.createGain();
    this.feedback.gain.value = echo.feedback ?? 0.3;
    this.echoIn.connect(this.delay);
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delay.connect(this.bus);
    this.stepDur = 60 / (song.bpm ?? 120) / (song.stepsPerBeat ?? 4);
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.12;
    this.timer = setInterval(() => this._schedule(), 25);
    this._schedule();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.element) {
      this.element.pause();
      this.element = null;
    }
    if (this.bus && this.ctx) {
      const t = this.ctx.currentTime;
      this.bus.gain.setTargetAtTime(0, t, 0.05);
      const bus = this.bus;
      const delay = this.delay;
      setTimeout(() => {
        bus.disconnect();
        delay?.disconnect();
      }, 400);
    }
    this.bus = null;
    this.voices.clear();
    this.song = null;
  }

  setVolume(level) {
    if (this.element) this.element.volume = Math.min(1, level * (this.song?.volume ?? 1));
  }

  _schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.song || !this.timeline.length) return;
    while (this.nextTime < ctx.currentTime + 0.15) {
      const events = this.timeline[this.step];
      for (const { ch, ev } of events) this._event(ch, ev, this.nextTime);
      let dur = this.stepDur;
      const swing = this.song.swing ?? 0;
      if (swing) dur *= this.step % 2 === 0 ? 1 + swing : 1 - swing;
      this.nextTime += dur;
      this.step++;
      if (this.step >= this.timeline.length) {
        if (this.song.loop === false) {
          clearInterval(this.timer);
          this.timer = null;
          return;
        }
        this.step = this.song.loopStart ?? 0;
      }
    }
  }

  _event(ch, ev, time) {
    const inst = this.song.instruments?.[ch];
    if (!inst) return;
    if (inst.drum) {
      if (ev.type === 'hit' || ev.type === 'note') this._drum(inst, time, ev.vel ?? 1);
      return;
    }
    const prev = this.voices.get(ch);
    if (prev) {
      prev.release(time);
      this.voices.delete(ch);
    }
    if (ev.type === 'note') this.voices.set(ch, this._voice(inst, ev.freqs, time, ev.vel));
  }

  _out(inst) {
    const ctx = this.ctx;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) {
      pan.pan.value = inst.pan ?? 0;
      pan.connect(this.bus);
    }
    const node = pan ?? this.bus;
    if (inst.echo) {
      const send = ctx.createGain();
      send.gain.value = inst.echo;
      send.connect(this.echoIn);
      return { node, send };
    }
    return { node, send: null };
  }

  _voice(inst, freqs, time, vel) {
    const ctx = this.ctx;
    const { node, send } = this._out(inst);
    const amp = ctx.createGain();
    const peak = (inst.volume ?? 0.3) * vel;
    const attack = inst.attack ?? 0.005;
    const decay = inst.decay ?? 0.2;
    const sustain = inst.sustain ?? 0.6;
    amp.gain.setValueAtTime(0, time);
    amp.gain.linearRampToValueAtTime(peak, time + attack);
    amp.gain.setTargetAtTime(peak * sustain, time + attack, decay / 3 + 0.001);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const cutoff = inst.cutoff ?? 4000;
    filter.Q.value = inst.resonance ?? 1;
    if (inst.filterEnv) {
      filter.frequency.setValueAtTime(cutoff * (1 + inst.filterEnv), time);
      filter.frequency.setTargetAtTime(cutoff, time + attack, (inst.filterDecay ?? 0.15) / 3);
    } else {
      filter.frequency.value = cutoff;
    }
    filter.connect(amp);
    amp.connect(node);
    if (send) amp.connect(send);
    const oscs = [];
    const unison = inst.unison ?? 1;
    for (const f of freqs) {
      for (let u = 0; u < unison; u++) {
        const osc = ctx.createOscillator();
        const wave = inst.wave ?? 'saw';
        if (wave === 'pulse') osc.setPeriodicWave(pulseWave(ctx, inst.duty ?? 0.25));
        else osc.type = wave === 'saw' ? 'sawtooth' : wave;
        const det = unison > 1 ? ((u / (unison - 1)) * 2 - 1) * (inst.detune ?? 8) : (inst.detune ?? 0);
        osc.frequency.setValueAtTime(f * Math.pow(2, inst.octave ?? 0), time);
        osc.detune.value = det;
        if (inst.vibrato) {
          const lfo = ctx.createOscillator();
          const depth = ctx.createGain();
          lfo.frequency.value = inst.vibrato.rate ?? 5;
          depth.gain.value = inst.vibrato.depth ?? 10;
          lfo.connect(depth);
          depth.connect(osc.detune);
          lfo.start(time);
          oscs.push(lfo);
        }
        osc.connect(filter);
        osc.start(time);
        oscs.push(osc);
      }
    }
    const release = inst.release ?? 0.1;
    let released = false;
    const voice = {
      release: (t) => {
        if (released) return;
        released = true;
        amp.gain.cancelScheduledValues(t);
        amp.gain.setTargetAtTime(0, t, release / 3 + 0.001);
        for (const o of oscs) o.stop(t + release + 0.2);
      },
    };
    // Safety: never let a voice ring forever.
    voice.release(time + (inst.maxLength ?? 8));
    released = false;
    return voice;
  }

  _noise() {
    if (this._noiseBuf) return this._noiseBuf;
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let s = 22222;
    for (let i = 0; i < d.length; i++) {
      s = (s * 16807) % 2147483647;
      d[i] = (s / 2147483647) * 2 - 1;
    }
    this._noiseBuf = buf;
    return buf;
  }

  _drum(inst, time, vel) {
    const ctx = this.ctx;
    const { node, send } = this._out(inst);
    const g = ctx.createGain();
    g.connect(node);
    if (send) g.connect(send);
    const v = (inst.volume ?? 0.5) * vel;
    const kind = inst.drum;
    if (kind === 'kick' || kind === 'tom') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const f0 = inst.freq ?? (kind === 'kick' ? 150 : 220);
      const f1 = inst.freqEnd ?? (kind === 'kick' ? 42 : 90);
      const len = inst.length ?? (kind === 'kick' ? 0.28 : 0.3);
      osc.frequency.setValueAtTime(f0, time);
      osc.frequency.exponentialRampToValueAtTime(f1, time + len * 0.5);
      g.gain.setValueAtTime(v, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + len);
      osc.connect(g);
      osc.start(time);
      osc.stop(time + len + 0.05);
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = this._noise();
    const filter = ctx.createBiquadFilter();
    let len = 0.05;
    if (kind === 'snare') {
      filter.type = 'highpass';
      filter.frequency.value = 1200;
      len = inst.length ?? 0.16;
      const body = ctx.createOscillator();
      const bg = ctx.createGain();
      body.type = 'triangle';
      body.frequency.setValueAtTime(190, time);
      bg.gain.setValueAtTime(v * 0.7, time);
      bg.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
      body.connect(bg);
      bg.connect(node);
      body.start(time);
      body.stop(time + 0.12);
    } else if (kind === 'clap') {
      filter.type = 'bandpass';
      filter.frequency.value = 1500;
      len = inst.length ?? 0.12;
    } else {
      filter.type = 'highpass';
      filter.frequency.value = inst.cutoff ?? 7000;
      len = inst.length ?? (kind === 'openhat' ? 0.25 : 0.045);
    }
    g.gain.setValueAtTime(v, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + len);
    src.connect(filter);
    filter.connect(g);
    src.start(time, Math.random() * 0.5);
    src.stop(time + len + 0.05);
  }
}
