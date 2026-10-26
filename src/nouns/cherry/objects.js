import { solid } from "../../world/palette.js";
import { CAT_HEIGHT } from "../house/objects.js";

// The cherry's own paints: a glossy red, a green stalk and leaf.
const paint = {
  fruit: solid("#D8323C"),
  stem: solid("#6B8E3D"),
  leaf: solid("#5FA14A"),
};

// A cherry: a ball resting on the ground at y = 0, a curved stalk rising
// from a dimple in its top. The sizes are in the cherry's own units — its
// `radius` the ball's — and the whole is `scale` times that in the world
// (a cupcake topper sets it to 1 and sizes the cherry itself).
//   detail  the ball's facet count as a multiple of a sphere's
//   stem    the stalk: `radius` its thickness, `height` how long it is,
//           `lean` degrees off upright, `bend` how far it bows the other
//           way as a share of its height, `color`
//   leaf    the leaf at the stalk's tip: `length` and `width`, `color`;
//           or null for none
export const CHERRY = {
  scale: CAT_HEIGHT / 8,
  radius: 0.5,
  detail: 2,
  stem: { radius: 0.05, height: 0.8, lean: 20, bend: 0.25, color: paint.stem },
  leaf: { length: 0.7, width: 0.32, color: paint.leaf },
  color: paint.fruit,
};

// What can be changed on a cherry, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const CHERRY_KNOBS = [
  { label: "size", path: "radius", step: 0.05, min: 0.2, max: 1 },
  { label: "stem length", path: "stem.height", step: 0.05, min: 0.2, max: 2 },
  { label: "stem lean", path: "stem.lean", step: 1, min: -60, max: 60 },
  { label: "stem bend", path: "stem.bend", step: 0.05, min: -0.6, max: 0.6 },
  { label: "fruit", path: "color.hex", color: true },
  { label: "stem", path: "stem.color.hex", color: true },
  { label: "leaf", path: "leaf.color.hex", color: true },
];
