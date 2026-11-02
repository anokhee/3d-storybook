// Vinegar: a round-bellied glass cruet of vinegar with a glass stopper. Its code is src/nouns/cruet/Cruet.jsx (shared with the
// other cruet) and its defaults src/nouns/cruet/objects.js.
import { Vinegar } from "../src/nouns/cruet/Cruet.jsx";
import { VINEGAR, CRUET_KNOBS } from "../src/nouns/cruet/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(VINEGAR, CRUET_KNOBS, {}, {});

export default {
  title: "Food/Condiments/Vinegar",
  component: Vinegar,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Vinegar config={K.configOf(a)} />,
};

export const Default = {};
