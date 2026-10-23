// Horse: the zebra with its stripes off and a chestnut coat — the same
// component and knobs as Zebra.stories.jsx (the deer's, src/nouns/goat/
// Goat.jsx, with the cow's muzzle), started from HORSE so the panel shows
// the stripes off, the giraffe's long snout and the brown coat, a dark brown mane and tail, a
// darker muzzle and near-black hooves. Its defaults and knobs live in
// src/nouns/zebra/objects.js.
import Goat from "../src/nouns/goat/Goat.jsx";
import { HORSE, ZEBRA_KNOBS } from "../src/nouns/zebra/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(HORSE, ZEBRA_KNOBS, HORSE, {}); // pinned to HORSE, so its non-knob colours (the mane, hooves) hold too

export default {
  title: "Animals/Farm/Horse",
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
