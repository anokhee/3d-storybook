import { solid } from "../../world/palette.js";

// The tiger's own colours: an orange coat with a white chest and muzzle,
// black stripes, a dark pupil in each white eye, pink in the ears and on the
// nose. The story's knobs write over the coat and the stripes.
const paint = {
  fur: solid("#E8893A"),
  belly: solid("#F7F1E6"),
  markings: solid("#2B2420"),
  eyes: solid("#F0B23A"),
  pupil: solid("#2A2230"),
  nose: solid("#E08A8A"),
  ear: solid("#EFB7B2"),
};

// A toy tiger on the cat's standing frame (see cat/objects.js), a size
// up: one lump of clay (see world/lump.js) — ONE rounded block for the
// head and body together, longer and lower than the cat's, the face
// drawn on its front, four sturdy legs slimmer blocks pulled straight
// down out of its corners to the ground, and a long tail out of its rear
// the same way, curling up at the tip — with a white bib painted on the
// chest, two ROUND ears on the front corners of the top (a pink disc on
// each), a white muzzle bump with a pink triangle nose and a line of a
// mouth drawn down from it, two white eyes and three whiskers a side, and
// black stripes painted on: narrow strokes over the back and down the
// flanks, tapering to points (some forking) above the belly, bars on the
// outsides of the legs, rings round the tail, and short marks on the
// forehead and the cheeks. It stands on the ground facing +z, about 1.3 long and 0.85
// tall.
//
//   size    the whole tiger scaled; 1 is a toy tiger beside the furniture,
//           a size up from the cat
//   swish   how much the tail swings, 0 still to 1 a full swish
//   stripes whether the stripes are painted on
//   body    the block: `width` across, `height`, `length` nose to rump,
//           `round` how far its edges are rounded off
//   legs    `thickness` of each, `round` of its edges, `blend` how wide
//           a fillet it makes with the belly
//   resolution  the lump's grid, cells a side: more is smoother, slower
//   colors  `fur` the coat; `belly` the bib, the muzzle and the whiskers;
//           `markings` the stripes; `eyes` the iris (not drawn while the
//           eyes are white, world/eye.jsx), `pupil` the pupil; `nose` and the inner `ear`
export const TIGER = {
  size: 1,
  swish: 0.6,
  stripes: true,
  body: { width: 0.6, height: 0.6, length: 1.3, round: 0.14 },
  legs: { thickness: 0.18, round: 0.05, blend: 0.02 },
  resolution: 56,
  colors: {
    fur: paint.fur,
    belly: paint.belly,
    markings: paint.markings,
    eyes: paint.eyes,
    pupil: paint.pupil,
    nose: paint.nose,
    ear: paint.ear,
  },
};

// What can be changed on a tiger, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const TIGER_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "swish", path: "swish", step: 0.1, min: 0, max: 1 },
  { label: "stripes", path: "stripes", bool: true, on: true, off: false },
  { label: "coat", path: "colors.fur.hex", color: true },
  { label: "stripe colour", path: "colors.markings.hex", color: true },
];
