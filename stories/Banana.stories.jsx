// Banana: its code is src/nouns/banana/build.js (plain three.js, so the shopping
// bag carries clones of it) and src/nouns/banana/Banana.jsx; its defaults
// src/nouns/banana/objects.js.
import Banana from "../src/nouns/banana/Banana.jsx";
import { BANANA, BANANA_KNOBS } from "../src/nouns/banana/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(BANANA, BANANA_KNOBS, {}, {});

export default {
  title: "Food/Produce/Banana",
  component: Banana,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Banana config={K.configOf(a)} />,
};

export const Default = {};
export const Bunch = { args: { count: 4 } };
