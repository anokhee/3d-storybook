// Spoon: lying flat, its handle toward the back. Its code is
// src/nouns/cutlery/Cutlery.jsx and its defaults (shared by the fork, the
// knife and the spoon) src/nouns/cutlery/objects.js. A Table Setting lays it.
import { Spoon } from "../src/nouns/cutlery/Cutlery.jsx";
import { CUTLERY, SPOON_KNOBS } from "../src/nouns/cutlery/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CUTLERY, SPOON_KNOBS, {}, {});

export default {
  title: "Food/Utensils/Spoon",
  component: Spoon,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Spoon config={K.configOf(a)} />,
};

export const Default = {};
