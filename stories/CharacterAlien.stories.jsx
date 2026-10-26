// Alien: the anthropomorphic Alien in a T-pose: a slim green alien with a big domed head, huge black almond eyes and two antennae with bobbles. One continuous lump with
// the shared body of the other characters (src/nouns/anthro/Anthro.jsx);
// its defaults and knobs live in src/nouns/anthro/objects.js.
import Anthro from "../src/nouns/anthro/Anthro.jsx";
import { ALIEN, ANTHRO_KNOBS } from "../src/nouns/anthro/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(ALIEN, ANTHRO_KNOBS, ALIEN, {});

export default {
  title: "Characters/Anthropomorphic/Alien",
  component: Anthro,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Anthro config={K.configOf(a)} />,
};

// The pose knob switches the T-pose to walking, running or jumping, or to
// wielding a water gun (1-handed) or a whack-a-mole mallet (2-handed), and
// the animate knob plays those as a loop (the mallet swings).
export const Default = {};
