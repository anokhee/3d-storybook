// DRIVER: one of the characters (src/nouns/anthro — the frog, chicken,
// cat, dog, duck and the rest) sat in a vehicle's driver's seat in their "drive"
// pose, thighs sloping forward off the cushion, shins straight down and
// feet flat on the car's floor, arms out ahead to the wheel; scaled to
// `height` world units tall to the top of the head. `seat` is where the
// driver's cushion top is in the vehicle's own units (each car builder
// reports it) and `floor` the cockpit's floor under it, CUSHION below by
// default; `scale` the vehicle's scale. The characters face +z, so each
// is turned a quarter round to face the cars' +x. `kind` "none" draws
// nothing.
import Anthro from "../../src/nouns/anthro/Anthro.jsx";
import ShadowSpirit from "../../src/nouns/anthro/ShadowSpirit.jsx";
import { CAT_HEIGHT } from "../../src/nouns/house/objects.js";
import { SHADOW_SPIRIT, FROG, CHICKEN, CAT, DOG, DUCK, BLACK_CAT, HUMAN, WITCH, PUMPKIN, STATUE, FISH, ALIEN, VOODOO, SCARECROW, DOLL, CUPCAKE, DONUT, ROAST } from "../../src/nouns/anthro/objects.js";

export const KINDS = {
  chicken: CHICKEN, frog: FROG, cat: CAT, dog: DOG, duck: DUCK,
  "black cat": BLACK_CAT, human: HUMAN, witch: WITCH, "pumpkin head": PUMPKIN, statue: STATUE, "fish head": FISH, alien: ALIEN,
  "voodoo doll": VOODOO, scarecrow: SCARECROW, doll: DOLL,
  "cupcake head": CUPCAKE, "donut head": DONUT, "rotisserie chicken": ROAST,
  "shadow spirit": SHADOW_SPIRIT,
};
// One of KINDS as drawn: the Shadow Spirit (the Human made see-through,
// masked — see ShadowSpirit.jsx) by its own component, any other by Anthro.
// Every seat — a car's, an animal's back, a bicycle's saddle — draws its
// character with this, so the spirit can sit in any of them.
export function Character({ config }) {
  return config.spirit ? <ShadowSpirit config={config} /> : <Anthro config={config} />;
}
export const DRIVERS = ["none", ...Object.keys(KINDS)];
// How high every car's cushion stands over its floor, in its own units
// (each builder's `seat` is its FLOOR + this)
const CUSHION = 0.26;

// `height` is the character's walking height (src/nouns/house/objects.js's
// CAT_HEIGHT): the cars are scaled so that fills their seat, and the game
// sits the character in as they stand.
export function Driver({ kind = "none", seat, floor = seat[1] - CUSHION, scale = 1, height = CAT_HEIGHT }) {
  const base = KINDS[kind];
  if (!base) return null;
  const size = height / (base.head.y + base.head.height / 2);
  // The pose stands its feet on its own ground, so that goes on the floor
  return (
    <group position={[seat[0] * scale, floor * scale, seat[2] * scale]} rotation-y={Math.PI / 2}>
      <Character config={{ ...base, pose: "drive", size }} />
    </group>
  );
}
