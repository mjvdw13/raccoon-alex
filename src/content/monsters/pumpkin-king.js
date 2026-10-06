import { defineMonster } from '../../engine/defs.js';

// THE PUMPKIN KING. Queen of the infestation: a huge, evil pumpkin floating
// on writhing vines, with a face glaring out of a jagged hole carved in its
// side. Spits volleys of flaming jack-o'-lanterns and, when hurt, cackles for
// backup (Race Condition Roaches). Killing it ends the episode (see the e1m5
// trigger).
export default defineMonster({
  id: 'pumpkin-king',
  name: 'The Pumpkin King',
  glyph: 'K',
  sheet: { src: 'assets/sprites/monsters/pumpkin-king.png', frameWidth: 128, frameHeight: 128 },
  scale: 1.05,
  health: 3000,
  speed: 1.7,
  radius: 0.7,
  height: 2,
  painChance: 0.06,
  reactionTime: 0.3,
  mass: 4000,
  boss: true,
  splashImmune: true,
  sightRange: 64,
  cooldown: [1.2, 2.2],
  attack: { kind: 'projectile', projectile: 'pumpkin-bomb', range: 48, minRange: 1.5 },
  melee: { kind: 'melee', damage: [20, 60], range: 1.3, hitSound: 'shell-slam' },
  aggression: 0.8,
  anims: {
    idle: { frames: [0, 1], fps: 2, loop: true },
    walk: { frames: [0, 1, 2, 3], fps: 4, events: { 1: 'sound:pumpkin-rustle', 3: 'sound:pumpkin-rustle' } },
    attack: { frames: [4, 5, 4, 5, 4, 5, 6], durations: [0.3, 0.12, 0.18, 0.12, 0.18, 0.12, 0.3], fireAt: [1, 3, 5] },
    pain: { frames: [7], durations: [0.2] },
    death: { frames: [8, 9, 10, 11, 12, 13, 14, 15], durations: [0.25, 0.2, 0.2, 0.2, 0.2, 0.25, 0.3, 0.4] },
  },
  sounds: { sight: 'pumpkin-sight', active: 'pumpkin-active', pain: 'pumpkin-pain', death: 'pumpkin-death' },
  blood: 'ichor',
  hooks: {
    // Below half health, it cackles for reinforcements every so often.
    onThink(world, self, dt) {
      if (self.state === 'idle' || self.health > self.def.health / 2) return;
      self.summon = (self.summon ?? 6) - dt;
      if (self.summon > 0) return;
      self.summon = 14;
      world.playSoundFrom('pumpkin-cackle', self);
      world.message('THE PUMPKIN KING CACKLES FOR BACKUP!');
      for (let k = 0; k < 2; k++) {
        const a = self.angle + Math.PI / 2 + k * Math.PI;
        const x = self.x + Math.cos(a) * 1.6;
        const y = self.y + Math.sin(a) * 1.6;
        if (world.map.blocks(Math.floor(x), Math.floor(y))) continue;
        const m = world.spawn('roach', x, y, self.angle);
        if (m) {
          world.stats.totalKills++;
          world.spawn('teleport-fog', x, y);
          world.wakeMonster(m, world.player);
        }
      }
    },
  },
});
