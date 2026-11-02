// Loaf: a round loaf of bread, as a bakery's shelves hold them (Furniture/Storage/Shelving,
// "cakes"). Its code is src/nouns/cake/Cake.jsx (its parts, shared with the
// shelves, src/nouns/cake/parts.js) and its defaults src/nouns/cake/objects.js.
import { Loaf } from "../src/nouns/cake/Cake.jsx";
import { LOAF, LOAF_KNOBS } from "../src/nouns/cake/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(LOAF, LOAF_KNOBS, {}, {});

export default {
  title: "Food/Baked/Loaf",
  component: Loaf,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Loaf config={K.configOf(a)} />,
};

export const Default = {};
