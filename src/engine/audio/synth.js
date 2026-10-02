/**
 * Tiny sfxr-style synthesizer. Sound definitions are plain parameter objects,
 * rendered once into sample buffers. Pure JS (no Web Audio), so it can be
 * unit-tested in Node.
 *
 * Parameters (all optional except duration):
 *   duration     seconds
 *   wave         'square' | 'pulse' | 'saw' | 'triangle' | 'sine' | 'noise'
 *   freq         start frequency (Hz); freqEnd: end frequency (exponential slide)
 *   slide        seconds the slide takes (default: whole duration)
 *   duty         pulse width 0..1 (square/pulse)
 *   noiseHold    for noise: hold each random value this many samples (lower = hiss, higher = rumble)
 *   attack, decay, sustain (level 0..1), release   envelope in seconds
 *   vibrato      { rate: Hz, depth: semitones }
 *   lowpass      cutoff Hz, or [start, end] for a sweep; highpass: cutoff Hz
 *   distortion   0..1 soft clipping drive
 *   bits         bit-crush depth (e.g. 6); downsample: hold every N samples
 *   volume       0..1
 *   delay        seconds of silence before this layer starts
 *   repeat       { count, interval, decay?: volume factor per repeat, pitch?: freq factor per repeat }
 *   echo         { time, feedback, mix }
 *   layers       [params, ...] mixed on top (each can have its own delay)
 *   seed         random seed for noise (default from the sound id)
 */

export const SYNTH_RATE = 22050;

function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296) * 2 - 1;
  };
}

function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function renderLayer(p, rate, seed) {
  const duration = Math.max(0.005, p.duration ?? 0.2);
  const n = Math.ceil(duration * rate);
  const out = new Float32Array(n);
  const rnd = seeded(p.seed ?? seed);
  const wave = p.wave ?? 'square';
  const f0 = p.freq ?? 440;
  const f1 = p.freqEnd ?? f0;
  const slide = p.slide ?? duration;
  const duty = p.duty ?? 0.5;
  const attack = p.attack ?? 0.005;
  const decay = p.decay ?? 0;
  const sustain = p.sustain ?? 1;
  const release = Math.min(p.release ?? 0.05, duration);
  const vib = p.vibrato;
  const hold = Math.max(1, p.noiseHold ?? 1);
  let phase = 0;
  let noiseVal = rnd();
  let noiseCount = 0;
  const lp = p.lowpass;
  const lpStart = Array.isArray(lp) ? lp[0] : lp;
  const lpEnd = Array.isArray(lp) ? lp[1] : lp;
  let lpState = 0;
  let hpState = 0;
  let hpPrev = 0;
  const hpA = p.highpass ? 1 / (1 + (2 * Math.PI * p.highpass) / rate) : 0;
  const drive = p.distortion ?? 0;

  for (let i = 0; i < n; i++) {
    const t = i / rate;
    // Frequency with exponential slide and vibrato.
    let f = f0;
    if (f1 !== f0) {
      const k = Math.min(1, t / slide);
      f = f0 * Math.pow(f1 / f0, k);
    }
    if (vib) f *= Math.pow(2, (Math.sin(2 * Math.PI * vib.rate * t) * vib.depth) / 12);
    phase += f / rate;
    phase -= Math.floor(phase);

    let s;
    switch (wave) {
      case 'sine':
        s = Math.sin(2 * Math.PI * phase);
        break;
      case 'triangle':
        s = 1 - 4 * Math.abs(phase - 0.5);
        break;
      case 'saw':
        s = 2 * phase - 1;
        break;
      case 'noise':
        if (++noiseCount >= hold) {
          noiseCount = 0;
          noiseVal = rnd();
        }
        s = noiseVal;
        break;
      case 'pulse':
      case 'square':
      default:
        s = phase < duty ? 1 : -1;
        break;
    }

    // Filters.
    if (lpStart) {
      const cutoff = lpStart + (lpEnd - lpStart) * (t / duration);
      const a = Math.min(1, (2 * Math.PI * cutoff) / rate);
      lpState += a * (s - lpState);
      s = lpState;
    }
    if (hpA) {
      const y = hpA * (hpState + s - hpPrev);
      hpPrev = s;
      hpState = y;
      s = y;
    }
    if (drive) s = Math.tanh(s * (1 + drive * 8)) / Math.tanh(1 + drive * 8);

    // ADSR envelope.
    let env;
    if (t < attack) env = t / attack;
    else if (t < attack + decay) env = 1 - (1 - sustain) * ((t - attack) / decay);
    else env = sustain;
    const tr = duration - t;
    if (tr < release) env *= tr / release;
    out[i] = s * env * (p.volume ?? 1);
  }
  return out;
}

function mixInto(dst, src, offset, gain = 1) {
  for (let i = 0; i < src.length && offset + i < dst.length; i++) {
    if (offset + i >= 0) dst[offset + i] += src[i] * gain;
  }
}

function lengthOf(p) {
  let len = (p.delay ?? 0) + (p.duration ?? 0.2);
  if (p.repeat) len += (p.repeat.count - 1) * p.repeat.interval;
  if (p.echo) len += p.echo.time * 4;
  for (const l of p.layers ?? []) len = Math.max(len, lengthOf(l) + (p.delay ?? 0));
  return len;
}

/** Render a sound definition's synth parameters into mono samples (-1..1). */
export function renderSynth(params, rate = SYNTH_RATE, id = 'sound') {
  const seed = hashString(id);
  const total = new Float32Array(Math.ceil(lengthOf(params) * rate) + 1);
  const render = (p, baseDelay, depth) => {
    const start = Math.round(((p.delay ?? 0) + baseDelay) * rate);
    if (p.repeat) {
      const { count, interval, decay = 1, pitch = 1 } = p.repeat;
      for (let k = 0; k < count; k++) {
        const pk = { ...p, repeat: undefined, layers: undefined, echo: undefined, delay: 0 };
        if (pitch !== 1) {
          pk.freq = (p.freq ?? 440) * Math.pow(pitch, k);
          if (p.freqEnd) pk.freqEnd = p.freqEnd * Math.pow(pitch, k);
        }
        mixInto(total, renderLayer(pk, rate, seed + k + depth * 97), start + Math.round(k * interval * rate), Math.pow(decay, k));
      }
    } else {
      mixInto(total, renderLayer(p, rate, seed + depth * 97), start);
    }
    for (const l of p.layers ?? []) render(l, (p.delay ?? 0) + baseDelay, depth + 1);
  };
  render(params, 0, 0);

  if (params.echo) {
    const { time = 0.15, feedback = 0.35, mix = 0.35 } = params.echo;
    const d = Math.round(time * rate);
    for (let i = d; i < total.length; i++) total[i] += total[i - d] * feedback * mix;
  }
  if (params.bits || params.downsample) {
    const levels = params.bits ? Math.pow(2, params.bits - 1) : 0;
    const hold = params.downsample ?? 1;
    let held = 0;
    for (let i = 0; i < total.length; i++) {
      if (i % hold === 0) held = levels ? Math.round(total[i] * levels) / levels : total[i];
      total[i] = held;
    }
  }
  let peak = 0;
  for (let i = 0; i < total.length; i++) peak = Math.max(peak, Math.abs(total[i]));
  if (peak > 1) for (let i = 0; i < total.length; i++) total[i] /= peak;
  return total;
}
