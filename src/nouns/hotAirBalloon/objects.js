import { solid } from "../../world/palette.js";

// The balloon's own swatches: the envelope in a candy red and a cream,
// gore about, a wicker basket with a darker band round its rim, rope,
// the burner's dark iron and its flame.
const paint = {
  goreA: solid("#E5534B"),
  goreB: solid("#F2E9DC"),
  basket: solid("#E8C39E"),
  rim: solid("#A8693D"),
  rope: solid("#5C4A3B"),
  burner: solid("#3B2A4E"),
  flame: solid("#FFB24A"),
};

// A hot air balloon, stood on the ground on its basket as if just landed:
// the envelope up top, a lathe about its axis in `gores` wedges of two
// colours in turn, a narrow neck at its bottom opening out to a wide
// belly and a rounded crown; the burner in the neck with its flame lit;
// four ropes from the neck down to the basket, a wicker box with a darker
// band round its top. The envelope sways on its ropes; `sway` 0 holds it
// still. The basket's middle is at the origin.
//
//   envelope  `height` of it alone, `belly` its widest radius, `neck` the
//             radius of its bottom opening as a share of the belly, `gores`
//             how many wedges round, `segments` lathe steps across each
//             (so the round has gores times segments sides), `profile`
//             the shape of it, pairs of [radius as a share of the belly,
//             height as a share of its height] from the neck to the crown
//             — the first is the neck's own and is read off `neck`
//   burner    the frame in the neck: `radius`, `height`, `flame` the
//             radius of its lit ball, `glow` the point light it throws up
//             into the envelope (`intensity`, `distance`), or null
//   ropes     `length` from the basket's rim up to the neck, `radius`, and
//             `spread` how far in from the basket's corners they tie
//   basket    `width` across, `height` tall, `rim` the band's height
//   sway      0..1 how far the envelope rocks, `rate` how fast
//   colors    `goreA` and `goreB`, `basket`, `rim`, `rope`, `burner`,
//             `flame`
export const HOT_AIR_BALLOON = {
  envelope: {
    height: 6.4,
    belly: 2.6,
    neck: 0.3,
    gores: 12,
    segments: 3,
    profile: [
      [0.3, 0],
      [0.42, 0.05],
      [0.62, 0.15],
      [0.84, 0.3],
      [0.97, 0.45],
      [1, 0.58],
      [0.95, 0.72],
      [0.8, 0.85],
      [0.52, 0.95],
      [0.2, 0.995],
      [0, 1],
    ],
  },
  burner: {
    radius: 0.28,
    height: 0.3,
    flame: 0.2,
    glow: { intensity: 10, distance: 8 },
  },
  ropes: { length: 1.8, radius: 0.035, spread: 0.12 },
  basket: { width: 1.5, height: 1.2, rim: 0.2 },
  sway: 0.5,
  rate: 0.6,
  colors: {
    goreA: paint.goreA,
    goreB: paint.goreB,
    basket: paint.basket,
    rim: paint.rim,
    rope: paint.rope,
    burner: paint.burner,
    flame: paint.flame,
  },
};

// What can be changed on a hot air balloon, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const HOT_AIR_BALLOON_KNOBS = [
  { label: "height", path: "envelope.height", step: 0.2, min: 2, max: 12 },
  { label: "belly", path: "envelope.belly", step: 0.1, min: 0.8, max: 5 },
  { label: "gores", path: "envelope.gores", step: 2, min: 4, max: 24 },
  { label: "colour a", path: "colors.goreA.hex", color: true },
  { label: "colour b", path: "colors.goreB.hex", color: true },
  { label: "basket", path: "colors.basket.hex", color: true },
  { label: "sway", path: "sway", step: 0.05, min: 0, max: 1 },
];
