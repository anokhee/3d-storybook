import { solid } from "../../world/palette.js";
import { DEER } from "../deer/objects.js";

// The giraffe's own colours: a tan coat with brown patches, a brown
// tail with a dark tuft, tan ossicones with dark balls on their ends, dark eyes, a cream snout
// a shade lighter than the coat with dark nostrils, and dark hooves. The
// story's knobs write over these.
const paint = {
  coat: solid("#E9C27A"),
  spot: solid("#A0622D"),
  dark: solid("#4A3326"),
  nostril: solid("#2A2230"),
  cream: solid("#F7EBCB"),
};

// A toy giraffe: the DEER (see deer/objects.js, on goat/Goat.jsx) with
// its colours changed and its head dressed differently — two ossicones,
// short pegs with dark balls on their ends, in place of the antlers, its
// ears held out to the sides rather than standing up, a little pointed,
// a long cream snout tapering and turned nose-down in place of its
// muzzle, and a neck three times as long — brown patches on a tan coat,
// octagons bent by noise and set close, over the body and up the neck, and a thin brown tail hanging down with a dark
// brush of a tuft on its end. It stands on the ground facing +z, about
// 1.65 tall.
//
//   size       the whole giraffe scaled; 1 is a toy beside the furniture
//   wag        how much the tail flicks, 0 still to 1 a full flick
//   ossicones  whether it has its ossicones
//   spots      whether the spots are painted on
//   the rest as the goat's (body, legs, head, ears, resolution, colors)
export const GIRAFFE = {
  ...DEER,
  antlers: false,
  ossicones: true,
  snout: true,
  spotShape: "octagon",
  tail: { hang: true },
  head: { ...DEER.head, rise: 0.6 }, // three times the deer's rise, so the neck out of the body is three times as long, at the same lean
  ears: { length: 0.13, droop: 0.15, point: 0.6 }, // out to the sides, barely drooping
  colors: {
    ...DEER.colors,
    coat: paint.coat,
    tail: paint.spot,
    spot: paint.spot,
    ossicone: paint.coat,
    knob: paint.dark,
    nose: paint.nostril,
    snout: paint.cream,
    tuft: paint.dark,
    hoof: paint.dark,
  },
};

// What can be changed on a giraffe, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const GIRAFFE_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "wag", path: "wag", step: 0.1, min: 0, max: 1 },
  { label: "ossicones", path: "ossicones", bool: true, on: true, off: false },
  { label: "spots", path: "spots", bool: true, on: true, off: false },
  { label: "coat", path: "colors.coat.hex", color: true },
  { label: "spot colour", path: "colors.spot.hex", color: true },
  { label: "tail colour", path: "colors.tail.hex", color: true },
];
