// Armchair: the basic sofa with one seat instead of three: the same base,
// arms and back (src/nouns/couch), narrowed to one cushion's width, with
// one pillow in the middle. Its knobs are the couch's.
import Couch from "../src/nouns/couch/Couch.jsx";
import { COUCH, COUCH_KNOBS } from "../src/nouns/couch/objects.js";
import { knobStory } from "./helpers/knobs.js";

// One seat: a third of the sofa's seat span, plus the two arms; one pillow
const K = knobStory(COUCH, COUCH_KNOBS, {}, { baseWidth: 3.5, cushionsCount: 1, pillowsCount: 1 });

export default {
  title: "Furniture/Seating/Basic Armchair",
  component: Couch,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Couch config={K.configOf(a)} />,
};

export const Default = {};
