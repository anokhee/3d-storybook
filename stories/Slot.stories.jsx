// Slot: a coin slot, built facing +z so it sits flush on a machine's face.
// Shown on a panel (stories/helpers/mounts.jsx) so it reads as mounted.
// Its defaults live in src/nouns/slot/objects.js.
import Slot from "../src/nouns/slot/Slot.jsx";
import { WallPanel } from "./helpers/mounts.jsx";

const AT = 2;

export default {
  title: "Machine Parts/Slot",
  component: Slot,
  parameters: { stage: { view: "front" } },
  render: () => (
    <WallPanel width={2} height={2.2} center={[0, AT]}>
      <group position-y={AT}>
        <Slot config={{}} />
      </group>
    </WallPanel>
  ),
};

export const Default = {};
