// Buffalo: a toy buffalo on the dog's frame, one lump of clay with a hump
// on its shoulders, a broad low head with a painted muzzle, pale horns
// sweeping out and up, and a tufted tail flicking. One entry, the way
// the dog's is: the size, the horns' spread and the colours are knobs.
// Its code lives in src/nouns/buffalo/Buffalo.jsx and its defaults and
// knobs in src/nouns/buffalo/objects.js.
import Buffalo from "../src/nouns/buffalo/Buffalo.jsx";
import { BUFFALO, BUFFALO_KNOBS } from "../src/nouns/buffalo/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(BUFFALO, BUFFALO_KNOBS, {}, {});

export default {
  title: "Animals/Farm/Buffalo",
  tags: ["mountable"],
  component: Buffalo,
  argTypes: {
    walk: { control: { type: "range", min: 0, max: 2, step: 0.1 }, name: "walk (strides a second)" },
    rider: { control: "select", options: RIDERS },
    seat: { control: { type: "range", min: -0.4, max: 0.4, step: 0.02 }, name: "seat (back to front)" },
    ...K.argTypes,
  },
  args: { walk: 1, rider: "none", seat: 0.1, ...K.args },
  render: ({ walk, rider, seat, ...a }) => (
    <Mounted walk={walk} rider={rider} forward={seat}>
      <Buffalo config={K.configOf(a)} />
    </Mounted>
  ),
};

export const Default = {};
