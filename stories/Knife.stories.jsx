// Knife: lying flat, its handle toward the back. Its code is
// src/nouns/cutlery/Cutlery.jsx and its defaults (shared by the fork, the
// knife and the spoon) src/nouns/cutlery/objects.js. A Table Setting lays it.
import { Knife } from "../src/nouns/cutlery/Cutlery.jsx";
import { CUTLERY, KNIFE_KNOBS } from "../src/nouns/cutlery/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CUTLERY, KNIFE_KNOBS, {}, {});

export default {
  title: "Food/Utensils/Knife",
  component: Knife,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Knife config={K.configOf(a)} />,
};

export const Default = {};
