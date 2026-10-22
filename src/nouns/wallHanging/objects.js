import { PALETTE } from "../../world/palette.js";

// A wall hanging: a framed picture, hung flat against a wall — dragged
// up to one and turned to face out from it, the way anything in a room
// is placed (see interior/), and lifted to hang at `hang`. It keeps
// nothing off it, the way a rug does (see IN_GROUND in
// ../water/objects.js), so it hangs over a couch. A board `width` by
// `height`, `thickness` thick, in the frame's color, with the backing
// set in it `frame.thickness` in from every edge, and the art on that:
// a polygon of `sides` points equidistant from its middle, `radius` out
// as a share of the backing's shorter half-side (1 touches the frame),
// `inner` pinching every other point in to that share of the radius,
// making it a star (1 no pinch), `turn`ed in degrees, `raise` proud of
// the backing, `color` its own. It faces +z with its foot at y = 0,
// hung `hang` above where it stands.
export const WALL_HANGING = {
  width: 2.4,
  height: 1.8,
  thickness: 0.12,
  hang: 3,
  frame: { thickness: 0.2, color: PALETTE.wallHanging.frame },
  backing: { color: PALETTE.wallHanging.backing },
  art: {
    sides: 5,
    radius: 0.7,
    inner: 1,
    turn: 0,
    raise: 0.04,
    color: PALETTE.wallHanging.art,
  },
};

// What can be changed on a wall hanging, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const WALL_HANGING_KNOBS = [
  { label: "width", path: "width", step: 0.2, min: 0.4 },
  { label: "height", path: "height", step: 0.2, min: 0.4 },
  { label: "hang", path: "hang", step: 0.2, min: 0 },
  { label: "frame", path: "frame.thickness", step: 0.05, min: 0 },
  { label: "frame color", path: "frame.color.hex", color: true },
  { label: "backing", path: "backing.color.hex", color: true },
  { label: "sides", path: "art.sides", step: 1, min: 3, max: 12 },
  { label: "size", path: "art.radius", step: 0.05, min: 0.05, max: 1 },
  { label: "inner", path: "art.inner", step: 0.1, min: 0, max: 1 },
  { label: "turn", path: "art.turn", step: 15, min: 0, max: 360 },
  { label: "art color", path: "art.color.hex", color: true },
];
