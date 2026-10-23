// Cat: a toy cat, one lump of clay with its face and tail on, swishing. One
// entry: the coat (orange tabby, black, tuxedo, grey) and the pose
// (standing, sitting, loaf) are knobs, the way the albatross's variants
// are. Its code lives in src/nouns/cat/Cat.jsx and its defaults, coats
// and knobs in src/nouns/cat/objects.js.
import Cat from "../src/nouns/cat/Cat.jsx";
import { CAT, CAT_KNOBS } from "../src/nouns/cat/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(CAT, CAT_KNOBS, {}, {});

export default {
  title: "Animals/Pets/Cat",
  tags: ["mountable"],
  component: Cat,
  argTypes: {
    walk: { control: { type: "range", min: 0, max: 2, step: 0.1 }, name: "walk (strides a second)" },
    rider: { control: "select", options: RIDERS },
    seat: { control: { type: "range", min: -0.4, max: 0.4, step: 0.02 }, name: "seat (back to front)" },
    ...K.argTypes,
  },
  args: { walk: 1, rider: "none", seat: 0.1, ...K.args },
  render: ({ walk, rider, seat, ...a }) => (
    <Mounted walk={a.pose === "standing" ? walk : 0} rider={rider} forward={seat}>
      <Cat config={K.configOf(a)} />
    </Mounted>
  ),
};

export const Default = {};
