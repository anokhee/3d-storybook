// Rotisserie Chicken: the anthropomorphic Rotisserie Chicken in a T-pose: a roasted chicken for a head, on its back with its breast forward, drumsticks trussed with string out of its front, wings tucked, a sprig of herb on top, on a body in teal. One continuous lump with
// the shared body of the other characters (src/nouns/anthro/Anthro.jsx);
// its defaults and knobs live in src/nouns/anthro/objects.js.
import Anthro from "../src/nouns/anthro/Anthro.jsx";
import { ROAST, ROAST_KNOBS } from "../src/nouns/anthro/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(ROAST, ROAST_KNOBS, ROAST, {});

export default {
  title: "Characters/Anthropomorphic/Rotisserie Chicken",
  component: Anthro,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Anthro config={K.configOf(a)} />,
};

// The pose knob switches the T-pose to walking, running or jumping, or to
// wielding a water gun (1-handed) or a whack-a-mole mallet (2-handed), and
// the animate knob plays those as a loop (the mallet swings).
export const Default = {};
