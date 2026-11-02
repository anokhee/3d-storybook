import { solid } from "../../world/palette.js";

// A BICYCLE: a little town bike, built round the characters
// (src/nouns/anthro) so one rides it as they stand, at their own size: the
// saddle where a seated one's seat is, the cranks turning the pedals
// right under their feet (the "cycle" pose, Anthro.jsx's PEDAL, is worked
// out from the same circle), the grips in their hands. It stands on y = 0
// facing +z, its middle plane x = 0. Tubes, wheels, saddle and bars are
// placed from that fit, so the knobs are its look, not its size.
//
//   style     "diamond" (a top tube from the saddle to the bars) or
//             "step-through" (a low swept tube instead, easy to get on)
//   wheel     `radius` to the tyre's outside, the tyre `tire` thick,
//             `spokes` in each
//   tube      the frame's tubes' radius
//   basket    a wicker basket on the front, over the wheel
//   fenders   mudguards over both wheels, in the frame's colour
//   bell      a bell on the bar, by the right grip
//   colors    `frame`, `tire`, `metal` (rims, spokes, cranks, chain,
//             bars), `saddle`, `grips`, `basket`, `bell`
export const BICYCLE = {
  style: "diamond",
  wheel: { radius: 0.18, tire: 0.022, spokes: 12 },
  tube: 0.016,
  basket: true,
  fenders: true,
  bell: true,
  colors: {
    frame: solid("#3F8F8A"),
    tire: solid("#2F2A36"),
    metal: solid("#C3CBD2"),
    saddle: solid("#6B4A33"),
    grips: solid("#6B4A33"),
    basket: solid("#C89B5E"),
    bell: solid("#F2C94C"),
  },
};

// Where a rider sits: the saddle's top, in the bicycle's own frame. A
// game puts a character here in the "cycle" pose (see stories/helpers/cyclist.jsx).
export const BICYCLE_SEAT = [0, 0.38, 0];

export const BICYCLE_KNOBS = {
  style: { path: "style", options: ["diamond", "step-through"] },
  basket: { path: "basket", bool: true, on: true, off: false },
  fenders: { path: "fenders", bool: true, on: true, off: false },
  bell: { path: "bell", bool: true, on: true, off: false },
  spokes: { path: "wheel.spokes", range: [0, 24, 1] },
  frameColor: { path: "colors.frame.hex", color: true, name: "frame color" },
  tireColor: { path: "colors.tire.hex", color: true, name: "tyre color" },
  saddleColor: { path: "colors.saddle.hex", color: true, name: "saddle color" },
  gripsColor: { path: "colors.grips.hex", color: true, name: "grips color" },
  basketColor: { path: "colors.basket.hex", color: true, name: "basket color" },
};
