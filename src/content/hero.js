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
    // The drawn mugshot (see tools/art/ui/face.js for the layout). It's used if
    // the photo below is removed or fails to load.
    sheet: { src: 'assets/ui/face.png', frameWidth: 24, frameHeight: 30 },
    // Alex's real face: his close-up photo on a modelled head and shoulders
    // (made by tools/art/ui/face.js). See assets/custom/README.md.
    photo: 'assets/custom/alex.png',
    crop: [24, 30, 168, 210], // x, y, width, height in the photo, roughly 4:5
    eyes: [[0.35, 0.41], [0.65, 0.41]], // eye centres within the crop (0..1)
    mouth: [0.5, 0.67],
  },
};
