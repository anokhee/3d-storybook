import { solid } from "../../world/palette.js";
import { CAT_HEIGHT } from "../house/objects.js";

const paint = {
  fruit: solid("#E23B4E"),
  seed: solid("#FFD98A"),
  leaf: solid("#5FA14A"),
};

// A strawberry: a berry sitting on its crown of leaves at y = 0, wide end
// down and its tip up, seeded all over. Sizes are in its own units — its
// `radius` the berry's widest — and the whole is `scale` times that in
// the world.
//   height  how tall the berry is as a multiple of its radius
//   sides   how many facets round it
//   seeds   `count` of them, each `radius` big, `color`; or null
//   calyx   the leaves under the berry: `leaves` how many, `length` and
//           `width` of each, `droop` degrees each leaf tips down away from the
//           berry, `color`; or null
export const STRAWBERRY = {
  scale: CAT_HEIGHT / 8,
  radius: 0.5,
  height: 2.6,
  sides: 14,
  seeds: { count: 24, radius: 0.035, color: paint.seed },
  calyx: { leaves: 6, length: 0.5, width: 0.22, droop: 28, color: paint.leaf },
  color: paint.fruit,
};

// What can be changed on a strawberry, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const STRAWBERRY_KNOBS = [
  { label: "size", path: "radius", step: 0.05, min: 0.2, max: 1 },
  { label: "height", path: "height", step: 0.1, min: 1.4, max: 4 },
  { label: "seeds", path: "seeds.count", step: 1, min: 0, max: 60 },
  { label: "leaves", path: "calyx.leaves", step: 1, min: 3, max: 10 },
  { label: "fruit", path: "color.hex", color: true },
  { label: "seed", path: "seeds.color.hex", color: true },
  { label: "leaf", path: "calyx.color.hex", color: true },
];
