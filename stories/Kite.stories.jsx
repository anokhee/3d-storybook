// Kite: a diamond kite flying up and back at the end of its line, its sail
// to the camera, bobbing in the wind with its bow tail rippling behind, the line tied
// to a peg in the ground at the origin. Its code is in src/nouns/kite/
// (Kite.jsx, KITE and KITE_KNOBS in objects.js). Low is the same kite on
// a short line, just off the ground.
import Kite from "../src/nouns/kite/Kite.jsx";
import { KITE, KITE_KNOBS } from "../src/nouns/kite/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(KITE, KITE_KNOBS, {}, {});

export default {
  title: "Toys/Kite",
  component: Kite,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Kite config={K.configOf(a)} />,
};

export const Default = {};

export const Low = {
  args: { height: 5 },
};
