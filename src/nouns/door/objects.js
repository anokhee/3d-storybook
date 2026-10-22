import { PALETTE } from "../../world/palette.js";

// A door: the dome a capsule or a can drops out of — the front half of a
// primitive bulging out of a face, its open side against it. Whoever
// seats it says where; this is only what it looks like.
//
//   shape    any of PRIMITIVES
//   radius   its size
//   detail   its facet count as a multiple of the shape's
//   form     how it is pushed about (see FORM)
//   clay     thrown in lumpy clay like the rest (see CLAY), or null for
//            smooth
//   light    how it is lit (see LIGHT)
//   color    its own, a swatch from PALETTE
export const DOOR = {
  shape: "sphere",
  radius: 0.7,
  detail: 2.4,
  form: {},
  clay: { amount: 0.4, seed: 13 },
  light: {},
  color: PALETTE.door.dome,
};
