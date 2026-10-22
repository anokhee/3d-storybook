// Chair: one entry, as it was made. Its defaults live in
// src/nouns/chair/objects.js; to give it knobs, see Bench.stories.jsx.
import Chair from "../src/nouns/chair/Chair.jsx";
import { CHAIR, CHAIR_KNOBS } from "../src/nouns/chair/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CHAIR, CHAIR_KNOBS, {}, {});

export default {
  title: "Furniture/Seating/Basic Chair",
  component: Chair,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Chair config={K.configOf(a)} />,
};

export const Default = {
  args: {
    seatWidth: 1.3,
    legsHeight: 0.8,
    backHeight: 1.4,
    colorsFrame: "#F4D46A",
    seatDepth: 1.3
  }
};
