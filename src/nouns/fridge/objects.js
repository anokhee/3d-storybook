import { PALETTE } from "../../world/palette.js";

// A fridge: a tall rounded box with two doors on the front, a freezer
// over a fridge, each with a handle down its near edge. It stands on the
// ground with its front facing +z. Colors come from PALETTE
// (src/world/palette.js).
//
//   body    the box: `width` across the front, `depth` front to back,
//           `height` off the ground, `cornerRadius` how round its
//           corners are in plan
//   doors   the two on the front: `thickness` how far each stands off
//           the body, `inset` how far in from the body's sides each
//           sits, `gap` the line between them, `split` how much of the
//           height the freezer takes, from the top (0 for one door all
//           the way down), `cornerRadius` their own
//   handle  the bar down each door's near edge: `radius`, `length` as a
//           share of its door's height, `inset` how far in from the
//           door's edge it stands, `out` how far it stands off the door
//   colors  `body`, `door` and `handle`, as above
export const FRIDGE = {
  body: { width: 2.6, depth: 2.2, height: 6, cornerRadius: 0.2 },
  doors: {
    thickness: 0.16,
    inset: 0.08,
    gap: 0.07,
    split: 0.33,
    cornerRadius: 0.16,
  },
  handle: { radius: 0.06, length: 0.55, inset: 0.22, out: 0.14 },
  colors: {
    body: PALETTE.fridge.body,
    door: PALETTE.fridge.door,
    handle: PALETTE.fridge.handle,
  },
};

// What can be changed on a fridge, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const FRIDGE_KNOBS = [
  { label: "width", path: "body.width", step: 0.2, min: 0.8 },
  { label: "depth", path: "body.depth", step: 0.2, min: 0.8 },
  { label: "height", path: "body.height", step: 0.2, min: 1 },
  { label: "split", path: "doors.split", step: 0.05, min: 0, max: 1 },
  { label: "body color", path: "colors.body.hex", color: true },
  { label: "door color", path: "colors.door.hex", color: true },
  { label: "handle", path: "colors.handle.hex", color: true },
];
