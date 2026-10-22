// Capsule: the ball a gachapon drops, standing on a floating slab
// (stories/helpers/mounts.jsx). This component takes the config AS GIVEN
// (no merge over defaults), so it gets the whole default object; to tweak,
// { ...CAPSULE, ... }. Its defaults live in src/nouns/capsule/objects.js.
import Capsule from "../src/nouns/capsule/Capsule.jsx";
import { CAPSULE } from "../src/nouns/capsule/objects.js";
import { Slab } from "./helpers/mounts.jsx";

export default {
  title: "Machine Parts/Capsule",
  component: Capsule,
  render: () => (
    <group position-y={1}>
      <Slab width={CAPSULE.radius * 4} depth={CAPSULE.radius * 4} />
      <Capsule config={CAPSULE} />
    </group>
  ),
};

export const Default = {};
