import { solid } from "../../../world/palette.js";

// Whole cupcakes, by name: each a set of overrides on CUPCAKE (laid over
// it with merge) that makes a different flavour. Not every field has a
// knob, so each flavour's story lays its variant under the knobs and starts
// them from it (stories/helpers/cupcake.jsx).
export const CUPCAKE_VARIANTS = {
  vanilla: { door: { color: solid("#C95C80") } },
  strawberry: {
    cup: { color: solid("#E8647C"), flutes: 15 },
    cake: { color: solid("#F3D9A0") },
    frosting: { color: solid("#F9A8BD"), stack: 2 },
    syrup: { color: solid("#C73A58") },
    topper: { kind: "strawberry", flip: true, tilt: 25, sink: 0.35 },
    sprinkles: { shape: "sphere", radius: 0.05, count: 40, colors: [solid("#FFE9A8"), solid("#FFF6DC")] },
    door: { width: 1.3, color: solid("#B8324F") },
    windows: { type: "arched", columns: 2, rows: 2, width: 0.8, height: 1 },
    boxes: { color: solid("#F3E3C8") },
  },
  "birthday cake": {
    cup: { color: solid("#7FB6E8"), height: 4.2, flutes: 34 },
    cake: { color: solid("#F6E3B4") },
    frosting: { color: solid("#FFFFFF"), stack: 3 },
    syrup: { color: solid("#F26D8D") },
    topper: { kind: "number", size: 1, sink: 0.05, config: { height: 1.4, color: solid("#F26D8D") } },
    straws: { kind: "candles", ring: 2.2, count: 6, size: 0.8 },
    door: { width: 1.7, height: 2.3, color: solid("#F26D8D") },
    windows: { type: "square", columns: 3, rows: 2, width: 0.8, height: 1.2, y: 2.6 },
    boxes: { flowers: { shape: "tulip", count: 3 } },
  },
  chocolate: {
    cup: { color: solid("#6B4130"), radius: 3.5, flutes: 27, pleat: 0.1 },
    cake: { color: solid("#5A3420") },
    frosting: { color: solid("#7A4A2E"), stack: 3 },
    syrup: { color: solid("#F3E3C8"), waves: 6, amp: 18 },
    topper: { kind: "cherry" },
    sprinkles: { colors: [solid("#F3E3C8"), solid("#FFD092")] },
    windows: { type: "arched", columns: 1, rows: 3, width: 0.7, height: 1.6 },
    boxes: { on: false },
    door: { color: solid("#F3E3C8") },
  },
  "flower cupcake": {
    cup: { color: solid("#CDB4F0") },
    cake: { color: solid("#F6E3B4") },
    frosting: { color: solid("#FDE9F3"), stack: 2 },
    syrup: { color: solid("#B79AE0"), waves: 16 },
    topper: { kind: "tulip", size: 1.3 },
    sprinkles: {
      shape: "tulip",
      radius: 0.4,
      count: 32,
      colors: [solid("#FFFFFF"), solid("#FFD166"), solid("#F26D8D"), solid("#9B7BE0")],
    },
    door: { color: solid("#9B7BE0") },
  },
  "toy cupcake": {
    cup: { color: solid("#DCCBF7"), flutes: 23 },
    cake: { color: solid("#FFD166") },
    frosting: { color: solid("#FF9F55"), stack: 1 },
    syrup: { color: solid("#FFFFFF") },
    topper: { kind: "jack-in-the-box", size: 1 },
    straws: { ring: 3 },
    windows: { type: "round", width: 1, height: 1, columns: 1, rows: 1 },
    sprinkles: {
      shape: "pentagram",
      radius: 0.1,
      count: 36,
      colors: [solid("#FFD166"), solid("#4F8FE0"), solid("#7ED491"), solid("#FFFFFF")],
    },
    door: { color: solid("#FF9F55") },
  },
  peppermint: {
    cup: { color: solid("#E5384B"), flutes: 21, pleat: 0.08 },
    cake: { color: solid("#F6E3B4") },
    frosting: { color: solid("#FFF8F0"), stack: 2 },
    syrup: { color: solid("#E5384B"), waves: 12, amp: 14 },
    topper: { kind: "peppermint", size: 1.4 },
    sprinkles: {
      shape: "torus",
      radius: 0.12,
      count: 30,
      colors: [solid("#E5384B"), solid("#FFF8F0")],
    },
    door: { color: solid("#FFF8F0") },
    windows: { type: "arched", columns: 1, rows: 2, width: 0.8, height: 1.4 },
    boxes: { color: solid("#FFF8F0"), soil: solid("#8A2430") },
  },
};

export const CUPCAKE_VARIANT_NAMES = Object.keys(CUPCAKE_VARIANTS);
