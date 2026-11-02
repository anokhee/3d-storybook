import { solid } from "../../world/palette.js";

// A BAGUETTE: a long fat loaf, rounded at both ends, its top scored with a
// few slanting slashes. The one that stands up out of a shopping bag (see
// ../shoppingBag/build.js, which builds it here). Lying on the ground at
// y = 0 along z, its slashes up. In the world's units, at the character's
// scale (they are 1.31 high), like ../orange/.
//   radius   how fat it is
//   length   end to end
//   slashes  how many scores along its top
//   colors   `crust`, `score` (the slashes)
export const BAGUETTE = {
  radius: 0.034,
  length: 0.368,
  slashes: 3,
  colors: {
    crust: solid("#D9A35B"),
    score: solid("#B57B3A"),
  },
};

export const BAGUETTE_KNOBS = [
  { label: "fat", path: "radius", step: 0.004, min: 0.01, max: 0.15 },
  { label: "length", path: "length", step: 0.02, min: 0.1, max: 1.2 },
  { label: "slashes", path: "slashes", step: 1, min: 0, max: 8 },
  { label: "crust", path: "colors.crust.hex", color: true },
  { label: "slash colour", path: "colors.score.hex", color: true },
];
