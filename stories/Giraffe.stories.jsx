// Giraffe: the deer with a giraffe's colours — the same component as
// Goat.stories.jsx and Deer.stories.jsx (src/nouns/goat/Goat.jsx), pinned
// to GIRAFFE: ossicones in place of the antlers, ears out to the sides,
// the deer's irregular spots in brown on a tan coat, its tail brown and
// flicking. The ossicones and the colours are knobs. Its defaults and
// knobs live in src/nouns/giraffe/objects.js.
import Goat from "../src/nouns/goat/Goat.jsx";
import { GIRAFFE, GIRAFFE_KNOBS } from "../src/nouns/giraffe/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(GIRAFFE, GIRAFFE_KNOBS, GIRAFFE, {});

export default {
  title: "Animals/Safari/Giraffe",
  tags: ["mountable"],
  component: Goat,
  argTypes: {
    walk: { control: { type: "range", min: 0, max: 2, step: 0.1 }, name: "walk (strides a second)" },
    rider: { control: "select", options: RIDERS },
    seat: { control: { type: "range", min: -0.4, max: 0.4, step: 0.02 }, name: "seat (back to front)" },
    ...K.argTypes,
  },
  args: { walk: 1, rider: "none", seat: 0.1, ...K.args },
  render: ({ walk, rider, seat, ...a }) => (
    <Mounted walk={walk} rider={rider} forward={seat}>
      <Goat config={K.configOf(a)} />
    </Mounted>
  ),
};

export const Default = {};
