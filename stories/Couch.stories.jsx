// Couch: one entry, as it was made. Its defaults live in
// src/nouns/couch/objects.js; to give it knobs, see Bench.stories.jsx.
import Couch from "../src/nouns/couch/Couch.jsx";
import { COUCH, COUCH_KNOBS } from "../src/nouns/couch/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(COUCH, COUCH_KNOBS, {}, {});

export default {
  title: "Furniture/Seating/Basic Sofa",
  component: Couch,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Couch config={K.configOf(a)} />,
};

export const Default = {};
