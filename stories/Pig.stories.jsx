// Pig: a toy pig on the dog's frame, one lump of clay with a disc of a
// snout, floppy ears, painted patches and a curly tail, wagging. One
// entry, the way the dog's is: the colours and the patches are knobs.
// Its code lives in src/nouns/pig/Pig.jsx and its defaults and knobs in
// src/nouns/pig/objects.js.
import Pig from "../src/nouns/pig/Pig.jsx";
import { PIG, PIG_KNOBS } from "../src/nouns/pig/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(PIG, PIG_KNOBS, {}, {});

export default {
  title: "Animals/Farm/Pig",
  tags: ["mountable"],
  component: Pig,
  argTypes: {
    walk: { control: { type: "range", min: 0, max: 2, step: 0.1 }, name: "walk (strides a second)" },
    rider: { control: "select", options: RIDERS },
    seat: { control: { type: "range", min: -0.4, max: 0.4, step: 0.02 }, name: "seat (back to front)" },
    ...K.argTypes,
  },
  args: { walk: 1, rider: "none", seat: 0.1, ...K.args },
  render: ({ walk, rider, seat, ...a }) => (
    <Mounted walk={walk} rider={rider} forward={seat}>
      <Pig config={K.configOf(a)} />
    </Mounted>
  ),
};

export const Default = {};
