import { castRay, rayCircle, lineOfSight } from '../world/physics.js';

const PUFF_Z = 0.45;

/**
 * Apply damage to a thing. `inflictor` is what hit it (projectile, shooter),
 * `source` is who is responsible (for infighting and the HUD face).
 */
export function damage(world, target, amount, inflictor, source, opts = {}) {
  if (!target || target.dead || target.removed || !target.shootable) return;
  amount = Math.round(amount);
  if (amount <= 0) return;

  if (target.player) {
    damagePlayer(world, target, amount, inflictor, source, opts);
    return;
  }

  // Knockback.
  if (inflictor && !opts.noThrust) {
    const a = Math.atan2(target.y - inflictor.y, target.x - inflictor.x);
    const k = (amount * 0.02) / Math.max(0.2, (target.def.mass ?? 100) / 100);
    target.vx += Math.cos(a) * Math.min(k, 1.2);
    target.vy += Math.sin(a) * Math.min(k, 1.2);
  }

  target.health -= amount;
  if (target.health <= 0) {
    kill(world, target, source);
    return;
  }
  target.def.hooks?.onPain?.(world, target, source, amount);
  if (target.kind !== 'monster') return;

  // Infighting: monsters hit by other monsters turn on them (except their own kind).
  if (source && source !== target && !source.dead && source !== target.target) {
    const sameKind = source.kind === 'monster' && source.def.id === target.def.id;
    if (source.player || (target.def.infighting && source.kind === 'monster' && !sameKind)) {
      target.target = source;
    }
  }
  if (target.state === 'idle') world.wakeMonster(target, source?.kind === 'monster' && !source.dead ? source : world.player);
  if (world.rng.chance(target.def.painChance ?? 0)) world.monsterPain(target);
}

function damagePlayer(world, target, amount, inflictor, source, opts) {
  const p = target.player;
  if (p.god || p.powers.invulnerable > 0 || p.dead) return;
  amount *= world.skillInfo.damageTaken ?? 1;
  if (opts.environment && p.powers.hazard > 0) return;
  if (p.armorClass && !opts.ignoreArmor) {
    let saved = Math.floor(amount * (p.armorClass === 1 ? 1 / 3 : 1 / 2));
    if (p.armor <= saved) {
      saved = p.armor;
      p.armorClass = 0;
    }
    p.armor -= saved;
    amount -= saved;
  }
  amount = Math.max(1, Math.round(amount));
  p.health -= amount;
  p.damageCount = Math.min(100, p.damageCount + amount);
  p.lastDamage = amount;
  p.hurtTime = world.time;
  if (source && source !== target) p.attackerAngle = Math.atan2(source.y - target.y, source.x - target.x);
  else p.attackerAngle = null;
  if (inflictor && !opts.noThrust && inflictor !== target) {
    const a = Math.atan2(target.y - inflictor.y, target.x - inflictor.x);
    const k = Math.min(0.35, amount * 0.004);
    target.vx += Math.cos(a) * k;
    target.vy += Math.sin(a) * k;
  }
  if (p.health <= 0) {
    p.health = 0;
    world.playerDied(source);
  } else {
    world.playSound(p.health < 25 ? 'player-pain-low' : 'player-pain', { fallback: 'player-pain' });
  }
}

/** Kill a thing: death animation, drops, kill stats, hooks and triggers. */
export function kill(world, target, source) {
  if (target.dead) return;
  const def = target.def;
  target.dead = true;
  target.solid = false;
  target.shootable = false;
  target.state = 'dead';
  target.vx *= 0.5;
  target.vy *= 0.5;
  const gib = def.anims?.gib && target.health < (def.gibHealth ?? -def.health);
  if (!target.setAnim(gib ? 'gib' : 'death')) {
    if (def.kind !== 'monster') target.removed = true;
  }
  world.playSoundFrom(gib ? (def.sounds.gib ?? def.sounds.death) : def.sounds.death, target);
  if (def.kind === 'monster' && def.countKill) world.stats.kills++;
  for (const drop of def.drops ?? []) {
    if (world.rng.chance(drop.chance ?? 1)) {
      const it = world.spawn(drop.item, target.x + world.rng.signed() * 0.15, target.y + world.rng.signed() * 0.15);
      if (it) it.dropped = true;
    }
  }
  if (def.explode) {
    const ex = def.explode;
    radiusDamage(world, target.x, target.y, ex.radius ?? 2, ex.damage ?? 100, target, source ?? target);
    if (ex.effect) world.spawn(ex.effect, target.x, target.y);
    if (ex.sound) world.playSoundFrom(ex.sound, target);
  }
  def.hooks?.onDeath?.(world, target, source);
  world.triggers?.killed(target);
}

/**
 * Explosion damage: falls off linearly with distance, blocked by walls.
 */
export function radiusDamage(world, x, y, radius, maxDamage, inflictor, source) {
  for (const t of [...world.things]) {
    if (!t.shootable || t.dead || t.removed) continue;
    if (t.def.splashImmune) continue;
    const d = Math.max(0, Math.hypot(t.x - x, t.y - y) - t.radius);
    if (d >= radius) continue;
    if (!lineOfSight(world.map, x, y, t.x, t.y)) continue;
    const dmg = maxDamage * (1 - d / radius);
    damage(world, t, dmg, inflictor ?? { x, y }, source);
  }
}

/** Instant bullet trace. Hits the first shootable thing before a wall. */
export function hitscan(world, shooter, angle, range, amount, spec = {}) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const wall = castRay(world.map, shooter.x, shooter.y, dx, dy, range);
  let best = null;
  let bestT = wall.dist;
  for (const t of world.things) {
    if (t === shooter || !t.shootable || t.dead || t.removed) continue;
    const hit = rayCircle(shooter.x, shooter.y, dx, dy, t.x, t.y, t.radius);
    if (hit >= 0 && hit < bestT) {
      bestT = hit;
      best = t;
    }
  }
  const hx = shooter.x + dx * Math.max(0, bestT - 0.06);
  const hy = shooter.y + dy * Math.max(0, bestT - 0.06);
  const z = PUFF_Z + world.rng.signed() * 0.08;
  if (best) {
    damage(world, best, amount, shooter, shooter);
    const fx = best.def.bleeds === false ? (spec.puff ?? 'puff') : (best.def.blood ?? 'blood');
    world.spawnEffect(fx, hx, hy, z);
  } else if (bestT < range) {
    world.spawnEffect(spec.puff ?? 'puff', hx, hy, z);
  }
  return best;
}

/** Nearest shootable thing within melee reach and in front of the attacker. */
export function meleeTarget(world, attacker, angle, range, arc = 0.7) {
  let best = null;
  let bestD = Infinity;
  for (const t of world.things) {
    if (t === attacker || !t.shootable || t.dead || t.removed) continue;
    const d = Math.hypot(t.x - attacker.x, t.y - attacker.y) - t.radius - attacker.radius;
    if (d > range - attacker.radius || d >= bestD) continue;
    let da = Math.atan2(t.y - attacker.y, t.x - attacker.x) - angle;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) > arc) continue;
    if (!lineOfSight(world.map, attacker.x, attacker.y, t.x, t.y)) continue;
    best = t;
    bestD = d;
  }
  return best;
}
