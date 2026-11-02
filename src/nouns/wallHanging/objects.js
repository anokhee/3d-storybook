import { PALETTE, solid } from "../../world/palette.js";
import { merge } from "../../world/merge.js";

// A wall hanging: a framed picture, hung flat against a wall — dragged
// up to one and turned to face out from it, the way anything in a room
// is placed (see interior/), and lifted to hang at `hang`. It keeps
// nothing off it, the way a rug does (see IN_GROUND in
// ../water/objects.js), so it hangs over a couch. A board `width` by
// `height`, `thickness` thick, in the frame's color, with the backing
// set in it `frame.thickness` in from every edge, and the art on that.
// It faces +z with its foot at y = 0, hung `hang` above where it stands.
//
// What the art is, by `kind` (WALL_HANGING_KINDS lays each one's sizes
// and colours over these; see wallHangingOf):
//   "shape"      a polygon of `sides` points equidistant from its middle,
//                `radius` out as a share of the backing's shorter
//                half-side (1 touches the frame), `inner` pinching every
//                other point in to that share of the radius, making it a
//                star (1 no pinch), `turn`ed in degrees, `raise` proud of
//                the backing, `color` its own
//   "picture"    a framed print: the backing a mat round it, `mat` of the
//                backing's shorter side wide, and on it a still life — a
//                flower in a vase on a table — in `palette` (the wall
//                behind, the table, the vase, the stem, the bloom)
//   "landscape"  a view: sky, a sun, far hills, near hills, a field or
//                water across the foot, in `palette` in that order; the
//                hills' lie by `seed`
//   "abstract"   a canvas, wrapped (no frame): fields of colour, a great
//                half-round rising off its foot, a circle, a stripe, in
//                `palette`, laid out by `seed`
//   "gallery"    three small framed pictures hung together, filling
//                `width` by `height`: a tall print one side, a landscape
//                and a shape stacked the other, `gap` apart, all in the
//                frame's colour
export const WALL_HANGING = {
  kind: "shape",
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
    mat: 0.16,
    gap: 0.15,
    seed: 3,
    palette: [solid("#BFD8D2"), solid("#C08A5B"), solid("#3B6E8F"), solid("#4F7A4A"), solid("#E5534B")],
  },
};
export const WALL_HANGING_KIND_NAMES = ["shape", "picture", "landscape", "abstract", "gallery"];

// Each kind's own sizes and colours, laid over WALL_HANGING (the "shape"
// is WALL_HANGING as it is)
export const WALL_HANGING_KINDS = {
  shape: {},
  picture: {
    kind: "picture", width: 1.3, height: 1.7, thickness: 0.1,
    frame: { thickness: 0.1 }, backing: { color: solid("#F7F4EE") },
    art: { palette: [solid("#BFD8D2"), solid("#C08A5B"), solid("#3B6E8F"), solid("#4F7A4A"), solid("#E5534B")] },
  },
  landscape: {
    kind: "landscape", width: 2.8, height: 1.7, thickness: 0.1,
    frame: { thickness: 0.14, color: solid("#C9A36B") },
    art: { palette: [solid("#BFE3EC"), solid("#FFE08A"), solid("#A9C4B8"), solid("#5E8F4E"), solid("#7FA7C9")] },
  },
  abstract: {
    kind: "abstract", width: 3.2, height: 2.4, thickness: 0.14,
    frame: { thickness: 0 }, backing: { color: solid("#F2E9DC") },
    art: { palette: [solid("#E9BFA8"), solid("#E8B04A"), solid("#C9573F"), solid("#2F5D8A"), solid("#2F2A36")] },
  },
  gallery: {
    kind: "gallery", width: 2.6, height: 1.9, thickness: 0.08,
    frame: { thickness: 0.08 }, backing: { color: solid("#F7F4EE") },
  },
};

// A wall hanging of a `kind`, its own sizes and colours, and `config` over that
export const wallHangingOf = (kind, config = {}) =>
  merge(merge(WALL_HANGING, WALL_HANGING_KINDS[kind] ?? {}), config);

// What can be changed on a wall hanging, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const WALL_HANGING_KNOBS = [
  { label: "kind", path: "kind", options: WALL_HANGING_KIND_NAMES },
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
  { label: "seed", path: "art.seed", step: 1, min: 0, max: 99 },
];
