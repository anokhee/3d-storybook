import { solid } from "../../world/palette.js";

// SALT AND PEPPER SHAKERS: a little pair for the table — each a rounded
// ceramic body with a domed steel cap, its holes in a ring on top (salt's
// five, pepper's three, so they tell apart). `which` stands both side by
// side, or just the one. In the library's own units, as the Mug is.
//   which    "pair", "salt" or "pepper" (SHAKER_WHICH)
//   height   the body's; `radius` its
//   cap      `height` of the dome, a share of the height
//   gap      between the two of a pair
//   colors   `salt` and `pepper` (the bodies), `cap`, `holes`
export const SHAKERS = {
  which: "pair",
  height: 0.26,
  radius: 0.075,
  cap: { height: 0.3 },
  gap: 0.06,
  colors: {
    salt: solid("#F7F4EE"),
    pepper: solid("#3E3A44"),
    cap: solid("#C9CED6"),
    holes: solid("#2F2A36"),
  },
};
export const SHAKER_WHICH = ["pair", "salt", "pepper"];

export const SHAKERS_KNOBS = [
  { label: "which", path: "which", options: SHAKER_WHICH },
  { label: "height", path: "height", step: 0.02, min: 0.1, max: 0.8 },
  { label: "radius", path: "radius", step: 0.005, min: 0.03, max: 0.25 },
  { label: "salt", path: "colors.salt.hex", color: true, if: { arg: "which", neq: "pepper" } },
  { label: "pepper", path: "colors.pepper.hex", color: true, if: { arg: "which", neq: "salt" } },
  { label: "cap", path: "colors.cap.hex", color: true },
];
