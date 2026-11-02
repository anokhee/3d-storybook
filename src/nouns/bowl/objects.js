import { solid } from "../../world/palette.js";
import { BOWL_DESIGNS, DESIGN_COLORS, DESIGN_KNOBS } from "./designs.js";

// The bowl's own paints: a plum bowl; and each design's (./designs.js).
const paint = {
  bowl: solid("#3B2A4E"),
};


// A bowl: turned on a lathe, standing on the ground on a foot ring, its
// inside open to the sky. `radius` is the rim's, before the flare; `depth`
// how tall it stands; `flare` how far the rim turns out, 0 straight to 1
// a wide lip. `wall` is the shell's thickness, `foot.radius` the ring it
// stands on as a share of `radius` and `foot.height` how tall that ring
// is. `sides` is the lathe's facets. `design` is what's painted round
// its outside (BOWL_DESIGNS, see ./designs.js): "basic" plain in
// `colors.bowl`, or "chinoiserie", "striped", "folk", each in its own
// colours under `colors[design]`, its inside its ground colour.
// `contents` is what's in it (BOWL_CONTENTS):
//   "apple and banana"   an Apple and a Banana (Food/Produce)
//   "orange and apple"   Oranges and Apples, turn and turn about
//   "noodles"  a broth with noodles, half an egg, scallions
//   "curry"    curry with a mound of rice (the Cookpot's is the same)
//   "empty"    nothing
// The fruit: `fruit.radius` an apple's or orange's, and for "orange and apple"
// `fruit.count` of them, 1 to 6. `fill` is how high the noodles or curry come, a
// share of the way up the inside; `seed` where their bits lie.
export const BOWL = {
  radius: 0.45,
  depth: 0.32,
  flare: 0.4,
  wall: 0.03,
  sides: 24,
  foot: { radius: 0.45, height: 0.04 },
  design: "basic",
  contents: "apple and banana",
  fruit: { count: 3, radius: 0.12 },
  fill: 0.72,
  seed: 3,
  colors: {
    bowl: paint.bowl,
    ...DESIGN_COLORS,
  },
};
export const BOWL_CONTENTS = ["apple and banana", "orange and apple", "noodles", "curry", "empty"];

// What can be changed on a bowl, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const BOWL_KNOBS = [
  { label: "design", path: "design", options: BOWL_DESIGNS },
  { label: "radius", path: "radius", step: 0.05, min: 0.2, max: 1.2 },
  { label: "depth", path: "depth", step: 0.02, min: 0.1, max: 0.8 },
  { label: "flare", path: "flare", step: 0.1, min: 0, max: 1 },
  { label: "colour", path: "colors.bowl.hex", color: true, if: { arg: "design", eq: "basic" } },
  ...DESIGN_KNOBS,
  { label: "contents", path: "contents", options: BOWL_CONTENTS },
  { label: "how many", path: "fruit.count", step: 1, min: 1, max: 6, if: { arg: "contents", eq: "orange and apple" } },
  { label: "fill", path: "fill", step: 0.05, min: 0.2, max: 1, if: { arg: "contents", neq: "empty" } },
];
