import { solid } from "../../world/palette.js";
import { DEER } from "../deer/objects.js";

// The zebra's own colours: a white coat with black stripes, a black
// muzzle, mane, hooves and tail tuft, and dark eyes and nostrils. The
// story's knobs write over these.
const paint = {
  coat: solid("#F4F1EA"),
  stripe: solid("#2B2A2E"),
  dark: solid("#2B2A2E"),
  eyes: solid("#2A2230"),
  nostril: solid("#4A4650"),
};

// A toy zebra: the DEER (see deer/objects.js, on goat/Goat.jsx) with its
// antlers and spots off and the cow's broad muzzle (see cow/Cow.jsx) on
// in place of its own, painted black, a longer head nosing down, its
// ears standing up a little pointed, a stiff black mane along the neck's
// back, a white tail hanging down with a black tuft on its end, and
// BLACK STRIPES painted on: bands across the body wrapping down the
// flanks and across the rump, rings round the neck, the head and each
// leg. It stands on the ground facing +z.
//
//   size     the whole zebra scaled; 1 is a toy beside the furniture
//   wag      how much the tail swishes, 0 still to 1 a full swish
//   stripes  whether the stripes are painted on
//   mane     whether it has its mane
//   the rest as the goat's (body, legs, head, ears, resolution, colors)
export const ZEBRA = {
  ...DEER,
  antlers: false,
  spots: false,
  snout: true,
  snoutShape: "cow",
  cowSnout: { width: 1, height: 1, down: 0, round: DEER.head.round }, // the head's own, so it runs straight on out of the head, no taper
  mane: true,
  stripes: true,
  tail: { hang: true, r: 0.016, tuft: 0.04 },
  ears: { length: 0.13, droop: -1.25, point: 0.6 },
  legs: { ...DEER.legs, height: 0.64 }, // longer than the deer's
  head: { ...DEER.head, length: 0.32, tilt: 0.35, neckBlend: 0 }, // longer than the deer's, nosing further down, the back of the neck running straight into the back
  colors: {
    ...DEER.colors,
    coat: paint.coat,
    tail: paint.coat,
    tuft: paint.dark,
    mane: paint.dark,
    stripe: paint.stripe,
    snout: paint.dark,
    nose: paint.nostril,
    eyes: paint.eyes,
    hoof: paint.dark,
  },
};

// What can be changed on a zebra or a horse, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const ZEBRA_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "wag", path: "wag", step: 0.1, min: 0, max: 1 },
  { label: "stripes", path: "stripes", bool: true, on: true, off: false },
  { label: "mane", path: "mane", bool: true, on: true, off: false },
  { label: "coat", path: "colors.coat.hex", color: true },
  { label: "stripe colour", path: "colors.stripe.hex", color: true },
  { label: "mane colour", path: "colors.mane.hex", color: true },
  { label: "muzzle colour", path: "colors.snout.hex", color: true },
];

// The horse: the same zebra with its stripes left off and the giraffe's
// long snout (see giraffe/objects.js) in place of the cow's — a chestnut coat,
// a dark brown mane and tail, a fuller tail than the zebra's, a darker
// brown muzzle and near-black hooves. Its story starts from this
// (stories/Horse.stories.jsx); the knobs are the zebra's.
export const HORSE = {
  ...ZEBRA,
  stripes: false,
  snoutShape: "long",
  tail: { hang: true, r: 0.022, tuft: 0.06 },
  colors: {
    ...ZEBRA.colors,
    coat: solid("#A9673C"),
    tail: solid("#4A2E1E"),
    tuft: solid("#4A2E1E"),
    mane: solid("#4A2E1E"),
    stripe: solid("#4A2E1E"),
    snout: solid("#7A4A30"),
    nose: solid("#2E1D14"),
    hoof: solid("#2E2622"),
  },
};
