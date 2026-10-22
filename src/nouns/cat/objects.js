import { solid } from "../../world/palette.js";

// What every cat shares: pink in the ears and on the nose, a dark bead
// behind each eye.
const paint = {
  pupil: solid("#2A2230"),
  nose: solid("#E08A8A"),
  ear: solid("#EFB7B2"),
};

// The coats a cat comes in, each its own colours and markings: `fur` the
// coat, `belly` the lighter front, muzzle and whiskers, `eyes` the iris,
// `markings` the colour of any stripes; `stripes` bands the back and
// the tail (a tabby), `paws` gives every foot a white sock (a tuxedo).
// The default is the orange tabby; the story's coat knob picks another,
// and a config may still name its own colours over the coat's.
export const CAT_COATS = {
  "orange tabby": {
    colors: { fur: solid("#E0975A"), belly: solid("#F2E9DC"), eyes: solid("#7BAA5E"), markings: solid("#B86A3A") },
    stripes: true,
    paws: false,
  },
  black: {
    colors: { fur: solid("#2E2535"), belly: solid("#3B3142"), eyes: solid("#F4D46A"), markings: solid("#2E2535") },
    stripes: false,
    paws: false,
  },
  tuxedo: {
    colors: { fur: solid("#2E2535"), belly: solid("#FFFFFF"), eyes: solid("#7BAA5E"), markings: solid("#2E2535") },
    stripes: false,
    paws: true,
  },
  grey: {
    colors: { fur: solid("#8E8A96"), belly: solid("#D9D5DC"), eyes: solid("#E8B04A"), markings: solid("#6B6672") },
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

// A toy cat: one lump of clay (see lump.js) — the head and body a single
// continuous form, the legs pulled down out of it to feet on the ground
// — with a lighter patch pressed on the chest, two pointed ears (a pink
// triangle in each), a short muzzle bump with a bead nose, two bead eyes,
// three whiskers a side, and a long tail that curls up at the tip. It
// stands on the ground facing +z, about 1.2 tall at the head.
//
//   size    the whole cat scaled; 1 is a house cat beside the furniture
//   coat    one of CAT_COATS, see above: its colours and markings, under
//           whatever this config says itself
//   pose    one of CAT_POSES, see above
//   swish   how much the tail swings, 0 still to 1 a full swish
//   body    `radius` of the balls the body is poured round
//   head    `radius` of the head's ball
//   legs    `radius` of the feet, and so of the legs pulled down to them
//   tail    `radius` of the tube
//   resolution  the lump's grid, cells a side: more is smoother, slower
//   stripes bands of `markings` across the back and round the tail
//   paws    a white sock on every foot
//   colors  `fur` the coat; `belly` the lighter patch under the body and
//           the muzzle; `eyes` the iris, `pupil` the dark bead behind it;
//           `markings` the stripes; `nose` and the inner `ear`
export const CAT = {
  size: 1,
  coat: "orange tabby",
  pose: "standing",
  swish: 0.6,
  body: { radius: 0.32 },
  head: { radius: 0.3 },
  legs: { radius: 0.1 },
  tail: { radius: 0.055 },
  resolution: 52,
  stripes: CAT_COATS["orange tabby"].stripes,
  paws: CAT_COATS["orange tabby"].paws,
  colors: {
    ...CAT_COATS["orange tabby"].colors,
    pupil: paint.pupil,
    nose: paint.nose,
    ear: paint.ear,
  },
};

// What can be changed on a cat, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const CAT_KNOBS = [
  { label: "coat", path: "coat", options: CAT_COAT_NAMES },
  { label: "pose", path: "pose", options: CAT_POSES },
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "swish", path: "swish", step: 0.1, min: 0, max: 1 },
];
