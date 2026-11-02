// Teacup: a low cup of tea with a little handle, on its saucer. Its code is src/nouns/teacup/Teacup.jsx and its defaults
// src/nouns/teacup/objects.js.
import Teacup from "../src/nouns/teacup/Teacup.jsx";
import { TEACUP, TEACUP_KNOBS } from "../src/nouns/teacup/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(TEACUP, TEACUP_KNOBS, {}, {});

export default {
  title: "Food/Kitchen/Teacup",
  component: Teacup,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Teacup config={K.configOf(a)} />,
};

export const Default = {};
