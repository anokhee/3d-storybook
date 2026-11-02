import { solid } from "../../world/palette.js";
import { DOT, LAYOUTS } from "../pattern/objects.js";

// A CURTAIN: a little rod with a knob at each end, and a pair of pleated
// panels hanging from it on rings, drawn back toward the ends as far as
// `open` says. The cloth is one colour, or patterned the way the sofa's
// cushions and pillows are (Furniture/Seating/Couch: dots raised on it,
// see ../pattern/objects.js), the dots following the folds. Its rod's
// middle is at the origin, the panels hanging down -y, their faces to +z
// (into the room). In metres, as the café's windows are (they hang them:
// Shopfronts/Shop Interior, its `curtains` toggle).
//   width    the rod, knob to knob
//   length   how far the panels hang below the rod
//   rodHeight  how high its rod is off the floor (the stage's, and the
//            café's: whoever hangs it puts its rod there; floor to ceiling,
//            its `length` just short of it)
//   open     0 drawn shut across, 1 bunched right back at the ends
//   pleats   how many folds to a metre of cloth; `depth` how deep each
//   fullness how much more cloth than the rod's width, gathered into the folds
//   rod      `radius`, `knob` (the end knobs' radius), `color`; `rings` on it or not
//   color    the cloth
//   pattern  the dots on it (PATTERN's layout, spacing, inset, raise):
//            `layout` "none" for plain cloth
//   dot      the dot itself (DOT: `sides`, `radius`, `inner` — under 1 a
//            star — `turn`, `color`)
export const CURTAIN = {
  width: 0.9,
  length: 2.55,
  rodHeight: 2.6,
  open: 0.55,
  pleats: 11,
  depth: 0.018,
  fullness: 1.6,
  rod: { radius: 0.01, knob: 0.022, color: solid("#8A5A3C"), rings: true },
  color: solid("#E07A6B"),
  pattern: { layout: "none", spacing: 0.12, inset: 0.05, raise: 0.006 },
  dot: { ...DOT, radius: 0.025, color: solid("#F7F4EE") },
};

export const CURTAIN_KNOBS = [
  { label: "open", path: "open", step: 0.05, min: 0, max: 1 },
  { label: "width", path: "width", step: 0.05, min: 0.3, max: 3 },
  { label: "rod height", path: "rodHeight", step: 0.05, min: 0.5, max: 4 },
  { label: "length", path: "length", step: 0.05, min: 0.3, max: 4 },
  { label: "pleats", path: "pleats", step: 1, min: 2, max: 30 },
  { label: "pleat depth", path: "depth", step: 0.002, min: 0, max: 0.06 },
  { label: "colour", path: "color.hex", color: true },
  { label: "rod colour", path: "rod.color.hex", color: true },
  { label: "pattern", path: "pattern.layout", options: LAYOUTS },
  { label: "dot spacing", path: "pattern.spacing", step: 0.01, min: 0.1, max: 0.4 },
  { label: "dot size", path: "dot.radius", step: 0.005, min: 0.005, max: 0.08 },
  { label: "dot points", path: "dot.sides", step: 1, min: 3, max: 12 },
  { label: "dot star", path: "dot.inner", step: 0.05, min: 0.3, max: 1 },
  { label: "dot colour", path: "dot.color.hex", color: true },
];
