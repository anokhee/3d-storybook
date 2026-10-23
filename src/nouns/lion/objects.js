import { solid } from "../../world/palette.js";

// The lion's own colours: a golden coat, a paler cream on the muzzle,
// the chest and the insides of the ears, a dark brown mane (and the
// tuft on the tail, the same), a dark nose, and an amber iris on a dark
// bead. The story's knobs write over these.
const EYE_DARK = "#2A2230";
const paint = {
  fur: solid("#D9A45B"),
  belly: solid("#F0DDB8"),
  mane: solid("#7A4A2A"),
  eyes: solid("#E8B84A"),
  pupil: solid(EYE_DARK),
  nose: solid("#3B2A2A"),
};

// A toy lion on the cat's standing frame (see cat/objects.js): one lump
// of clay (see world/lump.js) — ONE rounded block for the head and body
// together, longer and lower than the cat's, the face drawn on its
// front, four sturdy legs pulled straight down out of its corners to
// the ground, and a long tail out of its rear hanging down and back
// with a thicker TUFT at its tip, painted dark — with a lighter bib
// painted on the chest, a big muzzle bump with a triangle nose and a
// line of a mouth drawn down from it, two bead eyes, three whiskers a
// side, and two small round ears on the front corners of the top. Round
// the head sits the MANE: a second lump of its own, a thick ring of
// balls framing the face, wider than the body, over the front of the
// block and down the chest a little, in the mane's own colour, the face
// showing through its middle. Without it, it is a lioness. It stands on
// the ground facing +z, about 1.25 long and 0.85 to the top of its head.
//
//   size    the whole lion scaled; 1 is a big cat beside the furniture
//   swish   how much the tail swings, 0 still to 1 a full swish
//   mane    whether it has its mane (off is a lioness)
//   body    the block: `width` across, `height`, `length` nose to rump,
//           `round` how far its edges are rounded off
//   legs    `thickness` of each, `round` of its edges, `blend` how wide
//           a fillet it makes with the belly
//   resolution  the lumps' grid, cells a side: more is smoother, slower
//   colors  `fur` the coat; `belly` the lighter bib on the chest, the
//           muzzle, the whiskers and the inner ears; `mane` the mane and
//           the tail's tuft; `eyes` the iris, `pupil` the dark bead
//           behind it; `nose`
export const LION = {
  size: 1,
  swish: 0.6,
  mane: true,
  body: { width: 0.6, height: 0.5, length: 1.25, round: 0.14 },
  legs: { thickness: 0.2, round: 0.05, blend: 0.03 },
  resolution: 56,
  colors: {
    fur: paint.fur,
    belly: paint.belly,
    mane: paint.mane,
    eyes: paint.eyes,
    pupil: paint.pupil,
    nose: paint.nose,
  },
};

// What can be changed on a lion, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const LION_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "swish", path: "swish", step: 0.1, min: 0, max: 1 },
  { label: "mane", path: "mane", bool: true, on: true, off: false },
  { label: "coat colour", path: "colors.fur.hex", color: true },
  { label: "mane colour", path: "colors.mane.hex", color: true },
];
