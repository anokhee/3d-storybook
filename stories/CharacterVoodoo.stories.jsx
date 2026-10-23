// Voodoo Doll: the anthropomorphic Voodoo Doll in a T-pose: a cute stuffed burlap doll with one button eye and one stitched X, a stitched mouth, a red heart patch and three pins stuck in it. One continuous lump with
// the shared body of the other characters (src/nouns/anthro/Anthro.jsx);
// its defaults and knobs live in src/nouns/anthro/objects.js.
import Anthro from "../src/nouns/anthro/Anthro.jsx";
import { VOODOO, ANTHRO_KNOBS } from "../src/nouns/anthro/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(VOODOO, ANTHRO_KNOBS, VOODOO, {});

export default {
  title: "Characters/Voodoo Doll",
  component: Anthro,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Anthro config={K.configOf(a)} />,
};

// The pose knob switches the T-pose to walking, running or jumping, and
// the animate knob plays those as a loop.
export const Default = {};
