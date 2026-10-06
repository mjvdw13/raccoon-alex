// Raccoon Alex himself: starting stats, inventory and his face.
export default {
  health: 100,
  radius: 0.25,
  walkSpeed: 4.6, // tiles per second
  runSpeed: 7.8,
  // Just his paws: the staple gun is waiting in E1M1's lobby.
  startWeapons: ['paws'],
  startWeapon: 'paws',
  startAmmo: {},
  blood: 'blood',
  face: {
    // The mugshot, hand-drawn from his photo, in his raccoon costume
    // (tools/art/ui/face.js has the layout). To use a photo instead, add `photo` here (see
    // assets/custom/README.md) or preview one with ?photo=path.
    sheet: { src: 'assets/ui/face.png', frameWidth: 24, frameHeight: 30 },
  },
};
