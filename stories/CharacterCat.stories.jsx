// Cat: the anthropomorphic Cat in a T-pose, with pointed ears, whiskers and a long tail. One continuous lump with
// the shared body of the other characters (src/nouns/anthro/Anthro.jsx);
// its defaults and knobs live in src/nouns/anthro/objects.js.
import Anthro from "../src/nouns/anthro/Anthro.jsx";
import { CAT, ANTHRO_KNOBS } from "../src/nouns/anthro/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CAT, ANTHRO_KNOBS, CAT, {});

export default {
  title: "Characters/Cat",
  component: Anthro,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Anthro config={K.configOf(a)} />,
};

// The pose knob switches the T-pose to walking, running or jumping, and
// the animate knob plays those as a loop.
export const Default = {};
