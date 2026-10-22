// Feet: the little legs under a fridge or a vending machine. They need the
// `footprint` of whatever they hold up (half-sizes from its middle) and a
// `swatch` to be painted in. Shown under a floating slab that size
// (stories/helpers/mounts.jsx) so they read as feet.
import Feet, { feetLiftOf } from "../src/nouns/feet/Feet.jsx";
import { Slab } from "./helpers/mounts.jsx";
import { PALETTE } from "../src/world/palette.js";

const footprint = { x: 1.5, z: 1 };
const lift = feetLiftOf({}); // how high the feet hold the slab

export default {
  title: "Machine Parts/Feet",
  component: Feet,
  render: () => (
    <group position-y={1}>
      <group position-y={lift}>
        <Slab width={footprint.x * 2} depth={footprint.z * 2} />
      </group>
      <Feet config={{}} footprint={footprint} swatch={PALETTE.vendingMachine.feet} />
    </group>
  ),
};

export const Default = {};
