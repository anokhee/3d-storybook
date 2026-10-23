import { solid } from "../../world/palette.js";
import { BUFFALO } from "../buffalo/objects.js";

// The elephant's own colours: a grey coat, pink inside the ears, white
// tusks, a dark tuft on the tail and dark eyes. The story's knobs write
// over these.
const paint = {
  coat: solid("#9FA3AE"),
  ear: solid("#E8A9B4"),
  tusk: solid("#F5F0E6"),
  tuft: solid("#4A4452"),
  eyes: solid("#2A2230"),
};

// A toy elephant: the BUFFALO (see buffalo/objects.js and
// buffalo/Buffalo.jsx) in an elephant's grey, with no hump and no horns
// off the head, a TRUNK poured into the body's lump, hanging from the
// face and curling forward at the tip, two white tusks (the buffalo's
// horn model) either side of its root, and big flat ears out of the
// sides of the head, pink inside. Thicker legs, a shorter thinner tail.
// It stands on the ground facing +z, about 1.0 tall and 1.6 long.
//
//   size    the whole elephant scaled; 1 is a small one beside the furniture
//   wag     how much the tail swings, 0 still to 1 a full swing
//   ears    `big` how big the ears are, 1 as made
//   the rest as the buffalo's (body, head, legs, resolution, colors)
export const ELEPHANT = {
  ...BUFFALO,
  wag: 0.6,
  muzzle: false,
  trunk: true,
  tusks: true,
  ears: { big: 1 },
  body: { ...BUFFALO.body, hump: 0 },
  head: { ...BUFFALO.head, drop: 0.08 },
  tail: { length: 0.7, thickness: 0.6 },
  legs: { thickness: 0.24, round: 0.06, blend: 0.03 },
  horns: { ...BUFFALO.horns, show: false },
  colors: {
    ...BUFFALO.colors,
    coat: paint.coat,
    ear: paint.ear,
    horn: paint.tusk,
    tuft: paint.tuft,
    eyes: paint.eyes,
  },
};

// What can be changed on an elephant, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const ELEPHANT_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "wag", path: "wag", step: 0.1, min: 0, max: 1 },
  { label: "ear size", path: "ears.big", step: 0.1, min: 0.5, max: 1.6 },
  { label: "coat", path: "colors.coat.hex", color: true },
  { label: "tusks", path: "colors.horn.hex", color: true },
];
