// Basic Bench: the Basic Chair, twice as wide. Same component as the chair
// (src/nouns/chair/Chair.jsx) and the same proportions; only the seat's
// width differs, read off CHAIR so the two stay in step.
//
// Note the config is NOT exported: Storybook turns every named export of
// a story file into an entry in the sidebar.
import Chair from "../src/nouns/chair/Chair.jsx";
import { CHAIR, CHAIR_KNOBS } from "../src/nouns/chair/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CHAIR, CHAIR_KNOBS, {}, { seatWidth: CHAIR.seat.width * 2 });

export default {
  title: "Furniture/Seating/Basic Bench",
  component: Chair,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Chair config={K.configOf(a)} />,
};

export const Default = {};
