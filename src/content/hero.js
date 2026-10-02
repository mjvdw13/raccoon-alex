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
    // The drawn mugshot (see tools/art/ui/face.js for the layout).
    sheet: { src: 'assets/ui/face.png', frameWidth: 24, frameHeight: 30 },
    // Want Alex's real face? Drop a photo in assets/custom/ and point at it:
    //   photo: 'assets/custom/alex.jpg',
    // Optional fine-tuning (see assets/custom/README.md):
    //   crop: [x, y, width, height],          // pixels in the photo, roughly 4:5
    //   eyes: [[0.35, 0.45], [0.65, 0.45]],   // eye centres within the crop (0..1)
    //   mouth: [0.5, 0.76],
    photo: null,
  },
};
