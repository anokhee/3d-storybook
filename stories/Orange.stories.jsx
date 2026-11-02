// Orange: its code is src/nouns/orange/build.js (plain three.js, so the shopping
// bag carries clones of it) and src/nouns/orange/Orange.jsx; its defaults
// src/nouns/orange/objects.js.
import Orange from "../src/nouns/orange/Orange.jsx";
import { ORANGE, ORANGE_KNOBS } from "../src/nouns/orange/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(ORANGE, ORANGE_KNOBS, {}, {});

export default {
  title: "Food/Produce/Orange",
  component: Orange,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Orange config={K.configOf(a)} />,
};

export const Default = {};
