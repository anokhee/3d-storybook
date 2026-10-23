// Sheep: a toy sheep, a woolly lump of a fleece over a dark lump of a
// body, head and legs, its tail wagging. One entry, the way the dog's
// is: the colours and the horns (on makes a ram)
// are knobs. Its code lives in src/nouns/sheep/Sheep.jsx and its
// defaults and knobs in src/nouns/sheep/objects.js.
import Sheep from "../src/nouns/sheep/Sheep.jsx";
import { SHEEP, SHEEP_KNOBS } from "../src/nouns/sheep/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(SHEEP, SHEEP_KNOBS, {}, {});

export default {
  title: "Animals/Farm/Sheep",
  tags: ["mountable"],
  component: Sheep,
  argTypes: {
    walk: { control: { type: "range", min: 0, max: 2, step: 0.1 }, name: "walk (strides a second)" },
    rider: { control: "select", options: RIDERS },
    seat: { control: { type: "range", min: -0.4, max: 0.4, step: 0.02 }, name: "seat (back to front)" },
    ...K.argTypes,
  },
  args: { walk: 1, rider: "none", seat: 0.1, ...K.args },
  render: ({ walk, rider, seat, ...a }) => (
    <Mounted walk={walk} rider={rider} forward={seat}>
      <Sheep config={K.configOf(a)} />
    </Mounted>
  ),
};

export const Default = {};
