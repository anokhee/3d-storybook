// Frying Pan: a shallow pan with a long handle, an egg frying in it. Its code is src/nouns/fryingPan/FryingPan.jsx and its defaults
// src/nouns/fryingPan/objects.js.
import FryingPan from "../src/nouns/fryingPan/FryingPan.jsx";
import { FRYING_PAN, FRYING_PAN_KNOBS } from "../src/nouns/fryingPan/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(FRYING_PAN, FRYING_PAN_KNOBS, {}, {});

export default {
  title: "Food/Kitchen/Frying Pan",
  component: FryingPan,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <FryingPan config={K.configOf(a)} />,
};

export const Default = {};
