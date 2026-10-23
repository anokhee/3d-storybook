// Bear: a toy bear, one lump of clay with a hump, a broad head, a painted
// muzzle, round ears and a stub of a tail, standing on all fours. One
// entry, the way the dog's is: the size, the coat's and muzzle's colours
// (brown as made; black or polar white, see BEAR_COATS) and the ears
// are knobs. Its code lives in src/nouns/bear/Bear.jsx and its defaults
// and knobs in src/nouns/bear/objects.js.
import Bear from "../src/nouns/bear/Bear.jsx";
import { BEAR, BEAR_KNOBS } from "../src/nouns/bear/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(BEAR, BEAR_KNOBS, {}, {});

export default {
  title: "Animals/Forest/Bear",
  tags: ["mountable"],
  component: Bear,
  argTypes: {
    walk: { control: { type: "range", min: 0, max: 2, step: 0.1 }, name: "walk (strides a second)" },
    rider: { control: "select", options: RIDERS },
    seat: { control: { type: "range", min: -0.4, max: 0.4, step: 0.02 }, name: "seat (back to front)" },
    ...K.argTypes,
  },
  args: { walk: 1, rider: "none", seat: 0.1, ...K.args },
  render: ({ walk, rider, seat, ...a }) => (
    <Mounted walk={walk} rider={rider} forward={seat}>
      <Bear config={K.configOf(a)} />
    </Mounted>
  ),
};

export const Default = {};
