import { solid } from "../../world/palette.js";

// A cookpot: a straight-sided stockpot standing on a burner, a lid on it
// with a knob, a loop handle out either side (along x). In the counter's
// units (see Counter: a stove's burner is 0.34 round): it stands on
// y = 0, centred on x = 0.
//
//   radius  the pot's, `height` to its rim, `wall` its thickness
//   lid     `on` or not, its dome's `rise` over the rim, a `knob` that round
//   handles `reach` out from the side, `radius` the loop's tube, `span`
//           how wide each loop is
//   inside  what's in it, seen with the lid off (COOKPOT_INSIDES): "curry"
//           (the Bowl's, Food/Kitchen/Bowl), "noodles" or "empty"; `fill`
//           how far up it comes, `seed` where its bits lie
//   colors  `pot`, `lid`, `handle` (and the knob)
export const COOKPOT = {
  radius: 0.38,
  height: 0.46,
  wall: 0.025,
  sides: 24,
  lid: { on: true, rise: 0.08, knob: 0.06 },
  handles: { reach: 0.1, radius: 0.025, span: 0.16 },
  inside: "curry",
  fill: 0.75,
  seed: 4,
  colors: {
    pot: solid("#B8BEC4"),
    lid: solid("#A3AAB1"),
    handle: solid("#2F2A36"),
  },
};

export const COOKPOT_INSIDES = ["curry", "noodles", "empty"];

// What can be changed on a cookpot, from the panel.
export const COOKPOT_KNOBS = [
  { label: "radius", path: "radius", step: 0.02, min: 0.2, max: 0.8 },
  { label: "height", path: "height", step: 0.02, min: 0.15, max: 1 },
  { label: "lid", path: "lid.on", bool: true, on: true, off: false },
  { label: "inside", path: "inside", options: COOKPOT_INSIDES },
  { label: "fill", path: "fill", step: 0.05, min: 0.1, max: 1 },
  { label: "pot colour", path: "colors.pot.hex", color: true },
  { label: "lid colour", path: "colors.lid.hex", color: true },
  { label: "handle colour", path: "colors.handle.hex", color: true },
];
