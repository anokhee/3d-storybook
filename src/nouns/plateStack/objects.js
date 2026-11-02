import { PLATE } from "../plate/objects.js";

// A STACK OF PLATES: the library's Plate (Food/Kitchen/Plate), empty,
// `count` of them one on another, each nested a little into the one under
// it and set a touch off true, as a kitchen shelf keeps them. In the
// library's own units, as the Plate is.
//   count    how many
//   nest     how far each sits up off the one under it, a share of a
//            plate's rim height
//   wobble   how far each may sit off the middle, a share of its radius
//   plate    the Plate's config (its food is left off)
export const PLATE_STACK = {
  count: 6,
  nest: 0.62,
  wobble: 0.025,
  plate: { radius: PLATE.radius, rim: PLATE.rim, height: PLATE.height, color: PLATE.color },
};

export const PLATE_STACK_KNOBS = [
  { label: "how many", path: "count", step: 1, min: 1, max: 20 },
  { label: "radius", path: "plate.radius", step: 0.02, min: 0.12, max: 1 },
  { label: "colour", path: "plate.color.hex", color: true },
];
