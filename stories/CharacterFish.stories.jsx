// Fish Head: the anthropomorphic Fish Head in a T-pose: an egg of a fish for a head (after Animals/Fish Head), with googly eyes, ring lips and fins, on a body in a blue suit. One continuous lump with
// the shared body of the other characters (src/nouns/anthro/Anthro.jsx);
// its defaults and knobs live in src/nouns/anthro/objects.js.
import Anthro from "../src/nouns/anthro/Anthro.jsx";
import { FISH, ANTHRO_SKIN_KNOBS } from "../src/nouns/anthro/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(FISH, ANTHRO_SKIN_KNOBS, FISH, {});

export default {
  title: "Characters/Fish Head",
  component: Anthro,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Anthro config={K.configOf(a)} />,
};

// The pose knob switches the T-pose to walking, running or jumping, and
// the animate knob plays those as a loop.
export const Default = {};
