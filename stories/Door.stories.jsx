// Door: a machine's little door, a primitive's front half cut at z = 0 and
// bulging out along +z. Shown on a panel (stories/helpers/mounts.jsx) so
// it reads as mounted. Its defaults live in src/nouns/door/objects.js.
import Door from "../src/nouns/door/Door.jsx";
import { WallPanel } from "./helpers/mounts.jsx";

const AT = 2;

export default {
  title: "Machine Parts/Door",
  component: Door,
  parameters: { stage: { view: "front" } },
  render: () => (
    <WallPanel width={2.6} height={2.6} center={[0, AT]}>
      <group position-y={AT}>
        <Door config={{}} />
      </group>
    </WallPanel>
  ),
};

export const Default = {};
