import { solid } from "../../world/palette.js";

// What every cat shares: pink in the ears and on the nose, a dark bead
// behind each eye, a red collar if it wears one.
const EYE_DARK = "#2A2230", EYE_YELLOW = "#F4D46A";
const paint = {
  pupil: solid(EYE_DARK),
  nose: solid("#E08A8A"),
  ear: solid("#EFB7B2"),
  collar: solid("#E5534B"),
};

// The coats a cat comes in, each its own colours and markings: `fur` the
// coat, `belly` the lighter front, muzzle and whiskers, `eyes` the iris
// (the dark of the bead on the tabby and the grey: plain black eyes;
// yellow on the black cat and the tuxedo),
// `markings` the colour of any stripes; `stripes` bands the back and
// the tail (a tabby), `paws` paints a white sock on every foot (a tuxedo).
// The default is the orange tabby; the story's coat knob picks another,
// and a config may still name its own colours over the coat's.
export const CAT_COATS = {
  "orange tabby": {
    colors: { fur: solid("#E0975A"), belly: solid("#F2E9DC"), eyes: solid(EYE_DARK), markings: solid("#B86A3A") },
    stripes: true,
    paws: false,
  },
  black: {
    colors: { fur: solid("#2E2535"), belly: solid("#3B3142"), eyes: solid(EYE_YELLOW), markings: solid("#2E2535") },
    stripes: false,
    paws: false,
  },
  tuxedo: {
    colors: { fur: solid("#2E2535"), belly: solid("#FFFFFF"), eyes: solid(EYE_YELLOW), markings: solid("#2E2535") },
    stripes: false,
    paws: true,
  },
  grey: {
    colors: { fur: solid("#8E8A96"), belly: solid("#D9D5DC"), eyes: solid(EYE_DARK), markings: solid("#6B6672") },
    stripes: false,
    paws: false,
  },
};
export const CAT_COAT_NAMES = Object.keys(CAT_COATS);

// The coat's colours and markings, under a config's own: the fields a
// config leaves out fall through to the coat it names (or CAT's).
export function coatOf(coat) {
  return CAT_COATS[coat] ?? CAT_COATS[CAT.coat];
}

// The poses a cat holds: standing on all fours, sitting up on its
// haunches with the tail wrapped round its feet, or loafed with every
// leg tucked under and the tail laid along its side.
export const CAT_POSES = ["standing", "sitting", "loaf"];

// A toy cat: one lump of clay (see lump.js) — ONE rounded block for the
// head and body together, the face drawn on its front, the legs slimmer
// blocks pulled straight down out of it to the ground, and the tail out
// of its rear the same way, curling up at the tip — with a lighter patch
// painted on the chest, two pointed ears on the front corners of the top
// (a pink triangle painted on each), a small muzzle bump with a triangle
// nose and a line of a mouth drawn down from it, two bead eyes and three
// whiskers a side, and a collar painted across the front under the
// muzzle if it wears one. It stands on the ground facing +z, about 1
// tall.
//
//   size    the whole cat scaled; 1 is a house cat beside the furniture
//   coat    one of CAT_COATS, see above: its colours and markings, under
//           whatever this config says itself
//   pose    one of CAT_POSES, see above
//   swish   how much the tail swings, 0 still to 1 a full swish
//   collar  whether it wears its collar
//   body    the block: `width` across, `height` (standing), `length` nose
//           to rump, `round` how far its edges are rounded off
//   legs    `thickness` of each, `round` of its edges, `blend` how wide
//           a fillet it makes with the belly
//   sitting the sitting pose's chest and legs: `chestDepth` how far the
//           chest block stands out from the body (how deep the notch
//           under it the front legs sit in), `legForward` how far the
//           front legs' faces stand proud of the chest's (0 flush, a
//           little back of it below), `legSpacing` between the two front
//           legs, middle to middle, `footYaw` how far each hind foot
//           turns out, in degrees, `footBack` how far back from the
//           front of the base each hind foot's front sits
//   resolution  the lump's grid, cells a side: more is smoother, slower
//   stripes bands of `markings` painted across the back and round the tail
//   paws    a white sock painted on every foot
//   colors  `fur` the coat; `belly` the lighter patch under the body and
//           the muzzle; `eyes` the iris, `pupil` the dark bead behind it;
//           `markings` the stripes; `nose` and the inner `ear`; the
//           `collar`
export const CAT = {
  size: 1,
  coat: "orange tabby",
  pose: "standing",
  swish: 0.6,
  collar: true,
  body: { width: 0.5, height: 0.58, length: 0.96, round: 0.12 },
  legs: { thickness: 0.14, round: 0.04, blend: 0.02 },
  sitting: { chestDepth: 0.14, legForward: 0.01, legSpacing: 0.3, footYaw: 35, footBack: 0.26 },
  resolution: 56,
  stripes: CAT_COATS["orange tabby"].stripes,
  paws: CAT_COATS["orange tabby"].paws,
  colors: {
    ...CAT_COATS["orange tabby"].colors,
    pupil: paint.pupil,
    nose: paint.nose,
    ear: paint.ear,
    collar: paint.collar,
  },
};

// What can be changed on a cat, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const CAT_KNOBS = [
  { label: "coat", path: "coat", options: CAT_COAT_NAMES },
  { label: "pose", path: "pose", options: CAT_POSES },
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "swish", path: "swish", step: 0.1, min: 0, max: 1 },
  { label: "collar", path: "collar", bool: true, on: true, off: false },
  { label: "collar colour", path: "colors.collar.hex", color: true },
  { label: "sit: chest depth", path: "sitting.chestDepth", step: 0.01, min: 0.04, max: 0.3 },
  { label: "sit: legs forward", path: "sitting.legForward", step: 0.01, min: -0.05, max: 0.1 },
  { label: "sit: legs apart", path: "sitting.legSpacing", step: 0.02, min: 0.16, max: 0.5 },
  { label: "sit: hind feet turn", path: "sitting.footYaw", step: 5, min: 0, max: 60 },
  { label: "sit: hind feet back", path: "sitting.footBack", step: 0.02, min: -0.1, max: 0.5 },
];
