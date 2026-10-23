// Statue: the anthropomorphic Statue in a T-pose: all stone, with the field's statue head (Monuments/Head) made in the characters' clay: a tall head on a thick neck, a heavy brow, a long nose, full lips and shut eyes. One continuous lump with
// the shared body of the other characters (src/nouns/anthro/Anthro.jsx);
// its defaults and knobs live in src/nouns/anthro/objects.js.
import Anthro from "../src/nouns/anthro/Anthro.jsx";
import { STATUE, ANTHRO_KNOBS } from "../src/nouns/anthro/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(STATUE, ANTHRO_KNOBS, STATUE, {});

export default {
  title: "Characters/Statue",
  component: Anthro,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Anthro config={K.configOf(a)} />,
};

// The pose knob switches the T-pose to walking, running or jumping, and
// the animate knob plays those as a loop.
export const Default = {};
