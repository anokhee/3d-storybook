// Fridge: one entry, as it was made. Its defaults live in
// src/nouns/fridge/objects.js; to give it knobs, see Bench.stories.jsx.
import Fridge from "../src/nouns/fridge/Fridge.jsx";
import { FRIDGE, FRIDGE_KNOBS } from "../src/nouns/fridge/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(FRIDGE, FRIDGE_KNOBS, {}, {});

export default {
  title: "Furniture/Appliances/Fridge",
  component: Fridge,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Fridge config={K.configOf(a)} />,
};

export const Default = {};
