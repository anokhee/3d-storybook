import { PALETTE } from "../../world/palette.js";

// One trampoline: a round mat on a frame, settled into the ground.
//
// Colors come from PALETTE (src/world/palette.js). One config describes a
// whole trampoline, and a station overrides any field of it with a partial.
export const TRAMPOLINE = {
  radius: 3.8, // of the mat
  height: 1.45, // how far the mat sits above the ground before `sink`
  sink: 0.3, // how far the whole thing settles into the ground
  matColor: PALETTE.trampoline.mat,
  // The rim and the legs.
  frameColor: PALETTE.trampoline.frame,
  // What holds the mat up: a skirt (a tapered drum), or legs.
  hasSkirt: false,
  skirt: {
    taper: 0.82, // foot radius as a fraction of the mat's
    color: PALETTE.trampoline.skirt,
  },
  frame: {
    thickness: 0.16, // rim tube radius, and the legs' radius at the foot
    segments: 28, // facets round the mat, rim and skirt
    numLegs: 4,
    legDetail: 6, // sides on each leg
    legTaper: 0.8, // top radius as a fraction of the foot's
    // Legs stand at the intercardinal points by default — `turn` 45 puts
    // the first at NE and the rest step round by 360 / numLegs.
    turn: 45, // degrees round from +x to the first leg
    in: 1, // how far in from the rim they stand, as a share of the radius
  },
};
