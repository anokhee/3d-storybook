// Counter with sink: the kitchen counter's other kind (COUNTER_KINDS in
// src/nouns/counter/objects.js): a basin sunk into the worktop with a tap
// behind it. The plain counter is under Furniture ▸ Surfaces.
import Counter from "../src/nouns/counter/Counter.jsx";
import { COUNTER, COUNTER_KNOBS } from "../src/nouns/counter/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(COUNTER, COUNTER_KNOBS, { kind: "sink" }, {});

export default {
  title: "Furniture/Water Fixtures/Counter with Sink",
  component: Counter,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Counter config={K.configOf(a)} />,
};

export const Default = {};
