import { solid } from "../../world/palette.js";

// A STREET LAMP: a post on a plinth with a light at the top, stood on the
// ground with the post's middle at the origin. Two styles:
//   "arm"      an arm reaching out along +x from the top of the post, a
//              dome of a shade hung from its end with the bulb under it —
//              turn it so the arm reaches over the road
//   "lantern"  a lantern sat on top of the post: a lit glass body under a
//              pointed cap with a ball on top
//
//   base     the plinth: `radius`, `height`, with a collar over it
//   pole     the post: `radius` at its foot (it tapers to `taper` of that),
//            `height` from the ground to its top
//   arm      `length` out from the post, `drop` how far its end hangs below
//            the top of the post, `radius` its thickness; the shade a dome
//            `shade` wide
//   lantern  the lantern's glass body `radius` and `height`, its cap `cap`
//            of the radius again wide
//   bulb     `radius`, and `light` how it is lit (see LIGHT in
//            adjectives/lit): lit, it is its own colour from any angle with
//            a halo round it — `brightness` 0 is out
//   glow     the light it throws on the street round it, a point of light
//            at the bulb: `intensity`, `distance` how far it reaches; or
//            null for none (real lights are dear: a long street of them
//            may want only the halo)
//   colors   the post and its ironwork, the bulb (and its glow)
export const STREET_LAMP = {
  style: "arm",
  base: { radius: 0.17, height: 0.4 },
  pole: { radius: 0.06, taper: 0.7, height: 3.4 },
  arm: { length: 0.75, drop: 0.1, radius: 0.03, shade: 0.24 },
  lantern: { radius: 0.15, height: 0.38, cap: 1.5 },
  bulb: { radius: 0.12, light: { type: "lit", brightness: 0.8 } },
  glow: { intensity: 10, distance: 9 },
  colors: {
    post: solid("#3B2A4E"),
    bulb: solid("#FFE7A3"),
  },
};
export const STREET_LAMP_STYLES = ["arm", "lantern"];

export const STREET_LAMP_KNOBS = {
  style: { path: "style", options: STREET_LAMP_STYLES },
  height: { path: "pole.height", range: [1.5, 7, 0.1] },
  armLength: { path: "arm.length", range: [0.3, 2, 0.05], name: "arm length" },
  brightness: { path: "bulb.light.brightness", range: [0, 1, 0.05] },
  glow: { path: "glow.intensity", range: [0, 40, 1], name: "glow" },
  postColor: { path: "colors.post.hex", color: true, name: "post color" },
  bulbColor: { path: "colors.bulb.hex", color: true, name: "bulb color" },
};
