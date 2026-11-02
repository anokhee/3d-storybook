// Baguette: a long scored loaf, the one out of the shopping bag. Its code
// is src/nouns/baguette/build.js (plain three.js, so the bag carries clones
// of it) and src/nouns/baguette/Baguette.jsx; its defaults
// src/nouns/baguette/objects.js.
import Baguette from "../src/nouns/baguette/Baguette.jsx";
import { BAGUETTE, BAGUETTE_KNOBS } from "../src/nouns/baguette/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(BAGUETTE, BAGUETTE_KNOBS, {}, {});

export default {
  title: "Food/Baked/Baguette",
  component: Baguette,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Baguette config={K.configOf(a)} />,
};

export const Default = {};
