// Goat: a toy goat on the cat's frame, one lump of clay with a neck and
// head leant forward, horns swept back, drooping ears, a beard and a
// short tail pointing up, a darker patch painted over its back. One
// entry, the way the dog's is: the horns, the beard and the colours are
// knobs. Its code lives in src/nouns/goat/Goat.jsx and its defaults and
// knobs in src/nouns/goat/objects.js.
import Goat from "../src/nouns/goat/Goat.jsx";
import { GOAT, GOAT_KNOBS } from "../src/nouns/goat/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(GOAT, GOAT_KNOBS, {}, {});

export default {
  title: "Animals/Farm/Goat",
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
