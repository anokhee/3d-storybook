// Donut Head: the anthropomorphic Donut Head in a T-pose: a ring donut stood on edge for a head, pink glaze dripping over its front with sprinkles, the eyes over the hole and a smile under it, on a body in cocoa. One continuous lump with
// the shared body of the other characters (src/nouns/anthro/Anthro.jsx);
// its defaults and knobs live in src/nouns/anthro/objects.js.
import Anthro from "../src/nouns/anthro/Anthro.jsx";
import { DONUT, DONUT_KNOBS } from "../src/nouns/anthro/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(DONUT, DONUT_KNOBS, DONUT, {});

export default {
  title: "Characters/Anthropomorphic/Donut Head",
  component: Anthro,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Anthro config={K.configOf(a)} />,
};

// The pose knob switches the T-pose to walking, running or jumping, or to
// wielding a water gun (1-handed) or a whack-a-mole mallet (2-handed), and
// the animate knob plays those as a loop (the mallet swings).
export const Default = {};
