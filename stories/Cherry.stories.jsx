// Cherry: a red ball with a curved stalk and a leaf. Its code is src/nouns/cherry/Cherry.jsx and its
// defaults src/nouns/cherry/objects.js.
import Cherry from "../src/nouns/cherry/Cherry.jsx";
import { CHERRY, CHERRY_KNOBS } from "../src/nouns/cherry/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CHERRY, CHERRY_KNOBS, {}, {});

export default {
  title: "Food/Fruits/Cherry",
  component: Cherry,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Cherry config={K.configOf(a)} />,
};

export const Default = {};
