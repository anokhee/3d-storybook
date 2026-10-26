// Cupcake Head: the anthropomorphic Cupcake Head in a T-pose: a cupcake for a head, a fluted paper cup under a domed golden cake that wears the face, a swirl of frosting on top with sprinkles and a cherry, on a body in mint. One continuous lump with
// the shared body of the other characters (src/nouns/anthro/Anthro.jsx);
// its defaults and knobs live in src/nouns/anthro/objects.js.
import Anthro from "../src/nouns/anthro/Anthro.jsx";
import { CUPCAKE, CUPCAKE_KNOBS } from "../src/nouns/anthro/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CUPCAKE, CUPCAKE_KNOBS, CUPCAKE, {});

export default {
  title: "Characters/Anthropomorphic/Cupcake Head",
  component: Anthro,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Anthro config={K.configOf(a)} />,
};

// The pose knob switches the T-pose to walking, running or jumping, or to
// wielding a water gun (1-handed) or a whack-a-mole mallet (2-handed), and
// the animate knob plays those as a loop (the mallet swings).
export const Default = {};
