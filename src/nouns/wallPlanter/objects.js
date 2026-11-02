import { solid } from "../../world/palette.js";
import { WINDOW_BOX_PLANTS } from "../windowBox/objects.js";

// A WALL PLANTER: a trough of plants hung on a wall — the Window Box
// (../windowBox/), its back to the wall, set on two brackets, a board
// behind it. Whatever a window box grows, it grows: any of the pot
// plant's kinds (a bush, a leaf, a daisy, a tulip, a poppy) or the
// window box's own ivy, trailing down the wall. It faces +z, its back on
// the wall at z = 0, its foot at y = 0 (the ground it stands over),
// hung `hang` up.
//
//   hang      how high the trough's foot is off the ground
//   box       the trough and what grows in it: a WINDOW_BOX config
//             (width, height, depth, color, soil, flowers, ivy)
//   brackets  the two under it, `inset` in from its ends: each a
//             triangle `thick` across, its arm `reach` of the trough's
//             depth along under it and as far down the wall; `color`
//   plate     the board behind it, `on` or not: `over` past the trough
//             each side and `above` it, `thick`; `color`
export const WALL_PLANTER = {
  hang: 1.7,
  box: {
    width: 1.3,
    height: 0.42,
    depth: 0.4,
    color: solid("#B5653F"),
    soil: solid("#4A3322"),
    flowers: { kind: "ivy", count: 3, radius: 0.15, stem: 0.25, forward: 0.08 },
  },
  brackets: { inset: 0.2, thick: 0.05, reach: 0.85, color: solid("#2F2A36") },
  plate: { on: true, over: 0.1, above: 0.45, thick: 0.05, color: solid("#A87A52") },
};

export const WALL_PLANTER_KNOBS = {
  plant: { path: "box.flowers.kind", options: WINDOW_BOX_PLANTS, name: "plant" },
  count: { path: "box.flowers.count", range: [1, 12, 1], name: "plants" },
  size: { path: "box.flowers.radius", range: [0.03, 0.5, 0.01], name: "plant size" },
  stem: { path: "box.flowers.stem", range: [0.02, 1, 0.01], name: "stem" },
  ivyTrail: { path: "box.ivy.trail", range: [0.3, 5, 0.1], name: "ivy trail (times the trough's height)" },
  hang: { path: "hang", range: [0.3, 3, 0.05], name: "hang" },
  width: { path: "box.width", range: [0.4, 3, 0.05], name: "width" },
  height: { path: "box.height", range: [0.15, 1, 0.05], name: "height" },
  depth: { path: "box.depth", range: [0.15, 0.8, 0.05], name: "depth" },
  boxColor: { path: "box.color.hex", color: true, name: "trough color" },
  bracketColor: { path: "brackets.color.hex", color: true, name: "bracket color" },
  plate: { path: "plate.on", bool: true, name: "board behind" },
  plateColor: { path: "plate.color.hex", color: true, name: "board color" },
};
