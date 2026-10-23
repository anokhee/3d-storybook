import { solid } from "../../world/palette.js";
import { GOAT } from "../goat/objects.js";

// The deer's own colours: a russet coat with white fawn spots, a white tail, pale
// brown antlers, dark eyes, a dark nose and dark hooves. The story's knobs write over these.
const paint = {
  coat: solid("#C98A52"),
  spot: solid("#F7F1E6"),
  antler: solid("#D9BF96"),
  eyes: solid("#2A2230"),
  dark: solid("#3B2A24"),
};

// A toy deer: the GOAT (see goat/objects.js and goat/Goat.jsx) with its
// antlers on instead of horns — a second small lump each side, a beam
// branching into tines, in pale brown — its ears standing up, plain round
// bead eyes without the goat's pupil bars, no beard, no patch over the
// back but a scatter of irregular white fawn spots, a white tail, a longer neck held nearer
// level, and a russet coat with a dark nose and hooves. It stands on the
// ground facing +z, about 1.3 tall to the antlers' tips and 1.1 long.
//
//   size     the whole deer scaled; 1 is a toy beside the furniture
//   wag      how much the tail flicks, 0 still to 1 a full flick
//   antlers  whether it has its antlers
//   spots    whether the fawn spots are painted on
//   the rest as the goat's (body, legs, head, ears, resolution, colors)
export const DEER = {
  ...GOAT,
  wag: 0.4,
  horns: false,
  antlers: true,
  beard: false,
  patch: false,
  spots: true,
  pupils: false,
  ears: { length: 0.14, droop: -1.2 }, // standing up, leaning a little out and back
  head: { ...GOAT.head, tilt: 0.05, rise: 0.2, neck: 0.55 }, // held nearer level than the goat's, on a longer, more upright neck
  colors: {
    ...GOAT.colors,
    coat: paint.coat,
    tail: paint.spot,
    spot: paint.spot,
    antler: paint.antler,
    eyes: paint.eyes,
    pupil: paint.eyes,
    nose: paint.dark,
    hoof: paint.dark,
  },
};

// What can be changed on a deer, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const DEER_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "wag", path: "wag", step: 0.1, min: 0, max: 1 },
  { label: "antlers", path: "antlers", bool: true, on: true, off: false },
  { label: "spots", path: "spots", bool: true, on: true, off: false },
  { label: "coat", path: "colors.coat.hex", color: true },
  { label: "tail colour", path: "colors.tail.hex", color: true },
  { label: "antler colour", path: "colors.antler.hex", color: true },
];
