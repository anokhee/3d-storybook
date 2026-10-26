// Peppermint: a round candy on its edge, banded in a red swirl. Its code is src/nouns/peppermint/Peppermint.jsx and its
// defaults src/nouns/peppermint/objects.js.
import Peppermint from "../src/nouns/peppermint/Peppermint.jsx";
import { PEPPERMINT, PEPPERMINT_KNOBS } from "../src/nouns/peppermint/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(PEPPERMINT, PEPPERMINT_KNOBS, {}, {});

export default {
  title: "Food/Sweets/Peppermint",
  component: Peppermint,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Peppermint config={K.configOf(a)} />,
};

export const Default = {};
