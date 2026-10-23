import { solid } from "../../world/palette.js";

// The buffalo's own colours: a dark brown coat, pale grey horns, a greyer
// muzzle painted over the end of the nose, a near-black tuft on the
// tail, and dark nostrils and eyes. The story's knobs write over these.
const paint = {
  coat: solid("#4A3A33"),
  horn: solid("#CFC7B8"),
  muzzle: solid("#6E625B"),
  tuft: solid("#26201E"),
  nose: solid("#1E1A1C"),
  eyes: solid("#1E1A1C"),
};

// A toy buffalo on the dog's standing frame (see dog/objects.js): one
// lump of clay (see world/lump.js) — ONE big rounded block for the body,
// a HUMP pressed into its top over the shoulders with a wide blend, four
// thick legs pulled straight down out of its corners to the ground, a
// broad block of a head out of its front, held low and run back into the
// body so there is no seam, with a wide muzzle block out of the lower
// half of its face, and a thin tail out of the top of its rump hanging
// down and back — with a lighter muzzle painted over the end of the
// nose, two dark nostrils and two bead eyes, two small ears out of the
// sides of the head, and a dark TUFT, a bead, on the tail's tip. Either
// side of the head, over the ears, sit the HORNS: each a curve of
// tapered capsules of its own, a second lump in the horns' own pale
// colour, sweeping out of the head's upper corners just above the ears
// and up. The rhino is this buffalo with those horns off and a horn on
// its nose instead (rhino/objects.js). It stands on the
// ground facing +z, about 1.2 tall to the top of the hump and 1.6 long
// nose to rump.
//
//   size    the whole buffalo scaled; 1 is a heavy beast beside the furniture
//   wag     how much the tail swings, 0 still to 1 a full swing (a
//           buffalo's is a slow flick, never a dog's wag)
//   muzzle  whether the lighter muzzle is painted on
//   body    the block: `width` across, `height`, `length` chest to rump,
//           `round` how far its edges are rounded off, `hump` how far the
//           hump rises above the back
//   head    the head block: `width`, `height`, `length`, `round` the same
//           way, `drop` how far its top sits below the body's
//   horns   `show` whether it has them; `spread` how far out they
//           sweep, 1 as made; `rootR` thick where they leave the head
//           and `tipR` at the tips
//   snout   whether it has a long snout after the giraffe's (see
//           goat/Goat.jsx), tapering and turned nose-down, painted, with
//           the nostrils on its end and the eyes moved to the sides of
//           the head, in place of its muzzle (a rhino's)
//   ears    `up` whether they stand upright on top of the head facing
//           forward (a rhino's) rather than out of its sides
//   tail    `length` and `thickness` of the tail and its tuft, 1 as made
//   noseHorn  how long the big horn on the nose is (a rhino's), with a
//           smaller one behind it; 0 for none
//   legs    `thickness` of each, `round` of its edges, `blend` how wide
//           a fillet it makes with the belly
//   resolution  the lumps' grid, cells a side: more is smoother, slower
//   colors  `coat`; `horn` the horns; `muzzle` the paint on the nose;
//           `tuft` the tail's tip; `nose` the nostrils and `eyes`
export const BUFFALO = {
  size: 1,
  wag: 0.4,
  muzzle: true,
  body: { width: 0.62, height: 0.62, length: 1.1, round: 0.16, hump: 0.18 },
  head: { width: 0.46, height: 0.42, length: 0.5, round: 0.11, drop: 0.14 },
  snout: false,
  ears: { up: false },
  noseHorn: 0,
  tail: { length: 1, thickness: 1 },
  horns: { show: true, spread: 1, rootR: 0.075, tipR: 0.04 },
  legs: { thickness: 0.2, round: 0.05, blend: 0.03 },
  resolution: 64,
  colors: {
    coat: paint.coat,
    horn: paint.horn,
    muzzle: paint.muzzle,
    tuft: paint.tuft,
    nose: paint.nose,
    eyes: paint.eyes,
  },
};

// What can be changed on a buffalo, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const BUFFALO_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "wag", path: "wag", step: 0.1, min: 0, max: 1 },
  { label: "horn spread", path: "horns.spread", step: 0.1, min: 0.4, max: 1.8 },
  { label: "coat", path: "colors.coat.hex", color: true },
  { label: "horns", path: "colors.horn.hex", color: true },
];
