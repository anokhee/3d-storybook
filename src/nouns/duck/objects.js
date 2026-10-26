import { solid } from "../../world/palette.js";

// The duck's own colours, candy tones that sit with the library: a
// mallard's bottle-green head over a warm brown body, a cream neck ring,
// a yellow bill, orange feet and white eyes with dark plum pupils.
const paint = {
  body: solid("#A4785A"),
  head: solid("#3E8C5A"),
  ring: solid("#F2E9DC"),
  bill: solid("#F4D46A"),
  foot: solid("#F08A3C"),
  eye: solid("#2B2230"),
};

// The three ducks `kind` can be. The kind shapes the duck (a rubber duck
// has no legs and sits flat; only a mallard wears the neck ring); the
// colours are the duck's own, so a story paints each kind (a white duck
// is cream with an orange bill, a rubber one all yellow).
export const DUCK_KINDS = ["mallard", "white", "rubber"];

// A duck: a toy of one, standing on the ground facing +z, about one unit
// tall at the top of its head. Everything is scaled by `size`.
//
//   kind    one of DUCK_KINDS, see above
//   size    the whole duck, 1 is a unit tall
//   bob     how much it moves: the head bobs and the tail waggles,
//           0 holds still for the picture
//   body    the squashed sphere it is mostly made of: `radius` before it
//           is stretched `length` along z and pressed to `height` tall;
//           `tail` the little cone at its back, pointing up and back
//   head    a ball of `radius` on a `neck` (a short cylinder of that
//           radius) set `forward` of the body's middle, `lift` above it
//   bill    the flat rounded bill: `width` across, `depth` out from the
//           face, `thickness` through it
//   eye     white eyeballs of `radius`, set `apart` across the head
//   wing    a half-sphere of `radius` flattened to `thin` of it against
//           either side of the body
//   leg     short cylinders of `radius` and `height` under the body, set
//           `apart`; `foot` the webbed foot, a flattened triangle of
//           `reach` from its middle to the toe, `thick` thick
//   colors  `body`, `head`, `ring` (the mallard's neck band), `bill`,
//           `foot`, `eye` (the pupils)
export const DUCK = {
  kind: "mallard",
  size: 1,
  bob: 1,
  body: { radius: 0.3, length: 1.3, height: 0.85, tail: { radius: 0.1, height: 0.26 } },
  head: { radius: 0.2, neck: 0.11, forward: 0.3, lift: 0.42 },
  bill: { width: 0.17, depth: 0.22, thickness: 0.06 },
  eye: { radius: 0.042, apart: 0.26 },
  wing: { radius: 0.24, thin: 0.4 },
  leg: { radius: 0.035, height: 0.18, apart: 0.24, foot: { reach: 0.14, thick: 0.03 } },
  colors: {
    body: paint.body,
    head: paint.head,
    ring: paint.ring,
    bill: paint.bill,
    foot: paint.foot,
    eye: paint.eye,
  },
};

// What can be changed on a duck, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const DUCK_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "kind", path: "kind", options: DUCK_KINDS },
  { label: "bob", path: "bob", step: 0.1, min: 0, max: 1 },
  { label: "body", path: "colors.body.hex", color: true },
  { label: "head", path: "colors.head.hex", color: true },
  { label: "bill", path: "colors.bill.hex", color: true },
];
