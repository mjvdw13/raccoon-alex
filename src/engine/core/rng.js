/** Small, fast, seedable PRNG (mulberry32) so game logic can be deterministic in tests. */
export class Rng {
  constructor(seed = Date.now()) {
    this.seed(seed);
  }

  seed(s) {
    this.state = s >>> 0 || 0x9e3779b9;
  }

  /** Float in [0, 1). */
  next() {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Float in [a, b). */
  range(a, b) {
    return a + (b - a) * this.next();
  }

  /** Integer in [a, b] (inclusive). */
  int(a, b) {
    return a + Math.floor(this.next() * (b - a + 1));
  }

  chance(p) {
    return this.next() < p;
  }

  pick(list) {
    return list[Math.floor(this.next() * list.length)];
  }

  /** Damage/amount spec: a number, or [min, max] inclusive. */
  roll(spec) {
    if (Array.isArray(spec)) return this.int(spec[0], spec[1]);
    return spec ?? 0;
  }

  /** Symmetric float in [-1, 1). */
  signed() {
    return this.next() * 2 - 1;
  }
}
