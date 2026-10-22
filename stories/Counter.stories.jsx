// Counter: one entry, as it was made. Its defaults live in
// src/nouns/counter/objects.js; to give it knobs, see Bench.stories.jsx.
import Counter from "../src/nouns/counter/Counter.jsx";
import { COUNTER, COUNTER_KNOBS } from "../src/nouns/counter/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(COUNTER, COUNTER_KNOBS, {}, {});

export default {
  title: "Furniture/Surfaces/Counter",
  component: Counter,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Counter config={K.configOf(a)} />,
};

export const Default = {};
