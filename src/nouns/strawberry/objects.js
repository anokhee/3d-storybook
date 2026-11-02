import { solid } from "../../world/palette.js";
import { CAT_HEIGHT } from "../house/objects.js";

const paint = {
  fruit: solid("#E5383B"),
  seed: solid("#F6D06A"),
  leaf: solid("#3E8A3E"),
};

// A strawberry: a berry, its tip down and its crown of leaves on top with
// a short stalk out of them, the shoulder under the leaves round, seeded
// all over. It stands on its tip at y = 0; `upright` false turns it over
// to sit on its leaves instead. Sizes are in its own units — its
// `radius` the berry's widest — and the whole is `scale` times that in
// the world.
//   height  how tall the berry is as a multiple of its radius
//   sides   how many facets round it
//   seeds   painted on: little flat ovals lying on its facets in `rows`,
//           every other facet, staggered row to row; each `radius`
//           across, `color`; or null
//   shoulder how much of the berry's height the round shoulder takes,
//           from the crown
//   stalk   out of the crown: `length`, `radius`; or null
//   calyx   the leaves on the berry's crown: `leaves` how many, `length` and
//           `width` of each, `droop` degrees each leaf tips down away from the
//           crown (less than 0 tips it up);
//           berry, `color`; or null
export const STRAWBERRY = {
  scale: CAT_HEIGHT / 8,
  radius: 0.5,
  height: 2.4,
  shoulder: 0.3,
  upright: true,
  sides: 16,
  stalk: { length: 0.3, radius: 0.05 },
  seeds: { rows: 8, radius: 0.03, color: paint.seed },
  calyx: { leaves: 6, length: 0.5, width: 0.22, droop: -28, color: paint.leaf },
  color: paint.fruit,
};

// What can be changed on a strawberry, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const STRAWBERRY_KNOBS = [
  { label: "size", path: "radius", step: 0.05, min: 0.2, max: 1 },
  { label: "height", path: "height", step: 0.1, min: 1.4, max: 4 },
  { label: "shoulder", path: "shoulder", step: 0.05, min: 0.1, max: 0.6 },
  { label: "upright", path: "upright", bool: true },
  { label: "seed rows", path: "seeds.rows", step: 1, min: 0, max: 16 },
  { label: "leaves", path: "calyx.leaves", step: 1, min: 3, max: 10 },
  { label: "leaf tilt", path: "calyx.droop", step: 2, min: -60, max: 60 },
  { label: "fruit", path: "color.hex", color: true },
  { label: "seed", path: "seeds.color.hex", color: true },
  { label: "leaf", path: "calyx.color.hex", color: true },
];
