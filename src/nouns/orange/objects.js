import { solid } from "../../world/palette.js";

// AN ORANGE: a ball a touch squashed, a little star of a calyx at its top
// where it came off the tree, and, if `leaf` is set, one leaf still on
// it. It rests on the ground at y = 0. In the world's units, at the
// character's scale (they are 1.31 high): the size the shopping bag
// carries (see ../shoppingBag/build.js, which builds its oranges here).
//   radius   the ball's, across
//   squash   its height as a share of its width
//   detail   how many facets round it
//   calyx    the star on top: `radius` as a share of the ball's, `points`
//   leaf     `length` and `width` as shares of the ball's radius; or null
//   colors   `skin`, `calyx`, `leaf`
const LEAF = { length: 1.4, width: 0.6 };
export const ORANGE = {
  radius: 0.038,
  squash: 0.92,
  detail: 18,
  calyx: { radius: 0.2, points: 5 },
  leaf: null,
  colors: {
    skin: solid("#F08A2E"),
    calyx: solid("#7A8A3A"),
    leaf: solid("#4F8F3E"),
  },
};

export const ORANGE_KNOBS = [
  { label: "size", path: "radius", step: 0.004, min: 0.01, max: 0.2 },
  { label: "squash", path: "squash", step: 0.02, min: 0.7, max: 1.1 },
  { label: "leaf", path: "leaf", bool: true, on: LEAF, off: null },
  { label: "skin", path: "colors.skin.hex", color: true },
  { label: "calyx", path: "colors.calyx.hex", color: true },
  { label: "leaf colour", path: "colors.leaf.hex", color: true },
];
