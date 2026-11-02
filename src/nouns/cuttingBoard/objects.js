import { solid } from "../../world/palette.js";

// A cutting board: a slab of wood lying flat on a worktop, its corners
// rounded, a hole through it at its right end (+x) to hang it up by, and
// on it what's being cut — a few round `slices` (a carrot's, a
// cucumber's) in a row toward the left, and a knife across the right,
// its blade pointing back (-z). In the counter's units (see Counter):
// it lies on y = 0, centred on x = 0, its long side along x.
//
//   board   `width` along x, `depth` across, `thickness` through,
//           `cornerRadius` its corners, `hole` the hang hole's radius
//           (0: none), in from the right end by `holeIn`
//   slices  `count` rounds (0: none), `radius` each, `thickness`, in a
//           slanted row overlapping by `overlap` (a share of a round)
//   knife   `on`, its `blade` length and `width`, its `handle` length
//   colors  `board`, `slice` and its `core` (a smaller round on top),
//           `blade`, `handle`
export const CUTTING_BOARD = {
  board: { width: 1.3, depth: 0.8, thickness: 0.07, cornerRadius: 0.12, hole: 0.06, holeIn: 0.14 },
  slices: { count: 5, radius: 0.09, thickness: 0.03, overlap: 0.35 },
  knife: { on: true, blade: 0.5, width: 0.1, handle: 0.3 },
  colors: {
    board: solid("#C99A62"),
    slice: solid("#E8833A"),
    core: solid("#F2A65A"),
    blade: solid("#C9CED3"),
    handle: solid("#2F2A36"),
  },
};

// What can be changed on a cutting board, from the panel.
export const CUTTING_BOARD_KNOBS = [
  { label: "width", path: "board.width", step: 0.05, min: 0.6, max: 2.4 },
  { label: "depth", path: "board.depth", step: 0.05, min: 0.4, max: 1.4 },
  { label: "hang hole", path: "board.hole", step: 0.01, min: 0, max: 0.12 },
  { label: "slices", path: "slices.count", step: 1, min: 0, max: 8 },
  { label: "knife", path: "knife.on", bool: true, on: true, off: false },
  { label: "board colour", path: "colors.board.hex", color: true },
  { label: "slice colour", path: "colors.slice.hex", color: true },
  { label: "slice core", path: "colors.core.hex", color: true },
];
