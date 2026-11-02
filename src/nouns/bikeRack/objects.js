import { solid } from "../../world/palette.js";

// A BIKE RACK: a row of hoops to lock a bike to — each a bent tube, two
// legs up out of the ground and a half-round over the top — stood in a
// row along x, each hoop's plane along z (square to the row, as a bike
// stands against it), its middle on the origin, its feet on y = 0. Sized
// to the characters: a hoop comes to their waist. It stands on a pavement's
// kerb strip, with the lamp posts, the row along the kerb.
//
//   count    hoops in the row, `spacing` apart
//   width    across a hoop, leg to leg; `height` to the top of its arch
//   tube     the tube's radius
//   color    the metal's
export const BIKE_RACK = {
  count: 4,
  spacing: 0.3,
  width: 0.42,
  height: 0.55,
  tube: 0.018,
  color: solid("#3B2A4E"),
};

export const BIKE_RACK_KNOBS = {
  count: { path: "count", range: [1, 10, 1], name: "hoops" },
  spacing: { path: "spacing", range: [0.2, 1.5, 0.05] },
  width: { path: "width", range: [0.2, 1.5, 0.05] },
  height: { path: "height", range: [0.3, 1.5, 0.05] },
  color: { path: "color.hex", color: true, name: "color" },
};
