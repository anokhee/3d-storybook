import { PALETTE } from "../../world/palette.js";
import { PATTERN } from "../pattern/objects.js";

// A couch: a bench gone soft. A boxy base stood on four short legs, a
// chunky arm at each end, seat cushions laid along it between the arms,
// and back cushions leaning against nothing much along its back. Every
// part is a clay cube pressed to shape (see FORM), thrown in lumpy clay
// (see CLAY) so the cushions are plump. It stands on the ground with its
// length running x and its front facing +z, like a bench. Colors come
// from PALETTE (src/world/palette.js): `colors`, the `frame` — the base
// and the arms — the `cushions`, seat and back alike, the `pillows` and
// the `legs`.
//
//   base      the box under everything: `width` along the couch, `depth`
//             across it and `height` from the legs' tops to its top, in
//             world units; `detail` and `clay` as any primitive's
//   legs      the four under its corners: `shape` any of PRIMITIVES,
//             `radius`, `height` off the ground to the base's underside,
//             `inset` how far in from the base's corners each stands,
//             `detail`, `clay`
//   arms      one at each end, standing on the legs' tops beside the
//             base: `width` along the couch, `height` above the base's
//             top, and as deep as the base; `detail`, `clay`
//   cushions  the seat, laid on the base between the arms: `count` of
//             them along it with `spacing` between, `thickness` thick,
//             kept `inset` in from the base's front edge, and sunk `sink`
//             into it; `detail`, `clay`; `pattern` the dots raised on
//             every cushion, seat and back alike — on a seat cushion's
//             top, a back cushion's front (see PATTERN in
//             ../pattern/objects.js)
//   back      the back cushions, one per seat cushion, stood on the base
//             along its back edge: `height` tall from the base's top,
//             `thickness` front to back, leaning back `lean` degrees,
//             sunk `sink` into the base; `detail`, `clay`
//   pillows   two square throw pillows, one at each end, sat on the seat
//             and leaning on the back cushions: `size` across, `thickness`
//             front to back, their middles `spread` apart, leaning
//             `lean` degrees further back than the back cushions, and
//             turned `turn` degrees about their own faces where they
//             stand — mirrored, so the pair tilt away from each other;
//             45 sets them on a corner, as diamonds; `detail`, `clay`;
//             `pattern` the dots raised on their fronts, their own (see
//             PATTERN)
//   colors    `frame`, `cushions`, `pillows` and `legs`, as above
export const COUCH = {
  base: {
    width: 7,
    depth: 2.8,
    height: 0.8,
    detail: 1,
    clay: { amount: 0.25, seed: 21 },
  },
  legs: {
    shape: "cylinder",
    radius: 0.16,
    height: 0.35,
    inset: 0.45,
    detail: 1,
    clay: null,
  },
  arms: {
    width: 0.7,
    height: 1.1,
    detail: 1,
    clay: { amount: 0.3, seed: 22 },
  },
  cushions: {
    count: 3,
    spacing: 0.08,
    thickness: 0.6,
    inset: 0.1,
    sink: 0.08,
    detail: 1,
    clay: { amount: 0.45, seed: 23 },
    pattern: {
      ...PATTERN,
      layout: "none",
      spacing: 0.5,
      inset: 0.2,
      raise: 0.06,
      dots: [{ ...PATTERN.dots[0], radius: 0.12 }],
    },
  },
  back: {
    height: 1.7,
    thickness: 0.6,
    lean: 8,
    sink: 0.1,
    detail: 1,
    clay: { amount: 0.45, seed: 24 },
  },
  pillows: {
    count: 2, // how many, spread evenly along the back: 2 one at each end, 1 in the middle, 0 none
    size: 0.9,
    thickness: 0.3,
    spread: 4.4,
    lean: 6,
    turn: 0,
    detail: 1,
    clay: { amount: 0.4, seed: 25 },
    pattern: {
      ...PATTERN,
      layout: "none",
      spacing: 0.3,
      inset: 0.12,
      raise: 0.05,
      dots: [{ ...PATTERN.dots[0], radius: 0.08 }],
    },
  },
  colors: {
    frame: PALETTE.couch.frame,
    cushions: PALETTE.couch.cushions,
    pillows: PALETTE.couch.pillows,
    legs: PALETTE.couch.legs,
  },
};

// What can be changed on a couch, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const COUCH_KNOBS = [
  { label: "width", path: "base.width", step: 0.5, min: 2 },
  { label: "cushions", path: "cushions.count", step: 1, min: 1, max: 8 },
  { label: "back", path: "back.height", step: 0.2, min: 0.2 },
  { label: "pillows", path: "pillows.count", step: 1, min: 0, max: 4 },
  { label: "pillow size", path: "pillows.size", step: 0.1, min: 0.2 },
  { label: "pillow spread", path: "pillows.spread", step: 0.2, min: 0 },
  { label: "pillow turn", path: "pillows.turn", step: 5, min: -90, max: 90 },
  { label: "frame", path: "colors.frame.hex", color: true },
  { label: "cushions color", path: "colors.cushions.hex", color: true },
  { label: "pillows color", path: "colors.pillows.hex", color: true },
  { label: "cushion dots", path: "cushions.pattern.layout", options: ["grid", "stagger", "border", "rings", "none"] },
  { label: "cushion dot spacing", path: "cushions.pattern.spacing", step: 0.1, min: 0.1 },
  { label: "cushion dot inset", path: "cushions.pattern.inset", step: 0.1, min: 0 },
  { label: "pillow dots", path: "pillows.pattern.layout", options: ["grid", "stagger", "border", "rings", "none"] },
  { label: "pillow dot spacing", path: "pillows.pattern.spacing", step: 0.1, min: 0.05 },
  { label: "pillow dot inset", path: "pillows.pattern.inset", step: 0.05, min: 0 },
];
