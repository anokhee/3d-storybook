// Wolf: a toy wolf on the dog's frame, one lump of clay with a long
// snout, pointed ears, a painted bib and saddle, and a bushy tail held
// low, wagging. One entry, the way the dog's is: the size, the wag and
// the colours are knobs. Its code lives in src/nouns/wolf/Wolf.jsx and
// its defaults and knobs in src/nouns/wolf/objects.js.
import Wolf from "../src/nouns/wolf/Wolf.jsx";
import { WOLF, WOLF_KNOBS } from "../src/nouns/wolf/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(WOLF, WOLF_KNOBS, {}, {});

export default {
  title: "Animals/Forest/Wolf",
  tags: ["mountable"],
  component: Wolf,
  argTypes: {
    walk: { control: { type: "range", min: 0, max: 2, step: 0.1 }, name: "walk (strides a second)" },
    rider: { control: "select", options: RIDERS },
    seat: { control: { type: "range", min: -0.4, max: 0.4, step: 0.02 }, name: "seat (back to front)" },
    ...K.argTypes,
  },
  args: { walk: 1, rider: "none", seat: 0.1, ...K.args },
  render: ({ walk, rider, seat, ...a }) => (
    <Mounted walk={walk} rider={rider} forward={seat}>
      <Wolf config={K.configOf(a)} />
    </Mounted>
  ),
};

export const Default = {};
