// Salt and Pepper: a pair of shakers for the table, salt's cap with five
// holes and pepper's with three — both, or pick one from "which". Its code
// is src/nouns/shaker/Shakers.jsx and its defaults src/nouns/shaker/objects.js.
import Shakers from "../src/nouns/shaker/Shakers.jsx";
import { SHAKERS, SHAKERS_KNOBS } from "../src/nouns/shaker/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(SHAKERS, SHAKERS_KNOBS, {}, {});

export default {
  title: "Food/Condiments/Salt and Pepper",
  component: Shakers,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Shakers config={K.configOf(a)} />,
};

export const Default = {};
