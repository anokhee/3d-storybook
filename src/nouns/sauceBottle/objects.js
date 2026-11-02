import { solid } from "../../world/palette.js";

// A SAUCE BOTTLE: a diner's squeeze bottle standing on the ground — a
// soft round-shouldered body turned on a lathe, a band of label round
// its middle, a screw cap on its neck and a pointed nozzle on that.
// In the library's own units, as the Mug and Teapot are (the café sets
// them at its furniture's scale).
//   height   to the top of the body's shoulder (the cap and nozzle stand on that)
//   radius   the body's
//   label    the band: `height` up it, `at` its middle as a share of
//            `height`; or null for none
//   cap      `radius` (a share of `radius`), `height`
//   nozzle   a cone `height` tall, `radius` at its foot (a share of the cap's)
//   sauce    which (SAUCES), its colours laid over `colors`; "custom"
//            keeps `colors` as given
//   colors   `body`, `label`, `cap` (the nozzle too)
export const SAUCE_BOTTLE = {
  sauce: "ketchup",
  height: 0.62,
  radius: 0.14,
  sides: 20,
  label: { height: 0.22, at: 0.45 },
  cap: { radius: 0.55, height: 0.07 },
  nozzle: { height: 0.13, radius: 0.55 },
  colors: { body: solid("#C8332B"), label: solid("#F7F4EE"), cap: solid("#C8332B") },
};

// The three sauces, laid over SAUCE_BOTTLE
export const SAUCE_BOTTLE_KINDS = {
  ketchup: { colors: { body: solid("#C8332B"), label: solid("#F7F4EE"), cap: solid("#C8332B") } },
  mustard: { colors: { body: solid("#F2C230"), label: solid("#C8332B"), cap: solid("#F2C230") } },
  mayo: { colors: { body: solid("#F4EFE2"), label: solid("#3B6E8F"), cap: solid("#3B6E8F") } },
};
export const SAUCES = Object.keys(SAUCE_BOTTLE_KINDS);

// One knob list for every sauce: which sauce (its colours), or "custom"
// to colour it yourself.
export const SAUCE_BOTTLE_KNOBS = [
  { label: "sauce", path: "sauce", options: [...SAUCES, "custom"] },
  { label: "height", path: "height", step: 0.02, min: 0.3, max: 1.2 },
  { label: "radius", path: "radius", step: 0.01, min: 0.06, max: 0.3 },
  { label: "nozzle", path: "nozzle.height", step: 0.01, min: 0.04, max: 0.3 },
  { label: "body", path: "colors.body.hex", color: true, if: { arg: "sauce", eq: "custom" } },
  { label: "label", path: "colors.label.hex", color: true, if: { arg: "sauce", eq: "custom" } },
  { label: "cap", path: "colors.cap.hex", color: true, if: { arg: "sauce", eq: "custom" } },
];
