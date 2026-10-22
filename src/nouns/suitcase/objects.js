import { solid } from "../../world/palette.js";
import { merge } from "../../world/merge.js";

// Luggage's own paints: a violet shell with plum trim for the rolling
// case, a tan leather with the same plum for the hand luggage, dark
// wheels, and brass for the clasps.
const paint = {
  shell: solid("#7c56be"),
  leather: solid("#CF8F5E"),
  trim: solid("#3B2A4E"),
  wheels: solid("#2B2530"),
  clasp: solid("#F4D46A"),
};

// A suitcase, standing on the ground with its big face toward +z. Two
// kinds share the body — a rounded box, extruded from a rounded rectangle
// with a small bevel, split by a seam line round its edge:
//
//   "rolling"  an upright hard case: two ridges across the front, a
//              telescoping handle at the back of the top (two rods and a
//              crossbar), a grab handle on the top and one on the right
//              side, and four wheels under its corners
//   "hand"     a briefcase stood on its long edge: a tube loop handle on
//              top, two straps round it with a brass clasp on each at the front, and
//              caps on its corners
//
//   kind     "rolling" or "hand"
//   pose     "standing" on its bottom edge, or "flat" lying on its back
//            face with the handle edge toward +z
//   width    across (x), `height` up (y), `depth` through (z)
//   corner   the radius of the rounded corners of the big face
//   bevel    how softly the edges round over, front and back
//   handle   0 to 1, how far the telescoping handle is drawn out (rolling)
//   wheels   `radius` and `width` of each (rolling)
//   colors   `shell` the body, `trim` handles, ridges, straps, caps and
//            seam, `wheels`, and `clasp` the brass fittings
export const SUITCASE = {
  kind: "rolling",
  pose: "standing",
  width: 1.1,
  height: 1.6,
  depth: 0.55,
  corner: 0.12,
  bevel: 0.03,
  handle: 1,
  wheels: { radius: 0.1, width: 0.08 },
  colors: {
    shell: paint.shell,
    trim: paint.trim,
    wheels: paint.wheels,
    clasp: paint.clasp,
  },
};
export const SUITCASE_KINDS = ["rolling", "hand"];
export const SUITCASE_POSES = ["standing", "flat"];

// The hand luggage as made: the same suitcase, lower and thinner, in
// leather.
export const HAND_LUGGAGE = merge(SUITCASE, {
  kind: "hand",
  height: 0.8,
  depth: 0.34,
  corner: 0.1,
  colors: { shell: paint.leather },
});

// What can be changed on a rolling suitcase, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const SUITCASE_KNOBS = [
  { label: "width", path: "width", step: 0.1, min: 0.5, max: 2.5 },
  { label: "height", path: "height", step: 0.1, min: 0.5, max: 3 },
  { label: "depth", path: "depth", step: 0.05, min: 0.2, max: 1.2 },
  { label: "handle", path: "handle", step: 0.05, min: 0, max: 1 },
  { label: "shell", path: "colors.shell.hex", color: true },
  { label: "trim", path: "colors.trim.hex", color: true },
  { label: "wheels", path: "colors.wheels.hex", color: true },
];

// And on hand luggage: no telescoping handle or wheels, but it can lie down.
export const HAND_LUGGAGE_KNOBS = [
  { label: "width", path: "width", step: 0.1, min: 0.5, max: 2.5 },
  { label: "height", path: "height", step: 0.1, min: 0.3, max: 2 },
  { label: "depth", path: "depth", step: 0.05, min: 0.15, max: 1 },
  { label: "pose", path: "pose", options: SUITCASE_POSES },
  { label: "shell", path: "colors.shell.hex", color: true },
  { label: "trim", path: "colors.trim.hex", color: true },
  { label: "clasps", path: "colors.clasp.hex", color: true },
];
