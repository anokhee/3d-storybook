import { PALETTE } from "../../world/palette.js";

// A chair: a seat on four legs with a back. Every part a clay primitive
// pressed to shape (see FORM). It stands on the ground with its front
// facing +z, like a bench. Colors come from PALETTE (src/world/palette.js):
// `colors`, the `seat` and the `frame` — the legs and the back.
//
//   seat   the slab: `width` across (x), `depth` along (z), `thickness`
//          through it; `detail` and `clay` as any primitive's
//   legs   the four under its corners: `shape` any of PRIMITIVES,
//          `radius`, `height` off the ground to the seat's underside,
//          `inset` how far in from the seat's corners each stands,
//          `detail`, `clay`
//   back   the slab standing up from the seat's back edge: `height` above
//          the seat's top, `thickness` front to back, leaning back `lean`
//          degrees, sunk `sink` into the seat; `detail`, `clay`
//   colors `seat` and `frame`, as above
export const CHAIR = {
  seat: {
    width: 1.6,
    depth: 2, // the seat, two units deep: the same as a bench's and a sofa's seat (2026-10-18; was 1.6)
    thickness: 0.25,
    detail: 1,
    clay: { amount: 0.3, seed: 41 },
  },
  legs: {
    shape: "cylinder",
    radius: 0.12,
    height: 1.4,
    inset: 0.25,
    detail: 1,
    clay: { amount: 0.3, seed: 42 },
  },
  back: {
    height: 1.6,
    thickness: 0.2,
    lean: 6,
    sink: 0.1,
    detail: 1,
    clay: { amount: 0.3, seed: 43 },
  },
  colors: {
    seat: PALETTE.chair.seat,
    frame: PALETTE.chair.frame,
  },
};

// What can be changed on a chair, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const CHAIR_KNOBS = [
  { label: "width", path: "seat.width", step: 0.2, min: 0.5 },
  { label: "height", path: "legs.height", step: 0.2, min: 0.2 },
  { label: "back", path: "back.height", step: 0.2, min: 0 },
  { label: "seat", path: "colors.seat.hex", color: true },
  { label: "frame", path: "colors.frame.hex", color: true },
];
