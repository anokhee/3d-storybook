// Witch: the anthropomorphic Witch in a T-pose: a green-skinned witch in a dark robe, with a long hooked nose and a wart, a pointed hat on a wide brim and ginger hair hanging from under it. One continuous lump with
// the shared body of the other characters (src/nouns/anthro/Anthro.jsx);
// its defaults and knobs live in src/nouns/anthro/objects.js.
import Anthro from "../src/nouns/anthro/Anthro.jsx";
import { WITCH, ANTHRO_SKIN_KNOBS } from "../src/nouns/anthro/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(WITCH, ANTHRO_SKIN_KNOBS, WITCH, {});

export default {
  title: "Characters/Anthropomorphic/Witch",
  component: Anthro,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Anthro config={K.configOf(a)} />,
};

// The pose knob switches the T-pose to walking, running or jumping, or to
// wielding a water gun (1-handed) or a whack-a-mole mallet (2-handed), and
// the animate knob plays those as a loop (the mallet swings).
export const Default = {};
