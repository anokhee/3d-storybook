// House Door: the front door the doll goes in at, with its knob
// (DWELLING.door in src/nouns/house/objects.js), its foot on the ground.
// Set in a floor-to-ceiling stretch of wall (stories/helpers/mounts.jsx).
import { Door } from "../src/nouns/house/House.jsx";
import { DWELLING } from "../src/nouns/house/objects.js";
import { WallPanel } from "./helpers/mounts.jsx";
import { PALETTE } from "../src/world/palette.js";

const D = DWELLING.door;
const wallTop = D.height + 1.5;

export default {
  title: "Fixtures/Doors/House Door",
  component: Door,
  parameters: { stage: { view: "front" } },
  render: () => (
    <WallPanel width={D.width + 3} height={wallTop} center={[0, wallTop / 2]} swatch={PALETTE.house.walls}>
      <Door D={D} face={0} />
    </WallPanel>
  ),
};

export const Default = {};
