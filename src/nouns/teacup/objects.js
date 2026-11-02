import { solid } from "../../world/palette.js";
import { DESIGNS, DESIGN_COLORS, DESIGN_KNOBS } from "../bowl/designs.js";

// A TEACUP: a low cup, wider at the mouth than the foot, with a little
// ear of a handle on its right (+x), standing on a saucer, tea in it.
// In the library's own units, as the Mug is (a Table Setting can lay one
// in the mug's place).
//   radius   the cup's mouth, outside; `foot` the bottom's, a share of it
//   height   how tall the cup stands off the saucer
//   wall     the cup's thickness, `base` its bottom's
//   full     how high the tea stands, 0 none to 1 brimming
//   handle   `radius` the ear's, `tube` its thickness
//   saucer   `radius`, `height`; or null for none
//   band     a stripe round the cup under the rim: `width`; or null
//   design   what's painted round the cup and over the saucer (DESIGNS,
//            the Bowl's: see ../bowl/designs.js) — "basic" plain (in
//            `cup` and `saucer`, with its `band`), or "chinoiserie",
//            "striped", "folk", each in its own `colors[design]`
//   colors   `cup`, `saucer`, `band`, `drink`, and each design's
export const TEACUP = {
  radius: 0.17,
  foot: 0.6,
  height: 0.2,
  wall: 0.018,
  base: 0.03,
  sides: 24,
  full: 0.85,
  handle: { radius: 0.065, tube: 0.018 },
  saucer: { radius: 0.28, height: 0.03 },
  band: { width: 0.025 },
  design: "basic",
  colors: {
    ...DESIGN_COLORS,
    cup: solid("#F7F4EE"),
    saucer: solid("#F7F4EE"),
    band: solid("#6FA8C9"),
    drink: solid("#B5652B"),
  },
};

const SAUCER = TEACUP.saucer;
const BAND = TEACUP.band;
export const TEACUP_KNOBS = [
  { label: "design", path: "design", options: DESIGNS },
  { label: "radius", path: "radius", step: 0.01, min: 0.06, max: 0.5 },
  { label: "height", path: "height", step: 0.01, min: 0.06, max: 0.6 },
  { label: "foot", path: "foot", step: 0.05, min: 0.3, max: 1 },
  { label: "tea", path: "full", bool: true, on: TEACUP.full, off: 0 },
  { label: "saucer", path: "saucer", bool: true, on: SAUCER, off: null },
  { label: "band", path: "band", bool: true, on: BAND, off: null, if: { arg: "design", eq: "basic" } },
  { label: "cup", path: "colors.cup.hex", color: true, if: { arg: "design", eq: "basic" } },
  { label: "saucer colour", path: "colors.saucer.hex", color: true, if: { arg: "design", eq: "basic" } },
  { label: "band colour", path: "colors.band.hex", color: true, if: { arg: "design", eq: "basic" } },
  ...DESIGN_KNOBS,
  { label: "tea colour", path: "colors.drink.hex", color: true },
];
