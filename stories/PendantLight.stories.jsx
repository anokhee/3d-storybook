// Pendant Light: a bare bulb on a cord, lit — the shop interiors hang
// them from where their ceiling would be. Its defaults are PENDANT_LIGHT in
// src/nouns/pendantLight/objects.js. It hangs from its origin, so here it
// is shown hung `hang` up, as from a ceiling.
import PendantLight from "../src/nouns/pendantLight/PendantLight.jsx";
import { PENDANT_LIGHT, PENDANT_LIGHT_KNOBS } from "../src/nouns/pendantLight/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(PENDANT_LIGHT, PENDANT_LIGHT_KNOBS, {}, {});

export default {
  title: "Lighting/Pendant Light",
  component: PendantLight,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => {
    const P = K.configOf(a);
    return (
      <group position-y={P.hang}>
        <PendantLight config={P} />
      </group>
    );
  },
};

export const Default = {};
export const LongCord = { name: "Long Cord", args: { cordLength: 1.2 } };
// under a lit cone (Primitives/Cone), as the café hangs them
export const ConeShade = { name: "Cone Shade", args: { shade: true } };
