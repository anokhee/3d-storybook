// Lion: a toy lion, one lump of clay with its face and tail on and a
// second lump of a mane round its head, swishing. One entry: the mane
// (off makes a lioness), its colour and the coat's are knobs. Its code
// lives in src/nouns/lion/Lion.jsx and its defaults and knobs in
// src/nouns/lion/objects.js.
import Lion from "../src/nouns/lion/Lion.jsx";
import { LION, LION_KNOBS } from "../src/nouns/lion/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(LION, LION_KNOBS, {}, {});

export default {
  title: "Animals/Safari/Lion",
  tags: ["mountable"],
  component: Lion,
  argTypes: {
    walk: { control: { type: "range", min: 0, max: 2, step: 0.1 }, name: "walk (strides a second)" },
    rider: { control: "select", options: RIDERS },
    seat: { control: { type: "range", min: -0.4, max: 0.4, step: 0.02 }, name: "seat (back to front)" },
    ...K.argTypes,
  },
  args: { walk: 1, rider: "none", seat: 0.1, ...K.args },
  render: ({ walk, rider, seat, ...a }) => (
    <Mounted walk={walk} rider={rider} forward={seat}>
      <Lion config={K.configOf(a)} />
    </Mounted>
  ),
};

export const Default = {};
