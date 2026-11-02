// Cookpot: a lidded stockpot with a loop handle either side, for a stove's burner. Its code is src/nouns/cookpot/Cookpot.jsx and its defaults
// src/nouns/cookpot/objects.js.
import Cookpot from "../src/nouns/cookpot/Cookpot.jsx";
import { COOKPOT, COOKPOT_KNOBS } from "../src/nouns/cookpot/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(COOKPOT, COOKPOT_KNOBS, {}, {});

export default {
  title: "Food/Kitchen/Cookpot",
  component: Cookpot,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Cookpot config={K.configOf(a)} />,
};

export const Default = { name: "Closed" };
export const Open = { args: { lidOn: false } };
