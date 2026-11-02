// Bowl: a lathe-turned bowl on a foot ring, its rim flared — basic,
// chinoiserie, striped or folk ("design", each with its own colours) — with
// an apple and a banana, oranges and apples, noodles or curry in it, or
// nothing ("contents"). Its code is src/nouns/bowl/Bowl.jsx and its defaults
// src/nouns/bowl/objects.js.
import Bowl from "../src/nouns/bowl/Bowl.jsx";
import { BOWL, BOWL_KNOBS } from "../src/nouns/bowl/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(BOWL, BOWL_KNOBS, {}, {});

export default {
  title: "Food/Kitchen/Bowl",
  component: Bowl,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Bowl config={K.configOf(a)} />,
};

export const Default = {};
