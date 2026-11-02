// Sharp Knife: a kitchen knife, its blade coming to a point, lying flat,
// its handle toward the back. Its code is src/nouns/cutlery/Cutlery.jsx and
// its defaults (shared with the fork, the knife and the spoon; its own
// under `sharp`) src/nouns/cutlery/objects.js.
import { SharpKnife } from "../src/nouns/cutlery/Cutlery.jsx";
import { CUTLERY, SHARP_KNIFE_KNOBS } from "../src/nouns/cutlery/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CUTLERY, SHARP_KNIFE_KNOBS, {}, {});

export default {
  title: "Food/Utensils/Sharp Knife",
  component: SharpKnife,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <SharpKnife config={K.configOf(a)} />,
};

export const Default = {};
