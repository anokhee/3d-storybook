import { solid } from "../../world/palette.js";

// The sheep's own colours: a cream fleece over a near-black body, a
// grey muzzle on the dark face, white eyes with dark pupils, and
// horns the colour of old bone. The story's knobs write over these.
const paint = {
  fleece: solid("#F4EBDC"),
  body: solid("#2E2A2E"),
  horn: solid("#D9C9A6"),
  muzzle: solid("#8C8489"),
  eyes: solid("#F7F3EC"),
  pupil: solid("#1E1A20"),
};

// A toy sheep, standing: two lumps of clay (see world/lump.js), one
// inside the other. The FLEECE is a big rounded block with a cluster of
// balls pressed into its sides, top, chest and rump, each filleted wide
// into it so the whole reads as wool, and a topknot of a couple more on
// top of the head. The BODY under it is the second lump, dark: a
// smaller block hidden inside the fleece, a head block out of the
// fleece's front, four slim legs pulled straight down out of it to the
// ground, and a short tail out of the rump, hanging down. Two dark ears
// stick out to the sides of the head, a lighter muzzle is painted on
// its front, and the eyes are white eyeballs with dark pupils. With
// `horns` on it is a RAM: a third lump, a thick horn either side of the
// head, each a run of tapering capsules wound in a spiral round the
// ear. It stands on the ground facing +z, about 0.9 tall and 1.1 long.
//
//   size    the whole sheep scaled; 1 is a sheep beside the furniture
//   wag     how much the tail wags, 0 still to 1 a full wag
//   horns   whether it has horns (on is a ram)
//   fleece  the woolly block: `width` across, `height`, `length` chest
//           to rump, `round` how far its edges are rounded off, `bulge`
//           how far the balls stand out of it, `blend` how wide a fillet
//           each makes with it
//   legs    `thickness` of each, `round` of its edges, `blend` how wide
//           a fillet it makes with the belly
//   resolution  the lumps' grid, cells a side: more is smoother, slower
//   colors  `fleece`; `body` the head, legs, tail and ears; `horn`;
//           `muzzle` the patch on the face; `eyes` the eyeballs (not
//           drawn: they are the shared white, world/eye.jsx), `pupil`
//           the dark spot on each
export const SHEEP = {
  size: 1,
  wag: 0.5,
  horns: false,
  fleece: { width: 0.56, height: 0.5, length: 0.92, round: 0.16, bulge: 0.1, blend: 0.08 },
  legs: { thickness: 0.12, round: 0.035, blend: 0.02 },
  resolution: 56,
  colors: {
    fleece: paint.fleece,
    body: paint.body,
    horn: paint.horn,
    muzzle: paint.muzzle,
    eyes: paint.eyes,
    pupil: paint.pupil,
  },
};

// What can be changed on a sheep, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const SHEEP_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "wag", path: "wag", step: 0.1, min: 0, max: 1 },
  { label: "horns", path: "horns", bool: true, on: true, off: false },
  { label: "fleece colour", path: "colors.fleece.hex", color: true },
  { label: "body colour", path: "colors.body.hex", color: true },
  { label: "horn colour", path: "colors.horn.hex", color: true },
];
