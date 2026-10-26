// Scarecrow: the anthropomorphic Scarecrow in a T-pose: a burlap sack head tied with rope, button eyes, a stitched grin and a triangle nose, a straw hat, a red shirt with a patch, blue trousers, and straw for hands and out of the collar and cuffs. One continuous lump with
// the shared body of the other characters (src/nouns/anthro/Anthro.jsx);
// its defaults and knobs live in src/nouns/anthro/objects.js.
import Anthro from "../src/nouns/anthro/Anthro.jsx";
import { SCARECROW, ANTHRO_SKIN_KNOBS } from "../src/nouns/anthro/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(SCARECROW, ANTHRO_SKIN_KNOBS, SCARECROW, {});

export default {
  title: "Characters/Anthropomorphic/Scarecrow",
  component: Anthro,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Anthro config={K.configOf(a)} />,
};

// The pose knob switches the T-pose to walking, running or jumping, or to
// wielding a water gun (1-handed) or a whack-a-mole mallet (2-handed), and
// the animate knob plays those as a loop (the mallet swings).
export const Default = {};
