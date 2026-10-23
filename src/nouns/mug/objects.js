import { solid } from "../../world/palette.js";

// The mug's own paints: a yellow cup, the coffee in it a dark brown that
// reads as a drink against the cup's inside.
const paint = {
  mug: solid("#F4D46A"),
  drink: solid("#5B3A29"),
};

// A mug: a cup standing on the ground, open at the top, with a handle on
// its right (+x) so seen from the front (+z) the handle is to one side.
// `height` is how tall it stands, `radius` how wide its mouth is to the
// outside; the wall is `wall` thick and the base `base`, so looked into
// from above it is hollow. `full` is how high the drink stands in it, 0
// nothing to 1 brimming; the drink is a disc lying `drink.below` under
// where it would spill. The handle is half a ring `handle.radius` round
// and `handle.tube` thick, standing out from the side at mid-height.
// `sides` is how many facets the cup has.
export const MUG = {
  height: 0.45,
  radius: 0.18,
  wall: 0.025,
  base: 0.035,
  sides: 20,
  full: 0.92,
  handle: { radius: 0.11, tube: 0.03 },
  colors: {
    mug: paint.mug,
    drink: paint.drink,
  },
};

// What can be changed on a mug, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const MUG_KNOBS = [
  { label: "height", path: "height", step: 0.05, min: 0.15, max: 1.2 },
  { label: "radius", path: "radius", step: 0.02, min: 0.08, max: 0.5 },
  { label: "coffee", path: "full", bool: true, on: MUG.full, off: 0 },
  { label: "mug", path: "colors.mug.hex", color: true },
  { label: "drink", path: "colors.drink.hex", color: true },
];
