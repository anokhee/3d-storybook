import { solid } from "../../world/palette.js";

// The towel rack's own swatches: a plum metal rack, a soft blue towel
// with a cream stripe.
const paint = {
  rack: solid("#3B2A4E"),
  towel: solid("#8FC3DE"),
  stripe: solid("#F2E9DC"),
};

// A towel rack: a bar held off a wall on two brackets, with a towel
// draped over it. It is built flat against a wall at z = 0 facing +z,
// its foot at y = 0 and the bar hung `hang` up; `width` is the bar's
// length. With `bars` 2 a second bar hangs `spacing` above the first,
// with a towel of its own.
//
//   bar        `radius` of the rod, held `standoff` out from the wall to
//              its middle
//   bracket    a round `plate` on the wall and an arm of `radius` out to
//              the bar, each `inset` from the bar's end
//   towel      folded over the bar, `width` across (narrowed to fit between
//              the brackets), `thickness` of cloth, its front panel hanging
//              `front` below the bar and the back one `back`, the hem's
//              corners rounded by `corner`; `stripe` a band `height` tall
//              `from` above each hem (0 for none)
//   colors     `rack` (bar, brackets), `towel`, `stripe`
export const TOWEL_RACK = {
  width: 1.8,
  hang: 3,
  bars: 1,
  spacing: 1.3,
  bar: { radius: 0.05, standoff: 0.35 },
  bracket: { plate: 0.2, radius: 0.06, inset: 0.12 },
  towel: { width: 1.2, thickness: 0.12, front: 0.95, back: 1.25, corner: 0.05, stripe: { height: 0.09, from: 0.2 } },
  colors: {
    rack: paint.rack,
    towel: paint.towel,
    stripe: paint.stripe,
  },
};

// What can be changed on a towel rack, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const TOWEL_RACK_KNOBS = [
  { label: "width", path: "width", step: 0.2, min: 0.8, max: 4 },
  { label: "hang", path: "hang", step: 0.2, min: 1.4, max: 6 },
  { label: "bars", path: "bars", step: 1, min: 1, max: 2 },
  { label: "towel", path: "colors.towel.hex", color: true },
  { label: "stripe", path: "colors.stripe.hex", color: true },
  { label: "rack", path: "colors.rack.hex", color: true },
];
