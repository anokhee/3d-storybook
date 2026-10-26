import { solid } from "../../world/palette.js";

// The anthropomorphic creatures' colours. `coat` is the whole body (a
// robe, a suit, a shirt or a dress, on a dressed kind), `skin` a dressed
// kind's head and hands, `trousers` and `shoes` its legs and feet if
// they differ; `hat`, `band`, `hair`, `stem`, `chin`, `straw`, `rope`,
// `patch`, `stitch`, `pin`s, `ribbon`, `collar` and `freckle` the
// witch's, the pumpkin's, the fish's, the scarecrow's, the voodoo
// doll's and the doll's own parts; `cup`, `cake`, `frosting`, `cherry`,
// `blush` and the `sprinkle`s the cupcake head's, `dough` and `glaze`
// the donut head's, `roast`, `bone`, `string` and `herb` the rotisserie
// chicken's; `whisker` the cat's whiskers, if
// not the pupils' colour;
// `accent` the beak, bill, bare legs or floppy ears; `detail` the comb,
// wattle, nose or mouth; `eyes` the beads (or the irises, for the frog
// and the cat) and `pupil` the dark spot on those. The story's knobs
// write over these.
const paint = {
  frog: { coat: solid("#8C9A4B"), accent: solid("#8C9A4B"), detail: solid("#3A2E1F"), eyes: solid("#E8B23A"), pupil: solid("#1E1A14") },
  chicken: { coat: solid("#F6F1E7"), accent: solid("#F2A93B"), detail: solid("#D8453A"), eyes: solid("#1E1A14"), pupil: solid("#1E1A14") },
  cat: { coat: solid("#D98A4B"), accent: solid("#D98A4B"), detail: solid("#E58FA0"), eyes: solid("#9BD36A"), pupil: solid("#1E1A14") },
  dog: { coat: solid("#C9A06A"), accent: solid("#7A5230"), detail: solid("#2A2224"), eyes: solid("#1E1A14"), pupil: solid("#1E1A14") },
  duck: { coat: solid("#F4D74A"), accent: solid("#F08A2C"), detail: solid("#F08A2C"), eyes: solid("#1E1A14"), pupil: solid("#1E1A14") },
  blackCat: { coat: solid("#2B2830"), accent: solid("#2B2830"), detail: solid("#E58FA0"), eyes: solid("#D9CF4A"), pupil: solid("#141216"), whisker: solid("#D8D2C8") },
  human: { coat: solid("#E2AC86"), accent: solid("#E2AC86"), detail: solid("#8A4A3C"), eyes: solid("#1E1A14"), pupil: solid("#1E1A14") },
  witch: { coat: solid("#3A2B4A"), accent: solid("#3A2B4A"), skin: solid("#9CC27A"), detail: solid("#3B2A2A"), eyes: solid("#1E1A14"), pupil: solid("#1E1A14"), hat: solid("#26222C"), band: solid("#7B4FA0"), hair: solid("#C8642F") },
  pumpkin: { coat: solid("#3E5B3B"), accent: solid("#3E5B3B"), skin: solid("#E8862E"), detail: solid("#3A1E0E"), eyes: solid("#3A1E0E"), pupil: solid("#3A1E0E"), stem: solid("#6B7A3A") },
  statue: { coat: solid("#8B8676"), accent: solid("#8B8676"), detail: solid("#3A3630"), eyes: solid("#3A3630"), pupil: solid("#3A3630") },
  fish: { coat: solid("#41648F"), accent: solid("#E8603A"), skin: solid("#F09A36"), chin: solid("#F1E3C8"), detail: solid("#E8607A"), eyes: solid("#F5F2EA"), pupil: solid("#1E1A14") },
  voodoo: { coat: solid("#C8A574"), accent: solid("#C8A574"), detail: solid("#3A2A22"), eyes: solid("#2A2230"), pupil: solid("#2A2230"), stitch: solid("#3A2A22"), patch: solid("#C8423A"), pin: solid("#C9CED4"), pinA: solid("#D8453A"), pinB: solid("#E8C33A"), pinC: solid("#4AA3A0") },
  scarecrow: { coat: solid("#B5473A"), accent: solid("#B5473A"), skin: solid("#CDB384"), trousers: solid("#4E6A8E"), shoes: solid("#5A3E2B"), straw: solid("#E2C25E"), detail: solid("#3A2A22"), eyes: solid("#1E1A14"), pupil: solid("#1E1A14"), stitch: solid("#3A2A22"), nose: solid("#E07A2E"), rope: solid("#8A6A3A"), hat: solid("#D9B85C"), band: solid("#8B3A2E"), patch: solid("#5A7FA8") },
  doll: { coat: solid("#3E6FB8"), accent: solid("#3E6FB8"), skin: solid("#F2C7A5"), trousers: solid("#F4F1EA"), shoes: solid("#2A2224"), hair: solid("#D9502E"), ribbon: solid("#3E6FB8"), collar: solid("#F7F4EE"), freckle: solid("#C7744E"), detail: solid("#B8483E"), eyes: solid("#1E2A48"), pupil: solid("#1E2A48") },
  alien: { coat: solid("#8FCB6A"), accent: solid("#E8E36A"), detail: solid("#2E4A26"), eyes: solid("#141414"), pupil: solid("#141414") },
  cupcake: { coat: solid("#79C7B4"), accent: solid("#79C7B4"), cup: solid("#E8647C"), cake: solid("#EFC27B"), frosting: solid("#FBE9EE"), cherry: solid("#C8283A"), stem: solid("#6B8E3D"), blush: solid("#F4A3B5"), sprinkleA: solid("#F9D34C"), sprinkleB: solid("#5AB8E8"), sprinkleC: solid("#F26D8D"), detail: solid("#4A2A22"), eyes: solid("#1E1A14"), pupil: solid("#1E1A14") },
  donut: { coat: solid("#6B4130"), accent: solid("#6B4130"), dough: solid("#E6B46A"), glaze: solid("#F58AB0"), sprinkleA: solid("#FFF6DC"), sprinkleB: solid("#F9D34C"), sprinkleC: solid("#5AB8E8"), detail: solid("#3A2A22"), eyes: solid("#1E1A14"), pupil: solid("#1E1A14") },
  roast: { coat: solid("#2E6B6A"), accent: solid("#2E6B6A"), roast: solid("#C47A2E"), bone: solid("#F4E7CF"), string: solid("#E6D9BC"), herb: solid("#5E8A3A"), detail: solid("#3A2A22"), eyes: solid("#1E1A14"), pupil: solid("#1E1A14") },
};

// A toy anthropomorphic creature, ONE continuous lump of clay
// (see world/lump.js): a rounded body, a head grown out of its top, two
// legs pulled down to the ground and two arms, each ending in a mitten
// of a hand. They start in a T-pose, the arms straight out level with the
// shoulders; the `pose` knob puts them walking, running or jumping. What
// makes it a frog, a chicken, a cat, a dog, a duck, a person, a witch, a
// pumpkin head, a statue, a fish head or an alien is the head and what
// is stuck to it: the frog's wide flat head, bulging gold eyes, wide mouth
// and splayed fingers; the chicken's beak, comb, wattle and tail
// feathers on bare orange legs; the cat's pointed ears, whiskers and long
// tail; the dog's snout, floppy ears and short tail; the duck's flat bill,
// wings and webbed feet; the person's ears, nose and smile; the witch's
// hooked nose, pointed hat and hair; the pumpkin's ribbed head, stem and
// carved face; the statue's tall stone head, brow, nose and shut eyes;
// the fish's egg of a head, googly eyes, ring lips and fins; the alien's
// dome, black almond eyes and antennae; the voodoo doll's button eye,
// stitched X and mouth, heart patch and pins; the scarecrow's sack head,
// straw hat, stitched grin and straw for hands; the doll's red hair and
// pigtails, freckles, collar and skirt; the cupcake head's fluted paper
// cup, domed cake, swirl of frosting, sprinkles and cherry; the donut
// head's ring of dough stood on edge, glazed and sprinkled, the face
// round the hole; the rotisserie chicken's roasted bird on its back,
// drumsticks trussed out of its front, wings tucked, a sprig of herb on
// top. The black cat is the cat in
// black. The beak, bill, bare legs and floppy ears are
// lumps of their own in the accent colour. It stands on the ground facing
// +z, about 1.3 tall and 1.3 across the arms.
//
//   size    the whole creature scaled
//   kind    frog, chicken, cat, dog, duck, human, witch, pumpkin, statue, fish, alien,
//           voodoo, scarecrow, doll, cupcake, donut or roast
//   skin    `head` and `hands`: whether they are in the skin colour, not the coat
//   pose    t-pose, walk, run, jump, or wield (1-handed) a water gun or
//           wield (2-handed) a whack-a-mole mallet, or hang from a white
//           parachute (opened only on a drop of a cliff's height or more): the arms and legs (see Anthro.jsx)
//   animate whether a walk, run or jump plays as a loop of frames, stop-motion
//           style (a pause while the frames are made); the T-pose stands still
//   body    `radius` of the trunk, `belly` of the round belly in front
//   head    `width`, `height`, `depth` of the head's block, `round` its
//           edges, `y` its middle's height
//   arm     `length` of each arm out of the shoulder, `thickness`
//   legs    `thickness`, `bare` whether the lower legs are bare (the
//           accent colour, a bird's)
//   resolution  the lumps' grid, cells a side: more is smoother, slower
//   colors  `coat`, `accent`, `detail`, `eyes`, `pupil`
export const ANTHRO = {
  size: 1,
  kind: "frog",
  pose: "t-pose",
  animate: false,
  body: { radius: 0.18, belly: 0.2 },
  head: { width: 0.4, height: 0.34, depth: 0.36, round: 0.12, y: 1.14 },
  arm: { length: 0.5, thickness: 0.06 },
  legs: { thickness: 0.075, bare: false },
  resolution: 72,
  colors: paint.frog,
};

export const FROG = {
  ...ANTHRO,
  kind: "frog",
  body: { radius: 0.19, belly: 0.22 },
  head: { width: 0.52, height: 0.26, depth: 0.38, round: 0.1, y: 1.1 },
  colors: paint.frog,
};
export const CHICKEN = {
  ...ANTHRO,
  kind: "chicken",
  head: { width: 0.3, height: 0.3, depth: 0.3, round: 0.12, y: 1.16 },
  legs: { thickness: 0.04, bare: true },
  colors: paint.chicken,
};
export const CAT = {
  ...ANTHRO,
  kind: "cat",
  head: { width: 0.42, height: 0.34, depth: 0.34, round: 0.13, y: 1.14 },
  colors: paint.cat,
};
export const DOG = {
  ...ANTHRO,
  kind: "dog",
  head: { width: 0.4, height: 0.36, depth: 0.34, round: 0.12, y: 1.14 },
  colors: paint.dog,
};
export const DUCK = {
  ...ANTHRO,
  kind: "duck",
  body: { radius: 0.19, belly: 0.22 },
  head: { width: 0.34, height: 0.32, depth: 0.32, round: 0.13, y: 1.15 },
  legs: { thickness: 0.045, bare: true },
  colors: paint.duck,
};

export const BLACK_CAT = { ...CAT, colors: paint.blackCat };
export const HUMAN = {
  ...ANTHRO,
  kind: "human",
  body: { radius: 0.17, belly: 0.19 },
  head: { width: 0.34, height: 0.38, depth: 0.34, round: 0.15, y: 1.17 },
  colors: paint.human,
};
export const WITCH = {
  ...HUMAN,
  kind: "witch",
  skin: { head: true, hands: true },
  colors: paint.witch,
};
export const PUMPKIN = {
  ...ANTHRO,
  kind: "pumpkin",
  body: { radius: 0.17, belly: 0.19 },
  head: { width: 0.48, height: 0.36, depth: 0.48, round: 0.15, y: 1.2 },
  skin: { head: true, hands: false },
  colors: paint.pumpkin,
};
export const STATUE = {
  ...ANTHRO,
  kind: "statue",
  body: { radius: 0.18, belly: 0.18 },
  head: { width: 0.3, height: 0.46, depth: 0.32, round: 0.1, y: 1.28 },
  colors: paint.statue,
};
export const FISH = {
  ...ANTHRO,
  kind: "fish",
  body: { radius: 0.17, belly: 0.19 },
  head: { width: 0.4, height: 0.44, depth: 0.44, round: 0.19, y: 1.2 },
  skin: { head: true, hands: false },
  colors: paint.fish,
};
export const ALIEN = {
  ...ANTHRO,
  kind: "alien",
  body: { radius: 0.15, belly: 0.16 },
  head: { width: 0.5, height: 0.44, depth: 0.42, round: 0.2, y: 1.24 },
  arm: { length: 0.5, thickness: 0.045 },
  legs: { thickness: 0.06, bare: false },
  colors: paint.alien,
};
export const VOODOO = {
  ...ANTHRO,
  kind: "voodoo",
  body: { radius: 0.18, belly: 0.2 },
  head: { width: 0.42, height: 0.38, depth: 0.34, round: 0.16, y: 1.16 },
  colors: paint.voodoo,
};
export const SCARECROW = {
  ...ANTHRO,
  kind: "scarecrow",
  body: { radius: 0.17, belly: 0.18 },
  head: { width: 0.38, height: 0.4, depth: 0.36, round: 0.13, y: 1.18 },
  skin: { head: true, hands: false },
  colors: paint.scarecrow,
};
export const DOLL = {
  ...ANTHRO,
  kind: "doll",
  body: { radius: 0.17, belly: 0.18 },
  head: { width: 0.4, height: 0.4, depth: 0.36, round: 0.17, y: 1.2 },
  skin: { head: true, hands: true },
  colors: paint.doll,
};
// The food heads: each head is its own lumps in its own colours (see
// Anthro.jsx), so `skin` is not used. The head's block is the room the
// head takes: the cupcake from the cup's bottom to the top of the
// frosting, the donut the ring's outer size (its `depth` the tube), the
// roast the bird's body, its trussed legs standing up over that.
export const CUPCAKE = {
  ...ANTHRO,
  kind: "cupcake",
  body: { radius: 0.17, belly: 0.19 },
  head: { width: 0.46, height: 0.66, depth: 0.46, round: 0.1, y: 1.28 },
  colors: paint.cupcake,
};
export const DONUT = {
  ...ANTHRO,
  kind: "donut",
  body: { radius: 0.17, belly: 0.19 },
  head: { width: 0.6, height: 0.6, depth: 0.26, round: 0.1, y: 1.21 },
  colors: paint.donut,
};
export const ROAST = {
  ...ANTHRO,
  kind: "roast",
  body: { radius: 0.17, belly: 0.19 },
  head: { width: 0.4, height: 0.34, depth: 0.42, round: 0.16, y: 1.17 },
  colors: paint.roast,
};

// What can be changed on a creature, from the panel.
// The catalog shows these, and the game's edit panel can (stories/helpers/knobs.js).
export const ANTHRO_KNOBS = [
  { label: "size", path: "size", step: 0.1, min: 0.3, max: 3 },
  { label: "pose", path: "pose", options: ["t-pose", "walk", "run", "jump", "wield (1-handed)", "wield (2-handed)", "parachute"] },
  { label: "animate", path: "animate", bool: true, on: true, off: false },
  { label: "arm length", path: "arm.length", step: 0.05, min: 0.2, max: 0.9 },
  { label: "body colour", path: "colors.coat.hex", color: true },
  { label: "accent colour", path: "colors.accent.hex", color: true },
];
// ...and on a dressed one (a witch, a pumpkin head, a fish head, a scarecrow, a doll), its skin too
export const ANTHRO_SKIN_KNOBS = [...ANTHRO_KNOBS, { label: "skin colour", path: "colors.skin.hex", color: true }];
// ...and on the food heads, their own colours
export const CUPCAKE_KNOBS = [...ANTHRO_KNOBS, { label: "frosting colour", path: "colors.frosting.hex", color: true }, { label: "cup colour", path: "colors.cup.hex", color: true }, { label: "cake colour", path: "colors.cake.hex", color: true }];
export const DONUT_KNOBS = [...ANTHRO_KNOBS, { label: "glaze colour", path: "colors.glaze.hex", color: true }, { label: "dough colour", path: "colors.dough.hex", color: true }];
export const ROAST_KNOBS = [...ANTHRO_KNOBS, { label: "roast colour", path: "colors.roast.hex", color: true }];
