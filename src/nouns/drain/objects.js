import { solid } from "../../world/palette.js";

// A DRAIN, let into the ground (its face a hair over y = 0, its middle on
// the origin): a "grate" — the slotted gully grating in a road's gutter
// against the kerb, `width` along the kerb (x) by `depth` out from it, its
// `slots` running across — or a "manhole" cover, round, `radius` across,
// a raised rim and rings and bars cast into it.
export const DRAIN = {
  style: "grate",
  width: 0.62,
  depth: 0.36,
  slots: 6,
  radius: 0.36,
  color: solid("#3A3640"),
  dark: solid("#1C1A20"),
};
export const DRAIN_STYLES = ["grate", "manhole"];

export const DRAIN_KNOBS = {
  style: { path: "style", options: DRAIN_STYLES },
  width: { path: "width", range: [0.2, 1.5, 0.02] },
  depth: { path: "depth", range: [0.1, 1, 0.02] },
  slots: { path: "slots", range: [2, 14, 1] },
  radius: { path: "radius", range: [0.15, 0.8, 0.01], name: "manhole radius" },
  color: { path: "color.hex", color: true },
};
