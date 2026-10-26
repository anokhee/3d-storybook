import { solid } from "../../world/palette.js";
import { CAT_HEIGHT } from "../house/objects.js";

const paint = { chocolate: solid("#5A3420"), stripe: solid("#F3E3C8") };

// Chocolate straws: hollow tubes banded in two colors, standing in a ring
// round a middle with their feet at y = 0, each tipped out from upright.
// Sizes are in their own units and the whole is `scale` times that in the
// world.
//   count    how many straws
//   ring     how far from the middle each stands, in a circle round it
//   length   how long each is
//   radius   how wide each is, outside
//   wall     how thick its wall is
//   lean     degrees each tips out from upright
//   stripes  how many bands each is cut into, alternating
//   color, stripe  the two colors of the bands
export const CHOCOLATE_STRAW = {
  scale: CAT_HEIGHT / 8,
  count: 6,
  ring: 0.6,
  length: 2.4,
  radius: 0.1,
  wall: 0.035,
  lean: 14,
  stripes: 8,
  color: paint.chocolate,
  stripe: paint.stripe,
};

// What can be changed on the chocolate straws, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const CHOCOLATE_STRAW_KNOBS = [
  { label: "straws", path: "count", step: 1, min: 1, max: 16 },
  { label: "ring radius", path: "ring", step: 0.05, min: 0, max: 3 },
  { label: "length", path: "length", step: 0.1, min: 0.5, max: 4 },
  { label: "width", path: "radius", step: 0.01, min: 0.04, max: 0.3 },
  { label: "lean", path: "lean", step: 1, min: 0, max: 60 },
  { label: "stripes", path: "stripes", step: 1, min: 1, max: 16 },
  { label: "chocolate", path: "color.hex", color: true },
  { label: "stripe", path: "stripe.hex", color: true },
];
