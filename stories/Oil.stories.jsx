// Oil: a tall slim glass bottle of oil with a cork. Its code is src/nouns/cruet/Cruet.jsx (shared with the
// other cruet) and its defaults src/nouns/cruet/objects.js.
import { Oil } from "../src/nouns/cruet/Cruet.jsx";
import { OIL, CRUET_KNOBS } from "../src/nouns/cruet/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(OIL, CRUET_KNOBS, {}, {});

export default {
  title: "Food/Condiments/Oil",
  component: Oil,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Oil config={K.configOf(a)} />,
};

export const Default = {};
