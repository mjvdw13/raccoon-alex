import { angleDiff } from '../core/math.js';

/** Frame offsets within a health tier row (Doom's STF layout). */
export const FACE = {
  STRAIGHT: 0, // 0..2 (ahead, left, right)
  TURN_RIGHT: 3,
  TURN_LEFT: 4,
  OUCH: 5,
  GRIN: 6,
  RAMPAGE: 7,
  PER_TIER: 8,
  TIERS: 5,
  GOD: 40,
  DEAD: 41,
};

/** Health tier: 0 = healthy .. 4 = nearly dead. */
export function painTier(health) {
  const h = Math.max(0, Math.min(100, health));
  return Math.min(FACE.TIERS - 1, Math.floor(((100 - h) * FACE.TIERS) / 101));
}

/**
 * Picks the status-bar face each tick, following Doom's priorities: dead >
 * new weapon grin > hurt (ouch / look toward attacker) > rampage > god mode >
 * idle glancing around.
 */
export class FaceController {
  constructor(rng) {
    this.rng = rng;
    this.frame = 0;
    this.priority = 0;
    this.timer = 0;
    this.lastHurt = -1;
    this.lastGrin = -1;
  }

  update(dt, world) {
    const pt = world.player;
    const p = pt.player;
    const tier = painTier(p.health) * FACE.PER_TIER;
    this.timer -= dt;

    if (p.dead) {
      this._set(FACE.DEAD, 10, 1);
    } else if (this.priority < 9 && p.grinTime > this.lastGrin && world.time - p.grinTime < 0.1) {
      this.lastGrin = p.grinTime;
      this._set(tier + FACE.GRIN, 8, 1.2);
    } else if (this.priority < 8 && p.hurtTime > this.lastHurt) {
      this.lastHurt = p.hurtTime;
      if (p.lastDamage > 20) {
        this._set(tier + FACE.OUCH, 7, 1);
      } else if (p.attackerAngle !== null) {
        const d = angleDiff(pt.angle, p.attackerAngle);
        if (Math.abs(d) < Math.PI / 4) this._set(tier + FACE.RAMPAGE, 7, 1);
        else this._set(tier + (d > 0 ? FACE.TURN_RIGHT : FACE.TURN_LEFT), 7, 1);
      } else {
        this._set(tier + FACE.RAMPAGE, 6, 1);
      }
    } else if (this.priority < 6 && p.fireHeld > 2) {
      this._set(tier + FACE.RAMPAGE, 5, 0.2);
    } else if (this.priority < 5 && (p.god || p.powers.invulnerable > 0)) {
      this._set(FACE.GOD, 4, 0.2);
    }

    if (this.timer <= 0) {
      this.priority = 0;
      this.frame = tier + FACE.STRAIGHT + this.rng.int(0, 2);
      this.timer = this.rng.range(0.4, 0.9);
    } else if (this.priority === 0) {
      // Keep the glance but follow tier changes.
      this.frame = tier + (this.frame % FACE.PER_TIER);
    }
  }

  _set(frame, priority, time) {
    this.frame = frame;
    this.priority = priority;
    this.timer = time;
  }
}
