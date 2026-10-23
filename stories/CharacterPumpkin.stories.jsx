// Pumpkin Head: the anthropomorphic Pumpkin Head in a T-pose: a ribbed pumpkin for a head, with a stem and a carved face (triangle eyes and nose, a jagged grin), on a body in green. One continuous lump with
// the shared body of the other characters (src/nouns/anthro/Anthro.jsx);
// its defaults and knobs live in src/nouns/anthro/objects.js.
import Anthro from "../src/nouns/anthro/Anthro.jsx";
import { PUMPKIN, ANTHRO_SKIN_KNOBS } from "../src/nouns/anthro/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(PUMPKIN, ANTHRO_SKIN_KNOBS, PUMPKIN, {});

export default {
  title: "Characters/Pumpkin Head",
  component: Anthro,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Anthro config={K.configOf(a)} />,
};

// The pose knob switches the T-pose to walking, running or jumping, and
// the animate knob plays those as a loop.
export const Default = {};
