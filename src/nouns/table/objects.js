import { PALETTE } from "../../world/palette.js";

// A table: a top on legs. The top is a polygon of `sides` sides fitted
// to `width` across (x) by `length` along (z) — four sides is a
// rectangle, six a stretched hexagon, many a round or oval top — a slab
// `thickness` thick in its own `color`. The legs stand under its edge,
// `count` of them spaced evenly round it, `inset` in from the edge —
// one alone stands in the middle, a pedestal — each `shape` any of
// PRIMITIVES, `radius` thick, `height` tall from the ground to the top's
// underside, `detail` and `clay` as any primitive's (see FORM, CLAY),
// `color` its own. It stands on the ground with its front facing +z.
export const TABLE = {
  top: {
    width: 4,
    length: 2.4,
    sides: 4,
    thickness: 0.25,
    color: PALETTE.table.top,
  },
  legs: {
    count: 4,
    shape: "cylinder",
    radius: 0.16,
    height: 2,
    inset: 0.4,
    detail: 1,
    clay: { amount: 0.3, seed: 31 },
    color: PALETTE.table.legs,
  },
};

// What can be changed on a table, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const TABLE_KNOBS = [
  { label: "width", path: "top.width", step: 0.5, min: 0.5 },
  { label: "length", path: "top.length", step: 0.5, min: 0.5 },
  { label: "sides", path: "top.sides", step: 1, min: 3, max: 16 },
  { label: "thickness", path: "top.thickness", step: 0.05, min: 0.05 },
  { label: "height", path: "legs.height", step: 0.2, min: 0.2 },
  { label: "legs", path: "legs.count", step: 1, min: 1, max: 8 },
  { label: "color", path: "top.color.hex", color: true },
  { label: "leg color", path: "legs.color.hex", color: true },
];
