/**
 * Pickup effects. An item's `pickup` object lists effects to apply:
 *   { health: 10, maxHealth: 100 }              heal up to maxHealth
 *   { armor: 100, armorClass: 1 }               armour vest (class 1 absorbs 1/3, class 2 absorbs 1/2)
 *   { armor: 1, maxArmor: 200 }                 armour bonus
 *   { ammo: { staples: 10 } }                   ammo (doubled on the easiest and hardest skills)
 *   { weapon: 'tack-shotgun', ammo: {...} }     a weapon (plus its ammo)
 *   { key: 'blue' }                             a key
 *   { powerup: 'berserk' | 'invulnerable' | 'nightvision' | 'hazard', duration: 30 }
 *   { backpack: true }                          double ammo capacity
 *   { map: true }                               reveal the automap
 * Effects return true if they did anything; an item is only consumed if at
 * least one effect applied (so full health leaves medkits on the floor).
 * Content can add effects with definePickup(name, fn).
 */

const MODIFIERS = new Set(['maxHealth', 'armorClass', 'maxArmor', 'duration', 'always']);

export function giveAmmo(world, p, id, amount) {
  const max = p.maxAmmo[id] ?? 0;
  const have = p.ammo[id] ?? 0;
  if (have >= max) return false;
  const was = have;
  p.ammo[id] = Math.min(max, have + Math.round(amount * (world.skillInfo.ammoMultiplier ?? 1)));
  // Doom-style: switch to a better weapon when ammo arrives for it while empty.
  if (was === 0) world.autoSwitchForAmmo(id);
  return true;
}

export const BUILTIN_PICKUPS = {
  health(world, p, value, item, spec) {
    const max = spec.maxHealth ?? 100;
    if (p.health >= max) return false;
    p.health = Math.min(max, p.health + value);
    return true;
  },

  armor(world, p, value, item, spec) {
    if (spec.armorClass) {
      if (p.armor >= value) return false;
      p.armor = value;
      p.armorClass = spec.armorClass;
      return true;
    }
    const max = spec.maxArmor ?? 200;
    if (p.armor >= max) return false;
    p.armor = Math.min(max, p.armor + value);
    if (!p.armorClass) p.armorClass = 1;
    return true;
  },

  ammo(world, p, value) {
    let took = false;
    for (const [id, n] of Object.entries(value)) took = giveAmmo(world, p, id, n) || took;
    return took;
  },

  weapon(world, p, id) {
    if (p.weapons.has(id)) return false;
    p.weapons.add(id);
    p.pendingWeapon = id;
    p.grinTime = world.time;
    return true;
  },

  key(world, p, id) {
    if (p.keys.has(id)) return false;
    p.keys.add(id);
    return true;
  },

  powerup(world, p, name, item, spec) {
    const duration = spec.duration ?? 30;
    if (name === 'berserk') {
      p.powers.berserk = Infinity;
      p.berserkTime = world.time;
      if (p.health < 100) p.health = 100;
      const melee = [...p.weapons].map((w) => world.registry.weapons.get(w)).find((w) => w?.fire?.kind === 'melee');
      if (melee && p.weapon !== melee.id) p.pendingWeapon = melee.id;
      return true;
    }
    p.powers[name] = duration;
    return true;
  },

  backpack(world, p) {
    if (!p.backpack) {
      p.backpack = true;
      for (const a of world.registry.ammo.values()) p.maxAmmo[a.id] = a.backpackMax;
    }
    for (const a of world.registry.ammo.values()) giveAmmo(world, p, a.id, a.clip ?? 0);
    return true;
  },

  map(world, p) {
    world.map.seen.fill(1);
    p.hasMap = true;
    return true;
  },
};

/** Try to pick up an item. Returns true if it was consumed. */
export function tryPickup(world, playerThing, item) {
  const p = playerThing.player;
  const spec = item.def.pickup ?? {};
  let consumed = false;
  // Weapons first so the "new weapon" grin happens before ammo is counted.
  const keys = Object.keys(spec).sort((a, b) => (a === 'weapon' ? -1 : b === 'weapon' ? 1 : 0));
  for (const key of keys) {
    if (MODIFIERS.has(key)) continue;
    const fn = BUILTIN_PICKUPS[key] ?? world.registry.pickups.get(key);
    if (!fn) {
      console.warn(`Item "${item.def.id}": unknown pickup effect "${key}"`);
      continue;
    }
    if (fn(world, p, spec[key], item, spec)) consumed = true;
  }
  const hook = item.def.hooks?.onPickup;
  if (hook && hook(world, playerThing, item)) consumed = true;
  if (spec.always) consumed = true;
  return consumed;
}
