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
import { FROG, CHICKEN, CAT, DOG, DUCK, BLACK_CAT, HUMAN, WITCH, PUMPKIN, STATUE, FISH, ALIEN, VOODOO, SCARECROW, DOLL, CUPCAKE, DONUT, ROAST } from "../../src/nouns/anthro/objects.js";

export const KINDS = {
  chicken: CHICKEN, frog: FROG, cat: CAT, dog: DOG, duck: DUCK,
  "black cat": BLACK_CAT, human: HUMAN, witch: WITCH, "pumpkin head": PUMPKIN, statue: STATUE, "fish head": FISH, alien: ALIEN,
  "voodoo doll": VOODOO, scarecrow: SCARECROW, doll: DOLL,
  "cupcake head": CUPCAKE, "donut head": DONUT, "rotisserie chicken": ROAST,
};
export const DRIVERS = ["none", ...Object.keys(KINDS)];
// How high every car's cushion stands over its floor, in its own units
// (each builder's `seat` is its FLOOR + this)
const CUSHION = 0.26;

export function Driver({ kind = "none", seat, floor = seat[1] - CUSHION, scale = 1, height = 1.8 }) {
  const base = KINDS[kind];
  if (!base) return null;
  const size = height / (base.head.y + base.head.height / 2);
  // The pose stands its feet on its own ground, so that goes on the floor
  return (
    <group position={[seat[0] * scale, floor * scale, seat[2] * scale]} rotation-y={Math.PI / 2}>
      <Anthro config={{ ...base, pose: "drive", size }} />
    </group>
  );
}
