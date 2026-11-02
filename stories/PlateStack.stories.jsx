// Stacked Plates: the Plate, empty, a stack of them, as a kitchen shelf
// keeps them. Its code is src/nouns/plateStack/PlateStack.jsx and its
// defaults src/nouns/plateStack/objects.js.
import PlateStack from "../src/nouns/plateStack/PlateStack.jsx";
import { PLATE_STACK, PLATE_STACK_KNOBS } from "../src/nouns/plateStack/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(PLATE_STACK, PLATE_STACK_KNOBS, {}, {});

export default {
  title: "Food/Kitchen/Stacked Plates",
  component: PlateStack,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <PlateStack config={K.configOf(a)} />,
};

export const Default = {};
