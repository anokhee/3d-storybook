import { solid } from "../../world/palette.js";

// A PENDANT LIGHT: a bare bulb on a cord, hung from a ceiling, lit. Its
// origin is the hook it hangs from: the cord drops from y = 0, the bulb
// at its end. (On the stage it is shown hung `hang` up, as from a room's
// ceiling.)
//   cord     `length` down from the hook, `radius` thick
//   bulb     `radius` round, glowing in the bulb colour
//   shade    a lampshade over the bulb, `on` or not: the library's cone
//            (Primitives/Cone: a cylinder pinched to a point by CONE_FORM)
//            `radius` across its foot, hung point up from the cord's end,
//            lit up in the `shade` colour (`brightness`, as a lit
//            Primitive's), the bulb peeking out under it
//   glow     the light it throws round it: `intensity`, out to `distance`
//   hang     how high its hook is, off the ground (the stage's and the
//            catalog's: an object that hangs is placed by whoever hangs it)
//   colors   the `cord` and the `bulb`
export const PENDANT_LIGHT = {
  cord: { length: 0.3, radius: 0.008 },
  bulb: { radius: 0.07 },
  shade: { on: false, radius: 0.14, brightness: 0.85 },
  glow: { intensity: 14, distance: 8 },
  hang: 2.7,
  colors: { cord: solid("#2F2A36"), bulb: solid("#FFF1C9"), shade: solid("#F2C94C") },
};

export const PENDANT_LIGHT_KNOBS = {
  cordLength: { path: "cord.length", range: [0.05, 2, 0.05], name: "cord length" },
  bulbRadius: { path: "bulb.radius", range: [0.03, 0.3, 0.005], name: "bulb size" },
  intensity: { path: "glow.intensity", range: [0, 40, 1], name: "glow" },
  distance: { path: "glow.distance", range: [1, 20, 0.5], name: "glow reach" },
  hang: { path: "hang", range: [0.5, 5, 0.05] },
  bulb: { path: "colors.bulb.hex", color: true, name: "bulb color" },
  cord: { path: "colors.cord.hex", color: true, name: "cord color" },
  shade: { path: "shade.on", bool: true, name: "cone shade" },
  shadeRadius: { path: "shade.radius", range: [0.05, 0.5, 0.01], name: "shade size" },
  shadeColor: { path: "colors.shade.hex", color: true, name: "shade color" },
};
