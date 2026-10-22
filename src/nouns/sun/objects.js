import { PALETTE } from "../../world/palette.js";

// The sun you can see: a ball of clay hung out along SUN_DIR (see
// refactored/lighting.js), the moon's daytime sibling. It gives no light
// of its own — the SUN light does that — and takes none from the scene:
// it is toon-shaded by hand, a bright face and a darker rim stepped
// through the world's ramp, the highlight toward whoever is looking, so
// it reads as a clay ball from anywhere. It comes up with the game's
// `daylight` and is gone by night. Colors come from PALETTE.
//
//   distance  world units out from the planet's middle, past the sky's
//             shell (PLANET.shell) so it hangs in the sky
//   radius    its size
//   detail    the sphere's facet count, as a multiple of a primitive's
//   clay      thrown in lumpy clay like the moon (see CLAY), or null
//   tilt      where the highlight sits: the lit bearing is the viewer's
//             pushed this far toward the world's up, so the bright face
//             rides up off the middle the way a drawn ball's does
//   dawn      how far up the daylight has to be before it is fully there
//             — it fades in over 0..dawn
//   color     its lit face, and `shade` its rim
export const SUN_BALL = {
  distance: 150,
  radius: 12,
  detail: 3,
  clay: { amount: 0.3, seed: 3 },
  tilt: 0.6,
  dawn: 0.3,
  color: PALETTE.sun.body,
  shade: PALETTE.sun.shade,
};
