import { solid } from "../../world/palette.js";
import { BUFFALO } from "../buffalo/objects.js";

// The rhino's own colours: a grey coat (a lighter grey for the muzzle,
// should it be painted on), bone horns, a darker grey tuft on the tail,
// and dark eyes and nostrils. The story's knobs write over these.
const paint = {
  coat: solid("#8E8C96"),
  muzzle: solid("#B4B2BC"),
  horn: solid("#E8DCC5"),
  tuft: solid("#5E5C66"),
  eyes: solid("#2A2230"),
};

// A toy rhino: the BUFFALO (see buffalo/objects.js and
// buffalo/Buffalo.jsx) in a rhino's grey, its horns off the sides of the
// head taken away and a big bone horn stood on its nose instead, a
// smaller one behind it, the big one curving up and back like the
// buffalo's horns; the giraffe's tapering snout turned nose-down in place
// of its muzzle, in the coat's grey, the eyes on the
// sides of the head; a shorter, thinner tail; and its ears standing upright on top of the head,
// facing forward. It stands on the ground facing +z, about 1.2
// tall to the top of the hump and 1.6 long nose to rump.
//
//   size      the whole rhino scaled; 1 is a heavy beast beside the furniture
//   wag       how much the tail swings, 0 still to 1 a full swing
//   noseHorn  how long the big horn is; the small one is a share of it
//   the rest as the buffalo's (muzzle, body, head, legs, resolution, colors)
export const RHINO = {
  ...BUFFALO,
  snout: true,
  muzzle: false, // the snout left the coat's grey
  ears: { up: true },
  noseHorn: 0.3,
  tail: { length: 0.6, thickness: 0.65 }, // a short thin tail
  horns: { ...BUFFALO.horns, show: false },
  colors: {
    ...BUFFALO.colors,
    coat: paint.coat,
    muzzle: paint.muzzle,
    horn: paint.horn,
    tuft: paint.tuft,
    nose: paint.eyes,
    eyes: paint.eyes,
  },
};

// What can be changed on a rhino, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const RHINO_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "wag", path: "wag", step: 0.1, min: 0, max: 1 },
  { label: "horn length", path: "noseHorn", step: 0.02, min: 0.06, max: 0.6 },
  { label: "coat", path: "colors.coat.hex", color: true },
  { label: "horn colour", path: "colors.horn.hex", color: true },
];
