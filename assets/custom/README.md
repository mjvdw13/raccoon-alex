# Custom art: real faces

No photos of real people are kept in this repository. Alex's status-bar
face, title ID badge and Employee of the Month poster are hand-drawn pixel art
in `tools/art/ui/face.js`, peeking out of his raccoon costume's hood, and the
coworkers (Dale, Vera, Gus, Terry and Benny) are hand-drawn in
`tools/art/sprites/people/`.

The game can still build Alex's face from a photo at runtime instead: it
crops and shrinks it, crunches it into the 80s palette, and paints on darker
eye bags, a raccoon mask, bruises and blood as health drops. Turning left or
right and the god-mode and dead faces come from the same photo.

> **Heads up:** photos saved in this folder are ignored by git (see
> `.gitignore`), so they stay on your computer. Everything that is committed
> is public once it's on GitHub Pages: don't force-add someone's photo.

To use a different photo of Alex, follow these steps.

## Steps

1. Save the photo here, for example `assets/custom/alex.jpg` (JPG or PNG).
2. Preview it: open `index.html?photo=assets/custom/alex.jpg`.
3. Make it permanent in `src/content/hero.js`:

```js
face: {
  sheet: { src: 'assets/ui/face.png', frameWidth: 24, frameHeight: 30 },
  photo: 'assets/custom/alex.jpg',
},
```

## Which photo works best

- Head and shoulders, facing the camera, eyes open.
- Roughly 4:5 (portrait). The face is shrunk to 24×30 pixels for the status
  bar and 72×90 for the title, so tight framing beats detail.
- Plain backgrounds read best after the colour crunch.

## Fine-tuning (optional)

If the bags or the mask land in the wrong place, tell the game where things
are. All of these go next to `photo` in `hero.js`:

```js
crop: [120, 40, 400, 500],              // x, y, width, height in photo pixels (keep it ~4:5)
eyes: [[0.36, 0.44], [0.64, 0.44]],     // eye centres inside the crop, 0..1 across and down
mouth: [0.5, 0.77],                     // mouth centre inside the crop, 0..1
```

Without `crop`, the largest centred 4:5 area is used. `eyes` and `mouth`
default to typical passport-photo positions.
