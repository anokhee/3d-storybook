// Tiger: a toy tiger on the cat's standing frame, one lump of clay with
// round ears, a white bib and muzzle and black stripes painted on, its
// tail swishing. One entry, the way the cat's is: the size, the swish,
// the stripes and the colours are knobs. Its code lives in
// src/nouns/tiger/Tiger.jsx and its defaults and knobs in
// src/nouns/tiger/objects.js.
import Tiger from "../src/nouns/tiger/Tiger.jsx";
import { TIGER, TIGER_KNOBS } from "../src/nouns/tiger/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(TIGER, TIGER_KNOBS, {}, {});

export default {
  title: "Animals/Safari/Tiger",
  tags: ["mountable"],
  component: Tiger,
  argTypes: {
    walk: { control: { type: "range", min: 0, max: 2, step: 0.1 }, name: "walk (strides a second)" },
    rider: { control: "select", options: RIDERS },
    seat: { control: { type: "range", min: -0.4, max: 0.4, step: 0.02 }, name: "seat (back to front)" },
    ...K.argTypes,
  },
  args: { walk: 1, rider: "none", seat: 0.1, ...K.args },
  render: ({ walk, rider, seat, ...a }) => (
    <Mounted walk={walk} rider={rider} forward={seat}>
      <Tiger config={K.configOf(a)} />
    </Mounted>
  ),
};

export const Default = {};
