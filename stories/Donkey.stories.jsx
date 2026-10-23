// Donkey: a toy donkey on the cat's frame, one lump of clay with a
// forward-leaning neck, a long head with a pale muzzle, long upright
// ears, a dark mane and a tufted tail that swishes. One entry, the way
// the dog's is: the colours and the ear length are knobs. Its code lives
// in src/nouns/donkey/Donkey.jsx and its defaults and knobs in
// src/nouns/donkey/objects.js.
import Donkey from "../src/nouns/donkey/Donkey.jsx";
import { DONKEY, DONKEY_KNOBS } from "../src/nouns/donkey/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(DONKEY, DONKEY_KNOBS, {}, {});

export default {
  title: "Animals/Farm/Donkey",
  tags: ["mountable"],
  component: Donkey,
  argTypes: {
    walk: { control: { type: "range", min: 0, max: 2, step: 0.1 }, name: "walk (strides a second)" },
    rider: { control: "select", options: RIDERS },
    seat: { control: { type: "range", min: -0.4, max: 0.4, step: 0.02 }, name: "seat (back to front)" },
    ...K.argTypes,
  },
  args: { walk: 1, rider: "none", seat: 0.1, ...K.args },
  render: ({ walk, rider, seat, ...a }) => (
    <Mounted walk={walk} rider={rider} forward={seat}>
      <Donkey config={K.configOf(a)} />
    </Mounted>
  ),
};

export const Default = {};
