import { solid } from "../../world/palette.js";

// The wolf's own colours: a grey coat with a paler cream on the chest,
// the belly, the muzzle and the insides of the ears, a darker grey for
// the saddle down its back and the tip of its tail, a dark nose, and pale
// amber eyes with a dark pupil. The story's knobs write over these.
const EYE_DARK = "#2A2230";
const paint = {
  coat: solid("#878A91"),
  belly: solid("#EAE3D4"),
  markings: solid("#50545C"),
  eyes: solid("#F2C85C"),
  pupil: solid(EYE_DARK),
  nose: solid("#2A2630"),
};

// A toy wolf on the dog's standing frame (see dog/objects.js): one lump
// of clay (see world/lump.js) — ONE rounded block for the head and body
// together, leaner and longer than the dog's, the face drawn on its
// front with a longer, narrower block of a snout out of it ending in a
// dark bead nose, four long legs pulled straight down out of the
// block's corners to the ground, and a thick bushy tail out of its rump
// held low and straight back with a slight droop, its tip painted dark
// — with two pointed ears standing up on the front corners of the top
// (a cream triangle painted on each), pale amber bead eyes,
// a lighter bib painted on the chest, the muzzle and the belly painted
// the same, and a darker saddle painted down the spine. It stands on
// the ground facing +z, about 0.95 tall to the top of its head and 1.4
// long nose to rump.
//
//   size    the whole wolf scaled; 1 is a big wild dog beside the furniture
//   wag     how much the tail swings, 0 still to 1 a full wag
//   body    the block: `width` across, `height`, `length` nose to rump,
//           `round` how far its edges are rounded off
//   legs    `thickness` of each, `round` of its edges, `blend` how wide
//           a fillet it makes with the belly
//   resolution  the lump's grid, cells a side: more is smoother, slower
//   colors  `coat`; `belly` the lighter bib, muzzle, belly and inner
//           ears; `markings` the saddle and the tail's tip; `eyes` the
//           amber bead of each, `pupil` the small dark bead on its
//           front; `nose`
export const WOLF = {
  size: 1,
  wag: 0.5,
  body: { width: 0.5, height: 0.5, length: 1.22, round: 0.13 },
  legs: { thickness: 0.14, round: 0.04, blend: 0.02 },
  resolution: 60,
  colors: {
    coat: paint.coat,
    belly: paint.belly,
    markings: paint.markings,
    eyes: paint.eyes,
    pupil: paint.pupil,
    nose: paint.nose,
  },
};

// What can be changed on a wolf, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const WOLF_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "wag", path: "wag", step: 0.1, min: 0, max: 1 },
  { label: "coat colour", path: "colors.coat.hex", color: true },
  { label: "belly colour", path: "colors.belly.hex", color: true },
  { label: "eye colour", path: "colors.eyes.hex", color: true },
];
