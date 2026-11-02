import { solid } from "../../world/palette.js";

// A frying pan: a shallow pan with sloping sides standing on a burner, its
// long handle out to the right (+x), rising a little, and in it, if
// `egg` is on, an egg frying (a flat white, a yolk). In the counter's
// units (see Counter: a stove's burner is 0.34 round): it stands on
// y = 0, centred on x = 0.
//
//   radius  the rim's, `base` the bottom's (a share of it), `height` to
//           the rim, `wall` its thickness
//   handle  `length` out from the rim, `width`, `thick`, `rise` (radians);
//           its far end rounded off, a half-disc as wide as it
//   egg     `on`, how many (`count`: 1 or 2, side by side), the white's
//           `radius`, the `yolk`'s
//   colors  `pan`, `inside` (the cooking face), `handle`, `white`, `yolk`
export const FRYING_PAN = {
  radius: 0.43,
  base: 0.8,
  height: 0.1,
  wall: 0.02,
  sides: 24,
  handle: { length: 0.62, width: 0.08, thick: 0.04, rise: 0.12 },
  egg: { on: true, count: 2, radius: 0.15, yolk: 0.06 },
  colors: {
    pan: solid("#2F2A36"),
    inside: solid("#45404D"),
    handle: solid("#5A4434"),
    white: solid("#FBF7EE"),
    yolk: solid("#F2B92E"),
  },
};

// What can be changed on a frying pan, from the panel.
export const FRYING_PAN_KNOBS = [
  { label: "radius", path: "radius", step: 0.02, min: 0.15, max: 0.8 },
  { label: "handle length", path: "handle.length", step: 0.02, min: 0.2, max: 1.2 },
  { label: "egg", path: "egg.on", bool: true, on: true, off: false },
  { label: "pan colour", path: "colors.pan.hex", color: true },
  { label: "handle colour", path: "colors.handle.hex", color: true },
];
