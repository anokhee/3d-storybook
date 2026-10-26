// Doll: the anthropomorphic Doll in a T-pose: a rag doll of a girl with red hair, a fringe and two pigtails tied with blue bows, freckles, a blue dress with a white collar and a flared skirt, white stockings and dark shoes. One continuous lump with
// the shared body of the other characters (src/nouns/anthro/Anthro.jsx);
// its defaults and knobs live in src/nouns/anthro/objects.js.
import Anthro from "../src/nouns/anthro/Anthro.jsx";
import { DOLL, ANTHRO_SKIN_KNOBS } from "../src/nouns/anthro/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(DOLL, ANTHRO_SKIN_KNOBS, DOLL, {});

export default {
  title: "Characters/Anthropomorphic/Doll",
  component: Anthro,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Anthro config={K.configOf(a)} />,
};

// The pose knob switches the T-pose to walking, running or jumping, or to
// wielding a water gun (1-handed) or a whack-a-mole mallet (2-handed), and
// the animate knob plays those as a loop (the mallet swings).
export const Default = {};
