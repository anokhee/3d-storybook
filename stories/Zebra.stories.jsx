// Zebra: the deer with the cow's broad muzzle on — the same component as
// Deer.stories.jsx (src/nouns/goat/Goat.jsx), pinned to ZEBRA: antlers
// and spots off, a longer head, pointed standing ears, a black mane,
// painted black stripes and a hanging tufted tail, swishing. The stripes,
// the mane and the colours are knobs. Its defaults and knobs live in
// src/nouns/zebra/objects.js.
import Goat from "../src/nouns/goat/Goat.jsx";
import { ZEBRA, ZEBRA_KNOBS } from "../src/nouns/zebra/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(ZEBRA, ZEBRA_KNOBS, ZEBRA, {}); // pinned to ZEBRA, so its non-knob fields (the muzzle, the tail) hold over the goat's

export default {
  title: "Animals/Safari/Zebra",
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
