import { solid } from "../../world/palette.js";

// The goat's own colours: a chalky white coat with a darker grey-brown
// patch over the back, pale horns, amber eyes with a dark bar of a
// pupil, a dark nose and dark hooves. The story's knobs write over these.
const paint = {
  coat: solid("#EFEBE3"),
  patch: solid("#8C7F72"),
  horn: solid("#D9CBAA"),
  antler: solid("#D9BF96"),
  spot: solid("#F7F1E6"),
  eyes: solid("#E9B24C"),
  pupil: solid("#2A2230"),
  nose: solid("#5A4B48"),
  hoof: solid("#4A3F3A"),
};

// A toy goat on the cat's frame (see cat/objects.js), standing only: one
// lump of clay (see world/lump.js) — a rounded block for the body on
// four slim legs pulled straight down out of its corners, a neck block
// leant forward out of the top of its front and a narrower head block
// across the top of that, run together so there is no seam, with a
// small muzzle block out of the head's front and a short tail out of
// the top of the rump pointing up — with two pale horns sweeping back
// off the top of the head (or a deer's branching antlers, a second small
// lump), two ears out to the sides drooping a little (or standing up),
// a little beard hanging under the chin, bead eyes on the sides of the
// head each with a bar across it for a pupil, a bead nose, and a darker
// patch painted over the back and dark hooves painted round the feet.
// It stands on the ground facing +z, about 0.95 tall and 1.1 long,
// slimmer than a sheep. The deer is this goat with its antlers on and
// its horns, beard, patch and pupil bars off (deer/objects.js).
//
//   size    the whole goat scaled; 1 is a small goat beside the furniture
//   wag     how much the tail wags, 0 still to 1 a full wag
//   horns   whether it has its horns
//   antlers whether it has antlers (a deer's)
//   ossicones whether it has two short pegs with balls on their ends (a
//           giraffe's)
//   beard   whether it has its beard
//   patch   whether the patch is painted over its back
//   spots   whether fawn spots are painted over its back and flanks (a
//           deer's)
//   snout   whether it wears a long snout after the cow's (see
//           cow/Cow.jsx), tapering and turned nose-down, painted, with
//           two nostrils on its end, in place of its muzzle and nose (a
//           giraffe's)
//   snoutShape  "long" for the giraffe's tapering snout, or "cow" for
//           the cow's own broad shallow muzzle block (a horse's or a
//           zebra's), sized to the head
//   cowSnout  the cow's snout's `width` and `height` as shares of the
//           head's, `down` how far its middle sits below the head's, a
//           share of the head's height, and `round` of its edges — the
//           cow's own by default; the head's own width, height, middle
//           and rounding run it straight on out of the head, no taper
//   mane    whether a row of capsules stands along the neck's back (a
//           horse's or a zebra's)
//   stripes whether stripes are painted round the body, neck, head and
//           legs (a zebra's)
//   spotShape  "blotch" for the deer's irregular spots, or "patches"
//           for a giraffe's: irregular polygons fitted close with a thin
//           pale web between, over the body, up the neck and down the
//           legs to the knees (goat/markings.js)
//   tail    `hang` whether the tail hangs down off the rump, thin, with
//           a brush of a tuft on its end (a giraffe's), instead of the
//           short tail pointing up; `r` how thick it hangs and `tuft`
//           how big its tuft, if not the giraffe's
//   pupils  whether each eye's pupil is a goat's wide bar, in `pupil`;
//           off, a round one in `eyes` (the eyeballs are white either
//           way, world/eye.jsx)
//   ears    `length` of each, `droop` how far below straight-out each
//           hangs, in radians: 0 is level, negative stands them up;
//           `point` how far the tips are drawn out to a point, 0 round
//           to 1 pointed
//   body    the block: `width` across, `height`, `length` chest to rump,
//           `round` how far its edges are rounded off
//   legs    `thickness` of each, `round` of its edges, `blend` how wide
//           a fillet it makes with the belly, `height` how high they
//           reach up inside the body (the belly is 0.14 below that)
//   head    the head block: `width` across, `height`, `length` brow to
//           the front, `round` of its edges, `tilt` how far it noses
//           down, in radians; `neck` how far the neck leans forward of
//           upright, in radians, and `rise` how high the head's middle
//           sits above the body's top; `neckBlend` how wide a fillet
//           the neck makes with the body, 0 a straight line down the
//           back of the neck into the back
//   resolution  the lump's grid, cells a side: more is smoother, slower
//   colors  `coat`; `tail` the tail, the coat's colour on a goat;
//           `patch` the patch over the back; `horn`; `antler`;
//           `ossicone` the pegs and `knob` the balls on them; `spot` the fawn spots; `eyes` the round pupils and `pupil` the goat's bar (the eyeballs are white)
//           each; `nose` the nose or the nostrils; `snout` the snout's paint;
//           `tuft` the hanging tail's tuft; `mane`; `stripe` the stripes;
//           `hoof`
export const GOAT = {
  size: 1,
  wag: 0.5,
  horns: true,
  antlers: false,
  ossicones: false,
  beard: true,
  patch: true,
  spots: false,
  snout: false,
  snoutShape: "long",
  cowSnout: { width: 0.86, height: 0.55, down: 0.2, round: 0.045 },
  mane: false,
  stripes: false,
  spotShape: "blotch",
  tail: { hang: false },
  pupils: true,
  ears: { length: 0.11, droop: 0.55 },
  body: { width: 0.4, height: 0.42, length: 0.74, round: 0.1 },
  legs: { thickness: 0.11, round: 0.03, blend: 0.02, height: 0.5 },
  head: { width: 0.2, height: 0.22, length: 0.3, round: 0.06, tilt: 0.12, neck: 0.65, rise: 0.09, neckBlend: 0.05 },
  resolution: 64,
  colors: {
    coat: paint.coat,
    tail: paint.coat,
    patch: paint.patch,
    horn: paint.horn,
    antler: paint.antler,
    ossicone: paint.coat,
    knob: paint.hoof,
    spot: paint.spot,
    eyes: paint.eyes,
    pupil: paint.pupil,
    nose: paint.nose,
    snout: paint.hoof,
    tuft: paint.hoof,
    mane: paint.hoof,
    stripe: paint.hoof,
    hoof: paint.hoof,
  },
};

// What can be changed on a goat, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const GOAT_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "wag", path: "wag", step: 0.1, min: 0, max: 1 },
  { label: "horns", path: "horns", bool: true, on: true, off: false },
  { label: "antlers", path: "antlers", bool: true, on: true, off: false },
  { label: "beard", path: "beard", bool: true, on: true, off: false },
  { label: "patch", path: "patch", bool: true, on: true, off: false },
  { label: "coat", path: "colors.coat.hex", color: true },
  { label: "patch colour", path: "colors.patch.hex", color: true },
];
