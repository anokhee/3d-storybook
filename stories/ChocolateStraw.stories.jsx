// Chocolate Straws: a bunch of hollow chocolate straws, splayed. Its code is src/nouns/chocolateStraw/ChocolateStraw.jsx and its
// defaults src/nouns/chocolateStraw/objects.js.
import ChocolateStraw from "../src/nouns/chocolateStraw/ChocolateStraw.jsx";
import { CHOCOLATE_STRAW, CHOCOLATE_STRAW_KNOBS } from "../src/nouns/chocolateStraw/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CHOCOLATE_STRAW, CHOCOLATE_STRAW_KNOBS, {}, {});

export default {
  title: "Food/Sweets/Chocolate Straws",
  component: ChocolateStraw,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <ChocolateStraw config={K.configOf(a)} />,
};

export const Default = {};
