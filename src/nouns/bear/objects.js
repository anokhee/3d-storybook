import { solid } from "../../world/palette.js";

// The bear's own colours: a brown coat with a lighter muzzle, and a dark
// nose and eyes. The story's knobs write over these.
const paint = {
  coat: solid("#6B4A2E"),
  muzzle: solid("#C9A070"),
  nose: solid("#2A2230"),
  eyes: solid("#2A2230"),
};

// The coats a bear comes in, as colour pairs for the knobs: the brown
// bear it is made as, a black bear, and a polar bear — pick one and
// write its `coat` and `muzzle` over the colours.
export const BEAR_COATS = {
  brown: { coat: "#6B4A2E", muzzle: "#C9A070" },
  black: { coat: "#2E2A2C", muzzle: "#8C6A4A" },
  polar: { coat: "#F2EFE6", muzzle: "#E6DFD0" },
};

// A toy bear on the cat's frame (see cat/objects.js), big and heavy: one
// lump of clay (see world/lump.js) — a big rounded block for the body
// with a ball pressed into the top of its front for the hump of the
// shoulders, four thick stocky legs pulled straight down out of its
// corners to the ground with a wider block of a paw at the foot of
// each, a broad round block of a head grown out of the body's front with
// a short rounded block of a muzzle out of it ending in a big dark bead
// nose, and a stubby tail out of its rear — with the muzzle painted
// lighter over the front, two small round ears sat on top of the head
// and bead eyes. It stands on all fours on the ground facing +z, about
// 1 tall and 1.4 long.
//
//   size    the whole bear scaled; 1 is a bear beside the furniture
//   ears    how big the two ears are, 1 as made
//   body    the block: `width` across, `height`, `length` chest to rump,
//           `round` how far its edges are rounded off; `hump` how big the
//           ball of the shoulders is
//   legs    `thickness` of each, `round` of its edges, `blend` how wide
//           a fillet it makes with the belly; `paw` how wide each paw is
//   resolution  the lump's grid, cells a side: more is smoother, slower
//   colors  `coat`; `muzzle` painted over the muzzle's front; `nose` and
//           `eyes` (see BEAR_COATS for a black or a polar bear)
export const BEAR = {
  size: 1,
  ears: 1,
  body: { width: 0.7, height: 0.62, length: 0.86, round: 0.18, hump: 0.2 },
  legs: { thickness: 0.24, round: 0.05, blend: 0.04, paw: 0.3 },
  resolution: 56,
  colors: {
    coat: paint.coat,
    muzzle: paint.muzzle,
    nose: paint.nose,
    eyes: paint.eyes,
  },
};

// What can be changed on a bear, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const BEAR_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "coat", path: "colors.coat.hex", color: true },
  { label: "muzzle", path: "colors.muzzle.hex", color: true },
  { label: "ears", path: "ears", step: 0.1, min: 0.5, max: 2 },
];
