// Bowl: a lathe-turned bowl on a foot ring, its rim flared, with fruit
// resting inside. Its code is src/nouns/bowl/Bowl.jsx and its defaults
// src/nouns/bowl/objects.js.
import Bowl from "../src/nouns/bowl/Bowl.jsx";
import { BOWL, BOWL_KNOBS } from "../src/nouns/bowl/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(BOWL, BOWL_KNOBS, {}, {});

export default {
  title: "Props/Kitchen/Bowl",
  component: Bowl,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Bowl config={K.configOf(a)} />,
};

export const Default = {};

export const Empty = { args: { fruitCount: 0 } };
