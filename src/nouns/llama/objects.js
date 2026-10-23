import { solid } from "../../world/palette.js";

// The llama's own colours: a cream coat with brown patches, a dark
// muzzle tip and dark eyes. The story's knobs write over these.
const paint = {
  coat: solid("#F1E3C8"),
  patch: solid("#9C6B45"),
  dark: solid("#4A3326"),
  eyes: solid("#2A2230"),
};

// A toy llama on the cat's frame (see cat/objects.js): one lump of clay
// (see world/lump.js) — a rounded block of a body up on four slim blocks
// of legs pulled straight down out of its corners to the ground, a tall
// block of a neck standing nearly upright out of the front of its top,
// run into the body so there is no seam, a small rounded block of a
// head on top of the neck facing forward with a shorter block of a
// muzzle out of its front, and a fluffy tail of a sphere or two out of
// the top of the rump — with two banana ears standing up off the head,
// bead eyes, the muzzle's tip painted dark, and, if it has them, brown
// patches painted over the body and neck. It stands on the ground facing
// +z, about 1.5 tall.
//
// As an ALPACA it is the same lump made fluffier: the neck ALPACA.neck as
// tall, the body a rounder block with spheres pressed into it on wide
// fillets so it reads as fleece, a topknot of two spheres on the head,
// and the whole thing ALPACA.scale the size.
//
//   size     the whole llama scaled; 1 is a toy beside the furniture
//   alpaca   whether it is an alpaca instead, see above
//   patches  whether the patches are painted on (the muzzle tip always is)
//   body     the block: `width` across, `height`, `length` chest to rump,
//            `round` how far its edges are rounded off
//   legs     `thickness` of each, `round` of its edges, `blend` how wide
//            a fillet it makes with the belly
//   neck     `length` from where it leaves the body to the head, `lean`
//            how far forward of straight up it leans, in degrees,
//            `width` across and `depth` front to back, `round` of its
//            edges
//   head     `width` across, `height`, `length` back to the face, `round`
//            of its edges
//   resolution  the lump's grid, cells a side: more is smoother, slower
//   colors   `coat`; `patch` the patches; `dark` the muzzle tip; `eyes`
export const LLAMA = {
  size: 1,
  alpaca: false,
  patches: true,
  body: { width: 0.44, height: 0.44, length: 0.9, round: 0.14 },
  legs: { thickness: 0.12, round: 0.04, blend: 0.02 },
  neck: { length: 0.4, lean: 5, width: 0.2, depth: 0.26, round: 0.07 },
  head: { width: 0.22, height: 0.2, length: 0.3, round: 0.07 },
  resolution: 72,
  colors: {
    coat: paint.coat,
    patch: paint.patch,
    dark: paint.dark,
    eyes: paint.eyes,
  },
};

// What the alpaca variant changes: `neck` what is left of the neck's
// length, `scale` of the whole, and the body it has instead (the
// llama's `body` fields it overrides).
export const ALPACA = {
  neck: 0.6,
  scale: 0.85,
  body: { width: 0.5, height: 0.52, length: 0.8, round: 0.18 },
};

// What can be changed on a llama, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const LLAMA_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "alpaca", path: "alpaca", bool: true, on: true, off: false },
  { label: "patches", path: "patches", bool: true, on: true, off: false },
  { label: "coat", path: "colors.coat.hex", color: true },
  { label: "patch", path: "colors.patch.hex", color: true },
  { label: "neck height", path: "neck.length", step: 0.05, min: 0.1, max: 0.8 },
];
