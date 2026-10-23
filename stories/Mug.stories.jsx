// Mug: a hollow cup with a half-ring handle, standing on the ground, with
// coffee in it to the level set. Its code is src/nouns/mug/Mug.jsx and its
// defaults src/nouns/mug/objects.js.
import Mug from "../src/nouns/mug/Mug.jsx";
import { MUG, MUG_KNOBS } from "../src/nouns/mug/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(MUG, MUG_KNOBS, {}, {});

export default {
  title: "Props/Kitchen/Mug",
  component: Mug,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Mug config={K.configOf(a)} />,
};

export const Default = {};
