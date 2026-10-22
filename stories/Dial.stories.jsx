// Dial: a coin dial, built facing +z so it sits flush on a machine's face.
// Shown on a panel (stories/helpers/mounts.jsx) so it reads as mounted.
// Its defaults live in src/nouns/dial/objects.js.
import Dial from "../src/nouns/dial/Dial.jsx";
import { WallPanel } from "./helpers/mounts.jsx";

const AT = 2; // how high up the panel's face it sits

export default {
  title: "Machine Parts/Dial",
  component: Dial,
  parameters: { stage: { view: "front" } },
  render: () => (
    <WallPanel width={2.2} height={2.2} center={[0, AT]}>
      <group position-y={AT}>
        <Dial config={{}} />
      </group>
    </WallPanel>
  ),
};

export const Default = {};
