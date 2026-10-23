// Dog: a toy dog on the cat's frame, one lump of clay with a snout, floppy
// ears, painted spots and a collar, its tail wagging. One entry, the
// way the cat's is: the pose (standing, sitting) and the colours are
// knobs. Its code lives in src/nouns/dog/Dog.jsx and its defaults and
// knobs in src/nouns/dog/objects.js.
import Dog from "../src/nouns/dog/Dog.jsx";
import { DOG, DOG_KNOBS } from "../src/nouns/dog/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(DOG, DOG_KNOBS, {}, {});

export default {
  title: "Animals/Pets/Dog",
  tags: ["mountable"],
  component: Dog,
  argTypes: {
    walk: { control: { type: "range", min: 0, max: 2, step: 0.1 }, name: "walk (strides a second)" },
    rider: { control: "select", options: RIDERS },
    seat: { control: { type: "range", min: -0.4, max: 0.4, step: 0.02 }, name: "seat (back to front)" },
    ...K.argTypes,
  },
  args: { walk: 1, rider: "none", seat: 0.1, ...K.args },
  render: ({ walk, rider, seat, ...a }) => (
    <Mounted walk={walk} rider={rider} forward={seat}>
      <Dog config={K.configOf(a)} />
    </Mounted>
  ),
};

export const Default = {};
