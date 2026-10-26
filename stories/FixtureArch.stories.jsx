// Arched Door: the mushroom house's door, a box under a half-coin with its
// frame behind it and a knob (MUSHROOM_HOUSE.door in
// src/nouns/house/mushroom/objects.js). It is built about its middle, so
// it is lifted by half its height to stand its foot on the ground. Set in
// a floor-to-ceiling stretch of wall (stories/helpers/mounts.jsx).
import { Arch } from "../src/nouns/house/Panes.jsx";
import { MUSHROOM_HOUSE } from "../src/nouns/house/mushroom/objects.js";
import { WallPanel } from "./helpers/mounts.jsx";
import { PALETTE } from "../src/world/palette.js";

const A = MUSHROOM_HOUSE.door;
const wallTop = A.height + 1.5;

export default {
  title: "Fixtures/Arches/Arched Door",
  component: Arch,
  parameters: { stage: { view: "front" } },
  render: () => (
    <WallPanel width={A.width + 3} height={wallTop} center={[0, wallTop / 2]} swatch={PALETTE.mushroomHouse.walls ?? PALETTE.house.walls}>
      <group position-y={A.height / 2}>
        <Arch config={A} />
      </group>
    </WallPanel>
  ),
};

export const Default = {};
