// Raccoon Alex himself: starting stats, inventory and his face.
export default {
  health: 100,
  radius: 0.25,
  walkSpeed: 4.6, // tiles per second
  runSpeed: 7.8,
  startWeapons: ['paws', 'staple-gun'],
  startWeapon: 'staple-gun',
  startAmmo: { staples: 50 },
  blood: 'blood',
  face: {
    // The mugshot, hand-drawn from his photo (tools/art/ui/face.js has the
    // layout). To use a photo instead, add `photo` here (see
    // assets/custom/README.md) or preview one with ?photo=path.
    sheet: { src: 'assets/ui/face.png', frameWidth: 24, frameHeight: 30 },
  },
};
