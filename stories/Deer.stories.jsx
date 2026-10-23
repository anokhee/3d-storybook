// Deer: the goat with antlers on — the same component as Goat.stories.jsx
// (src/nouns/goat/Goat.jsx), pinned to DEER: branching antlers in a
// second lump in place of the horns, ears standing up, plain round bead
// eyes, no beard or patch, a russet coat with a dark nose and hooves,
// its short tail flicking. The antlers and the colours are knobs. Its
// defaults and knobs live in src/nouns/deer/objects.js.
import Goat from "../src/nouns/goat/Goat.jsx";
import { DEER, DEER_KNOBS } from "../src/nouns/deer/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(DEER, DEER_KNOBS, DEER, {});

export default {
  title: "Animals/Forest/Deer",
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
