// Glass: a see-through tumbler with a drink in it. Its code is src/nouns/glass/Glass.jsx and its defaults
// src/nouns/glass/objects.js.
import Glass from "../src/nouns/glass/Glass.jsx";
import { GLASS, GLASS_KNOBS } from "../src/nouns/glass/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(GLASS, GLASS_KNOBS, {}, {});

export default {
  title: "Food/Kitchen/Glass",
  component: Glass,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Glass config={K.configOf(a)} />,
};

export const Default = {};
export const Water = { args: { colorsDrink: "#CFE8F0", full: 0.8 } };
export const Cola = { args: { colorsDrink: "#4A2A20" } };
