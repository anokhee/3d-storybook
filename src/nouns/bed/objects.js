import { solid } from "../../world/palette.js";

// The bed's own swatches: a pale wood frame, white sheets, a violet duvet
// and yellow pillows, so it sits with the couch and the chairs.
const paint = {
  frame: solid("#E8C39E"),
  sheet: solid("#F7F2EA"),
  duvet: solid("#7c56be"),
  pillow: solid("#F4D46A"),
};

// A bed: a frame on four short legs with a mattress in it, a headboard
// at the back, a lower footboard at the foot, pillows at the head and a
// duvet over the lower part. It stands on the ground with its foot
// toward +z and the headboard at the back (-z). `width` is across (x)
// and `length` along (z), the frame's outer size.
//
//   frame      the low box the mattress sits on: `height` of its side,
//              on `legs` of `legHeight` and `legRadius`, each `inset`
//              from the frame's corner
//   mattress   set on the frame's top, `inset` in from its edges, `height`
//              thick, with `corner` the rounding of its corners and `bevel`
//              how much its top and bottom edges soften; it is in the
//              sheet's color
//   headboard  a panel standing from the ground behind the frame, `height`
//              above the frame's top, `thickness` thick, its top corners
//              rounded by `corner`
//   footboard  the same at the foot, lower; `on` false leaves it off
//   pillows    `count` (1 or 2) squashed rounded boxes at the head, each
//              `width` across, `depth` along and `thickness` thick, `gap`
//              apart, set `back` in from the mattress's head edge; wider
//              than the mattress allows, they narrow to fit
//   duvet      a box over the foot end of the mattress covering `cover` of
//              its length, `thickness` thick, hanging `overhang` past its
//              sides, its head edge turned back `fold` deep in a thin strip
//              of the sheet's color
//   colors     `frame`, `sheet` (the mattress and the fold), `duvet`, `pillow`
export const BED = {
  width: 3.4,
  length: 4.5,
  frame: { height: 0.5, legHeight: 0.35, legRadius: 0.12, inset: 0.25 },
  mattress: { height: 0.55, inset: 0.12, corner: 0.18, bevel: 0.05 },
  headboard: { height: 1.6, thickness: 0.2, corner: 0.5 },
  footboard: { on: true, height: 0.4, thickness: 0.2, corner: 0.15 },
  pillows: { count: 2, width: 1.2, depth: 0.8, thickness: 0.32, gap: 0.2, back: 0.15 },
  duvet: { cover: 0.66, thickness: 0.2, overhang: 0.1, fold: 0.45 },
  colors: {
    frame: paint.frame,
    sheet: paint.sheet,
    duvet: paint.duvet,
    pillow: paint.pillow,
  },
};

// What can be changed on a bed, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const BED_KNOBS = [
  { label: "length", path: "length", step: 0.2, min: 2.5, max: 7 },
  { label: "single bed", path: "pillows.count", bool: true, on: 1, off: BED.pillows.count, also: { width: (single) => (single ? 2.2 : BED.width) } },
  { label: "mattress", path: "mattress.height", step: 0.05, min: 0.2, max: 1.2 },
  { label: "frame", path: "colors.frame.hex", color: true },
  { label: "duvet", path: "colors.duvet.hex", color: true },
  { label: "pillow", path: "colors.pillow.hex", color: true },
  { label: "sheet", path: "colors.sheet.hex", color: true },
];
