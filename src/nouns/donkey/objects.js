import { solid } from "../../world/palette.js";

// The donkey's own colours: a grey coat with a paler belly and muzzle,
// a dark mane and tail tuft, dark hooves and a dark stripe down the
// back, and dark eyes. The story's knobs write over these.
const paint = {
  coat: solid("#9A9399"),
  pale: solid("#E6DFDA"),
  mane: solid("#3F363D"),
  dark: solid("#4A4148"),
  eyes: solid("#2A2230"),
};

// A toy donkey on the cat's frame (see cat/objects.js): one lump of clay
// (see world/lump.js) — a rounded block of a body up on four slim blocks
// of legs pulled straight down out of its corners to the ground, a
// block of a neck rising out of the front of its top and leaning well
// forward, run into the body so there is no seam, a long block of a
// head on the neck's top pointing forward and a little down, and a thin
// tail hanging out of the rump — with two long ears standing up off the
// back of the head, a short dark mane along the top of the neck, a dark
// tuft on the tail's tip, a pale muzzle painted round the head's end and
// a pale belly painted underneath, dark hooves painted round the feet,
// and a dark stripe painted down the back with another across the
// shoulders. It stands on the ground facing +z, about 1.3 tall to the
// ear tips and 1.3 long.
//
//   size    the whole donkey scaled; 1 is a toy beside the furniture
//   wag     how much the tail swishes, 0 still to 1 a full swish
//   stripe  whether the stripes are painted on (the muzzle, belly and
//           hooves always are)
//   body    the block: `width` across, `height`, `length` chest to rump,
//           `round` how far its edges are rounded off
//   legs    `thickness` of each, `round` of its edges, `blend` how wide
//           a fillet it makes with the belly
//   neck    `length` from where it leaves the body to the head, `lean`
//           how far forward of straight up it leans, in degrees,
//           `width` across and `depth` front to back, `round` of its
//           edges
//   head    `width` across, `height`, `length` back to muzzle, `round`
//           of its edges, `dip` how far below level it points, in
//           degrees
//   ears    `length` of each ear's straight run (a capsule, so it is
//           that plus its two rounded ends), `splay` how far out from
//           straight up each leans, in degrees
//   resolution  the lump's grid, cells a side: more is smoother, slower
//   colors  `coat`; `pale` the muzzle and belly; `mane` the mane and
//           tail tuft; `dark` the hooves and stripes; `eyes`
export const DONKEY = {
  size: 1,
  wag: 0.5,
  stripe: true,
  body: { width: 0.48, height: 0.46, length: 0.9, round: 0.12 },
  legs: { thickness: 0.12, round: 0.04, blend: 0.02 },
  neck: { length: 0.34, lean: 40, width: 0.22, depth: 0.28, round: 0.07 },
  head: { width: 0.24, height: 0.26, length: 0.42, round: 0.08, dip: 20 },
  ears: { length: 0.22, splay: 18 },
  resolution: 64,
  colors: {
    coat: paint.coat,
    pale: paint.pale,
    mane: paint.mane,
    dark: paint.dark,
    eyes: paint.eyes,
  },
};

// What can be changed on a donkey, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const DONKEY_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "wag", path: "wag", step: 0.1, min: 0, max: 1 },
  { label: "ear length", path: "ears.length", step: 0.02, min: 0.06, max: 0.4 },
  { label: "coat", path: "colors.coat.hex", color: true },
  { label: "mane", path: "colors.mane.hex", color: true },
];
