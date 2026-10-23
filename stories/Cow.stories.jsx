// Cow: a toy cow on the dog's frame, one lump of clay with a head block,
// a pink muzzle, horns, painted patches and a bell, its tail swinging.
// One entry, the way the dog's is: the colours and what it wears are
// knobs. Its code lives in src/nouns/cow/Cow.jsx and its defaults and
// knobs in src/nouns/cow/objects.js.
import Cow from "../src/nouns/cow/Cow.jsx";
import { COW, COW_KNOBS } from "../src/nouns/cow/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(COW, COW_KNOBS, {}, {});

export default {
  title: "Animals/Farm/Cow",
  tags: ["mountable"],
  component: Cow,
  argTypes: {
    walk: { control: { type: "range", min: 0, max: 2, step: 0.1 }, name: "walk (strides a second)" },
    rider: { control: "select", options: RIDERS },
    seat: { control: { type: "range", min: -0.4, max: 0.4, step: 0.02 }, name: "seat (back to front)" },
    ...K.argTypes,
  },
  args: { walk: 1, rider: "none", seat: 0.1, ...K.args },
  render: ({ walk, rider, seat, ...a }) => (
    <Mounted walk={walk} rider={rider} forward={seat}>
      <Cow config={K.configOf(a)} />
    </Mounted>
  ),
};

export const Default = {};
