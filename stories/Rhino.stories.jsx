// Rhino: the buffalo in a rhino's grey — the same component as
// Buffalo.stories.jsx (src/nouns/buffalo/Buffalo.jsx), pinned to RHINO:
// no horns off the sides of the head, a big bone horn on the nose and a
// small one behind it. The horn's length and the colours are knobs. Its
// defaults and knobs live in src/nouns/rhino/objects.js.
import Buffalo from "../src/nouns/buffalo/Buffalo.jsx";
import { RHINO, RHINO_KNOBS } from "../src/nouns/rhino/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(RHINO, RHINO_KNOBS, RHINO, {});

export default {
  title: "Animals/Safari/Rhino",
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
