import { solid } from "../../world/palette.js";

// A BANANA: a long curved fruit, its sides in flat facets, fat in the
// middle and narrowing to each end — a stalk at one end, a dark nub at
// the other — lying on its side, curving up at both ends like a smile.
// It rests on the ground at y = 0, its length along x. In the world's
// units, at the character's scale (they are 1.31 high), like ../orange/.
// `count` more than 1 makes a bunch of them, fanned out from one stalk.
//   length   end to end, along its curve
//   thick    across its middle (its radius)
//   curve    how far it bends, in degrees end to end
//   sides    how many flat facets round it
//   stalk    the one stalk at the bunch's end: `length` and `radius` as
//            shares of a banana's thick
//   count    how many in the bunch; `fan` the degrees between them
//   colors   `skin`, `stalk`, `tip`
export const BANANA = {
  length: 0.17,
  thick: 0.017,
  curve: 70,
  sides: 6,
  stalk: { length: 1.6, radius: 0.3 },
  count: 1,
  fan: 16,
  colors: {
    skin: solid("#F3CD45"),
    stalk: solid("#4A3A2C"),
    tip: solid("#4A3A2C"),
  },
};

export const BANANA_KNOBS = [
  { label: "length", path: "length", step: 0.01, min: 0.05, max: 0.5 },
  { label: "thickness", path: "thick", step: 0.002, min: 0.006, max: 0.05 },
  { label: "curve", path: "curve", step: 5, min: 0, max: 150 },
  { label: "sides", path: "sides", step: 1, min: 4, max: 12 },
  { label: "how many", path: "count", step: 1, min: 1, max: 6 },
  { label: "skin", path: "colors.skin.hex", color: true },
  { label: "stalk", path: "colors.stalk.hex", color: true },
];
