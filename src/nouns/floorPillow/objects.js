import { solid } from "../../world/palette.js";

// The floor pillow's own swatches: a candy red cushion piped in yellow.
const paint = {
  body: solid("#E5534B"),
  piping: solid("#F4D46A"),
};

// A floor pillow: one fat squashy cushion lying on the ground, `size`
// across and `thickness` thick, with a button tufted into the middle of
// its top and a line of piping round its middle.
//
//   shape      "square", a rounded square whose edges dome over, or
//              "round", a flattened ball
//   corner     how far the square's corners round (nothing for round)
//   dome       how much of the thickness the square's edges round over, as
//              a share of it (0.5 is fully domed, smaller is flatter)
//   tuft       the button: a ball of `radius` sunk `sink` of its radius into
//              the top, in the piping's color
//   piping     a cord of `radius` round the pillow's waist, in its own color
//   colors     `body` and `piping` (the cord and the button)
export const FLOOR_PILLOW_SHAPES = ["square", "round"];

export const FLOOR_PILLOW = {
  shape: "square",
  size: 1.6,
  thickness: 0.5,
  corner: 0.3,
  dome: 0.45,
  tuft: { radius: 0.11, sink: 0.55 },
  piping: { radius: 0.035 },
  colors: {
    body: paint.body,
    piping: paint.piping,
  },
};

// What can be changed on a floor pillow, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const FLOOR_PILLOW_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.6, max: 3.5 },
  { label: "thickness", path: "thickness", step: 0.05, min: 0.15, max: 1.2 },
  { label: "shape", path: "shape", options: FLOOR_PILLOW_SHAPES },
  { label: "colour", path: "colors.body.hex", color: true },
  { label: "piping", path: "colors.piping.hex", color: true },
];
