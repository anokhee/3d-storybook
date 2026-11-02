import { solid } from "../../world/palette.js";

// THE BAKER'S GOODS, the ones on a bakery's shelves (Furniture/Storage/
// Shelving, style "cakes"; a shopfront's window display): each its own
// entry under Food/Baked. They stand on y = 0, in the world's units at the
// character's scale (they are 1.31 high), as the shelves hold them.
//
// A CAKE: a round iced cake, a layer of icing on top, a cherry on that.
//   radius   the cake's, `height` its sponge's
//   icing    `thick`, `color`; or null
//   cherry   `radius`, `color`; or null
//   color    the sponge
export const CAKE = {
  radius: 0.1,
  height: 0.1,
  icing: { thick: 0.03, color: solid("#F2A7C3") },
  cherry: { radius: 0.022, color: solid("#D9483B") },
  color: solid("#F6E3C8"),
};
const CHERRY = CAKE.cherry;
export const CAKE_KNOBS = [
  { label: "radius", path: "radius", step: 0.01, min: 0.04, max: 0.4 },
  { label: "height", path: "height", step: 0.01, min: 0.03, max: 0.4 },
  { label: "cherry", path: "cherry", bool: true, on: CHERRY, off: null },
  { label: "sponge", path: "color.hex", color: true },
  { label: "icing", path: "icing.color.hex", color: true },
];

// A LOAF: a round loaf of bread, a squashed ball, a little longer than wide.
//   size     its length, `height` and `width` as shares of it
//   color    the crust
export const LOAF = {
  size: 0.26,
  height: 0.27,
  width: 0.65,
  color: solid("#D9A066"),
};
export const LOAF_KNOBS = [
  { label: "size", path: "size", step: 0.02, min: 0.1, max: 0.8 },
  { label: "height", path: "height", step: 0.02, min: 0.1, max: 0.6 },
  { label: "width", path: "width", step: 0.05, min: 0.3, max: 1 },
  { label: "crust", path: "color.hex", color: true },
];
