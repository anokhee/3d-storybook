import { PALETTE } from "../../world/palette.js";

// A bench: four clay cubes stood on the ground at the corners of a
// rectangle, a flat clay slab laid across their tops, and a frame for a
// back stuck on behind the slab — two bars standing up side by side, one
// at each end — with the back itself slatted between them. Colors come
// from PALETTE (src/world/palette.js).
//
//   legs   the four of them, one at each corner:
//            `shape` any of PRIMITIVES, `radius` its size, `detail` its
//            facet count as a multiple of the shape's, `form` how it is
//            pushed about (see FORM), `height` how tall it stands from the
//            ground to its top, in world units, before `sink`,
//            `clay` thrown in lumpy clay like a doll (see CLAY), or null
//            for smooth, `sink` how far the foot is set into the ground,
//            `apart` { x, z } how far out from the bench's middle each leg
//            stands, across and along, `color` its own
//   seat   the slab across them: `width` along the bench, `depth` across
//          it and `thickness` through it, in world units — a cube pressed
//          to that shape (see FORM), so `detail` and `clay` mean what they
//          do for a leg — and `color` its own. `count` cuts it into that
//          many slats front to back sharing the `depth`, with `spacing`
//          between them — one slat is the whole depth, two are each half
//          of it less the gap, and so on
//   backFrame  the two bars standing up behind the seat's back edge,
//          touching it, one each way `apart` along the bench from the
//          middle: both the same `shape`, `radius`, `detail`, `form` and
//          `clay` (as for a leg) and `color`, `height` tall from the
//          seat's top and set `sink` into it
//   back   the flat slats between the frame's bars, stacked up from the
//          seat's top: `height` the whole back stands, `count` how many
//          slats it is cut into and `spacing` the gap left between them —
//          one slat is the whole height, two are each half of it less the
//          gap, and so on — `thickness` through them, `lift` how far
//          above the seat the lowest one starts, `detail` and `clay` as
//          for a leg, `color` its own
//   armrests  one at each end, in line with the frame's bars: an arm
//          lying forward from the bar's front face, touching it but never
//          inside it, `height` above the seat's top, held up at its front
//          end by a post standing on the seat, set `sink` into it, its
//          middle `length` from the bar's middle — more than the two
//          radii, so the post stands clear of the bar. The arm runs on to
//          the post's front face, and the post up to the arm's underside,
//          so the two meet in a square corner. Both the same `shape`,
//          `radius`, `detail`, `form` and `clay` (as for a leg) and
//          `color`; null for none
export const BENCH = {
  legs: {
    shape: "cylinder",
    radius: 0.2,
    detail: 1,
    form: {},
    height: 2,
    clay: { amount: 0.4, seed: 11 },
    sink: 0.05,
    apart: { x: 3, z: 1 },
    color: PALETTE.bench.legs,
  },
  seat: {
    width: 7,
    depth: 2, // the seat, two units deep: the same as a chair's and a sofa's seat (2026-10-18; was 2.6)
    thickness: 0.3,
    count: 2,
    spacing: 0.15,
    detail: 1,
    clay: { amount: 0.4, seed: 12 },
    color: PALETTE.bench.seat,
  },
  backFrame: {
    shape: "cylinder",
    radius: 0.2,
    detail: 1,
    form: {},
    clay: { amount: 0.4, seed: 13 },
    height: 2,
    sink: 0.3,
    apart: 3,
    color: PALETTE.bench.backFrame,
  },
  back: {
    height: 1.6,
    count: 2,
    spacing: 0.2,
    thickness: 0.2,
    lift: 0.2,
    detail: 1,
    clay: { amount: 0.4, seed: 14 },
    color: PALETTE.bench.back,
  },
  armrests: {
    shape: "cube",
    radius: 0.2,
    detail: 1,
    form: {},
    clay: { amount: 0.4, seed: 15 },
    height: 0.8,
    length: 2.2,
    sink: 0.05,
    color: PALETTE.bench.armrests,
  },
};

// The knobs the catalog shows for a bench (stories/helpers/knobs.js says
// how to read these): the arg, where it writes, what control it gets.
export const BENCH_KNOBS = {
  seatColor: { path: "seat.color", color: true, name: "seat color" },
  legColor: { path: ["legs.color", "backFrame.color", "armrests.color"], color: true, name: "leg color" },
  backColor: { path: "back.color", color: true, name: "back color" },
  // The back's frame posts (and so the back and the armrests) stand half a
  // unit in from the seat's ends, as the bench was made: 7 wide, posts 3 apart
  width: { path: "seat.width", range: [2, 14, 0.5], also: { "backFrame.apart": (w) => w / 2 - 0.5 } },
  legHeight: { path: "legs.height", range: [0.5, 5, 0.1] },
  slats: { path: "seat.count", range: [1, 6, 1] },
  backSlats: { path: "back.count", range: [1, 6, 1] },
  backHeight: { path: "back.height", range: [0.2, 4, 0.2], name: "back height" },
};
