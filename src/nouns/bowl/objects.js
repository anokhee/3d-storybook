import { solid } from "../../world/palette.js";

// The bowl's own paints: a plum bowl, and fruit in the library's red and
// yellow so it reads as apples and lemons at a glance.
const paint = {
  bowl: solid("#3B2A4E"),
  fruitA: solid("#E5534B"),
  fruitB: solid("#F4D46A"),
};

// A bowl: turned on a lathe, standing on the ground on a foot ring, its
// inside open to the sky. `radius` is the rim's, before the flare; `depth`
// how tall it stands; `flare` how far the rim turns out, 0 straight to 1
// a wide lip. `wall` is the shell's thickness, `foot.radius` the ring it
// stands on as a share of `radius` and `foot.height` how tall that ring
// is. `fruit.count` round fruit, 0 to 6, rest inside it, `fruit.radius`
// each, in two colors turn and turn about. `sides` is the lathe's facets.
export const BOWL = {
  radius: 0.45,
  depth: 0.32,
  flare: 0.4,
  wall: 0.03,
  sides: 24,
  foot: { radius: 0.45, height: 0.04 },
  fruit: { count: 3, radius: 0.12 },
  colors: {
    bowl: paint.bowl,
    fruitA: paint.fruitA,
    fruitB: paint.fruitB,
  },
};

// What can be changed on a bowl, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const BOWL_KNOBS = [
  { label: "radius", path: "radius", step: 0.05, min: 0.2, max: 1.2 },
  { label: "depth", path: "depth", step: 0.02, min: 0.1, max: 0.8 },
  { label: "flare", path: "flare", step: 0.1, min: 0, max: 1 },
  { label: "colour", path: "colors.bowl.hex", color: true },
  { label: "fruit", path: "fruit.count", step: 1, min: 0, max: 6 },
  { label: "fruit a", path: "colors.fruitA.hex", color: true },
  { label: "fruit b", path: "colors.fruitB.hex", color: true },
];
