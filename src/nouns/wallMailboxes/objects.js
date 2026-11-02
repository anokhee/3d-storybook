import { solid } from "../../world/palette.js";

// A WALL OF MAILBOXES: the little letterboxes in a building's lobby, one
// to a flat, in a grid on a cabinet hung flat against the wall — its back
// at z = 0, its doors turned out to +z, its foot at y = 0, lifted `hang` up
// (its bottom edge off the floor). In the library's furniture units, as
// the wall clock is (a room shrinks it by its `scale`).
//   cols, rows  how many boxes across and up
//   box     each one's door: `width` across, `height` up, `gap` between
//           neighbours; `proud` how far a door stands out of the cabinet
//   frame   the cabinet's border round the grid, `depth` off the wall
//   slot    the letter slot across each door's top: `width` (a share of
//           the door's), `height`, `up` from the door's middle (a share of
//           its half-height)
//   label   the little name card under it: `width` (a share), `height`,
//           `down` from the middle (a share of the half-height)
//   knob    the round lock by the bottom corner: `radius`
//   post    the share of boxes with a letter poking out of the slot, which
//           ones by `seed`
//   colors  `cabinet`, `door`, `slot`, `label`, `knob`, `letter`
export const WALL_MAILBOXES = {
  cols: 4,
  rows: 5,
  hang: 3.0,
  box: { width: 0.55, height: 0.4, gap: 0.05, proud: 0.03 },
  frame: 0.12,
  depth: 0.4,
  slot: { width: 0.62, height: 0.05, up: 0.45 },
  label: { width: 0.42, height: 0.09, down: 0.3 },
  knob: { radius: 0.035 },
  post: 0.25,
  seed: 1,
  colors: {
    cabinet: solid("#9C7A45"),
    door: solid("#C9A45C"),
    slot: solid("#2B2530"),
    label: solid("#F2E9DC"),
    knob: solid("#5A4630"),
    letter: solid("#F7F4EE"),
  },
};

export const WALL_MAILBOXES_KNOBS = {
  cols: { path: "cols", range: [1, 10, 1] },
  rows: { path: "rows", range: [1, 10, 1] },
  hang: { path: "hang", range: [0, 6, 0.1], name: "hung up (its bottom off the floor)" },
  boxWidth: { path: "box.width", range: [0.2, 1.2, 0.01], name: "box width" },
  boxHeight: { path: "box.height", range: [0.2, 1.2, 0.01], name: "box height" },
  gap: { path: "box.gap", range: [0, 0.2, 0.005] },
  frame: { path: "frame", range: [0, 0.4, 0.01], name: "cabinet border" },
  post: { path: "post", range: [0, 1, 0.05], name: "letters poking out (share)" },
  seed: { path: "seed", range: [1, 60, 1] },
  cabinet: { path: "colors.cabinet.hex", color: true, name: "cabinet colour" },
  door: { path: "colors.door.hex", color: true, name: "door colour" },
  label: { path: "colors.label.hex", color: true, name: "label colour" },
};

// How big it is: `w` across, `h` up, `d` off the wall (the doors' fronts)
export function wallMailboxesSizeOf(C) {
  return {
    w: C.cols * C.box.width + (C.cols - 1) * C.box.gap + 2 * C.frame,
    h: C.rows * C.box.height + (C.rows - 1) * C.box.gap + 2 * C.frame,
    d: C.depth + C.box.proud,
  };
}
