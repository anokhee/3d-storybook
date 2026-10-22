import { PALETTE } from "../../world/palette.js";

// A coin slot: a small plate with a slit sunk into it. Whoever seats it on
// a face says where; this is only what it looks like. Colors come
// from PALETTE (src/world/palette.js).
//
//   width    the plate's, across
//   height   the plate's, up
//   depth    how thick the plate is
//   stand    how far off the face it floats
//   clay     the plate's lumps (see CLAY), or null for flat
//   color    its own
//   slit     the opening in it — its own `width`, `height` and `color`
export const SLOT = {
  width: 0.5,
  height: 0.9,
  depth: 0.12,
  // How far off the face the plate floats, so the clay lumps of what it is
  // stuck to do not poke through it.
  stand: 0.15,
  // The plate thrown in lumpy clay like the rest — see CLAY — or null for
  // flat. The slit is laid proud of the lumps.
  clay: { amount: 0.4, seed: 12 },
  color: PALETTE.slot.plate,
  slit: {
    width: 0.08,
    height: 0.6,
    color: PALETTE.slot.slit,
  },
};
