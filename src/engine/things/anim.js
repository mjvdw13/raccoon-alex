/**
 * Shared animation playback for things and first-person weapons. Subclasses
 * must provide `this.def.anims` (normalized animations from defs.js).
 */
export class Animated {
  constructor() {
    this.anim = null;
    this.animName = null;
    this.animPos = 0;
    this.animTime = 0;
    this.animDone = false;
    this.pendingEvent = null;
    this.frame = 0;
    this.fullbright = false;
  }

  /** Switch animation. Returns false if the definition has no such animation. */
  setAnim(name, restart = true) {
    const anim = this.def?.anims?.[name];
    if (!anim) return false;
    if (!restart && this.animName === name && !this.animDone) return true;
    this.anim = anim;
    this.animName = name;
    this.animPos = 0;
    this.animTime = 0;
    this.animDone = false;
    this.frame = anim.frames[0];
    this.fullbright = !!this.def.fullbright || anim.fullbright[0];
    this.pendingEvent = anim.events[0];
    return true;
  }

  /**
   * Advance by dt seconds. Frame events (e.g. 'fire') are reported through
   * onEvent. Returns true on the tick a non-looping animation finishes.
   */
  stepAnim(dt, onEvent) {
    const a = this.anim;
    if (!a) return false;
    if (this.pendingEvent) {
      const ev = this.pendingEvent;
      this.pendingEvent = null;
      onEvent?.(ev);
      if (this.anim !== a) return false;
    }
    if (this.animDone) return false;
    this.animTime += dt;
    while (this.animTime >= a.durations[this.animPos]) {
      this.animTime -= a.durations[this.animPos];
      if (this.animPos + 1 >= a.frames.length) {
        if (a.loop) {
          this.animPos = 0;
        } else {
          this.animDone = true;
          return true;
        }
      } else {
        this.animPos++;
      }
      this.frame = a.frames[this.animPos];
      this.fullbright = !!this.def.fullbright || a.fullbright[this.animPos];
      const ev = a.events[this.animPos];
      if (ev) {
        onEvent?.(ev);
        if (this.anim !== a) return false;
      }
    }
    return false;
  }
}
