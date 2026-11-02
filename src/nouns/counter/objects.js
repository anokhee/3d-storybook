import { PALETTE } from "../../world/palette.js";

// A kitchen counter: a cabinet with a slab of worktop on it, its front
// facing +z. Whatever is stood on it stands on its top (see `surface` in
// ../station/Station.jsx). Two kinds — `kind` "plain", the worktop
// whole; or "sink", a basin sunk into it with a tap behind, the basin a
// rounded hollow the shape of the worktop's own corners (see
// ../water/Pad.jsx's roundedRect). Colors come from PALETTE
// (src/world/palette.js).
//
//   body    the cabinet: `width` along the counter, `depth` across it,
//           `height` from the floor to the top of the worktop, and
//           `cornerRadius` how round its corners are in plan
//   top     the worktop: `thickness` through it, `overhang` how far it
//           stands out past the cabinet on every side, `cornerRadius`
//           its own
//   basin   the hollow, on a sink: `width` along the counter, `length`
//           across it, `depth` down from the worktop, `cornerRadius` how
//           round its corners are, `thickness` how thick its walls and
//           bed are, and `along` how far its middle sits from the
//           counter's, along it
//   tap     behind the basin, on a sink: `radius` the pipe, `height`
//           above the worktop, `reach` how far the spout leans out over
//           the basin; or null for none
//   under   what fills the cabinet's front, under the worktop: "plain"
//           (nothing), "cupboard" (a row of doors with knobs), "oven"
//           or "dishwasher" (the appliance in a slot, cupboard doors
//           either side of it where there is room)
//   front   the doors and the appliance on the front: `thickness` how
//           far they stand off the cabinet (inside the worktop's
//           overhang), `kick` the toe space under them, `inset` how far
//           in from the cabinet's sides and top they keep, `gap` the
//           line between two, `door` how wide a cupboard door is at
//           most, `knob` its knob's radius, `slot` how wide the oven or
//           dishwasher is, `along` how far its middle sits from the
//           counter's, along it
//   colors  `body`, `top`, `basin` and `tap`, as above; `door` the
//           cupboard doors (null: a shade darker than the body),
//           `appliance` the oven's and dishwasher's fronts, `glass` the
//           oven's window, `handle` the knobs and handles
export const COUNTER = {
  kind: "plain",
  under: "plain",
  front: {
    thickness: 0.06,
    kick: 0.22,
    inset: 0.08,
    gap: 0.06,
    door: 1.3,
    knob: 0.07,
    slot: 2,
    along: 0,
  },
  body: { width: 4.5, depth: 2.2, height: 2.6, cornerRadius: 0.12 },
  top: { thickness: 0.2, overhang: 0.08, cornerRadius: 0.16 },
  basin: {
    width: 1.7,
    length: 1.2,
    depth: 0.55,
    cornerRadius: 0.24,
    thickness: 0.09,
    along: 0,
  },
  tap: { radius: 0.06, height: 0.8, reach: 0.5 },
  colors: {
    body: PALETTE.counter.body,
    top: PALETTE.counter.top,
    basin: PALETTE.counter.basin,
    tap: PALETTE.counter.tap,
    door: null,
    appliance: PALETTE.counter.appliance,
    glass: PALETTE.counter.glass,
    handle: PALETTE.counter.handle,
  },
};
export const COUNTER_KINDS = ["plain", "sink"];
export const COUNTER_UNDERS = ["plain", "cupboard", "oven", "dishwasher"];

// What can be changed on a counter, from the panel (the kind the story pins).
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const COUNTER_KNOBS = [
  { label: "under", path: "under", options: COUNTER_UNDERS },
  { label: "width", path: "body.width", step: 0.5, min: 1 },
  { label: "depth", path: "body.depth", step: 0.2, min: 0.8 },
  { label: "height", path: "body.height", step: 0.2, min: 1 },
  { label: "basin", path: "basin.width", step: 0.1, min: 0.2 },
  { label: "basin depth", path: "basin.depth", step: 0.05, min: 0.1 },
  { label: "basin along", path: "basin.along", step: 0.2, min: -3, max: 3 },
  { label: "under along", path: "front.along", step: 0.2, min: -3, max: 3 },
  { label: "body color", path: "colors.body.hex", color: true },
  { label: "top color", path: "colors.top.hex", color: true },
];
