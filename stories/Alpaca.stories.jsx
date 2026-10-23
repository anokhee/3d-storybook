// Alpaca: the llama (see Llama.stories.jsx) with its alpaca switch on —
// a shorter neck, a rounder woolly body and a topknot, a little
// smaller. The same component and knobs, started as an alpaca. Its code
// lives in src/nouns/llama/Llama.jsx and its defaults and knobs in
// src/nouns/llama/objects.js.
import Llama from "../src/nouns/llama/Llama.jsx";
import { LLAMA, LLAMA_KNOBS } from "../src/nouns/llama/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory({ ...LLAMA, alpaca: true }, LLAMA_KNOBS, {}, {});

export default {
  title: "Animals/Farm/Alpaca",
  tags: ["mountable"],
  component: Llama,
  argTypes: {
    walk: { control: { type: "range", min: 0, max: 2, step: 0.1 }, name: "walk (strides a second)" },
    rider: { control: "select", options: RIDERS },
    seat: { control: { type: "range", min: -0.4, max: 0.4, step: 0.02 }, name: "seat (back to front)" },
    ...K.argTypes,
  },
  args: { walk: 1, rider: "none", seat: 0.1, ...K.args },
  render: ({ walk, rider, seat, ...a }) => (
    <Mounted walk={walk} rider={rider} forward={seat}>
      <Llama config={K.configOf(a)} />
    </Mounted>
  ),
};

export const Default = {};
