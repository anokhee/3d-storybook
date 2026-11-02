// Fork: lying flat, its handle toward the back. Its code is
// src/nouns/cutlery/Cutlery.jsx and its defaults (shared by the fork, the
// knife and the spoon) src/nouns/cutlery/objects.js. A Table Setting lays it.
import { Fork } from "../src/nouns/cutlery/Cutlery.jsx";
import { CUTLERY, FORK_KNOBS } from "../src/nouns/cutlery/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CUTLERY, FORK_KNOBS, {}, {});

export default {
  title: "Food/Utensils/Fork",
  component: Fork,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Fork config={K.configOf(a)} />,
};

export const Default = {};
