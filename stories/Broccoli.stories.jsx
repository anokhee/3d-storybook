// Broccoli: a head of broccoli standing on its stalk, the Broccoli Car's
// crown without the car; the one out of the shopping bag. Its code is
// src/nouns/broccoli/build.js (plain three.js, so the bag carries clones of
// it) and src/nouns/broccoli/Broccoli.jsx; its defaults
// src/nouns/broccoli/objects.js.
import Broccoli from "../src/nouns/broccoli/Broccoli.jsx";
import { BROCCOLI, BROCCOLI_KNOBS } from "../src/nouns/broccoli/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(BROCCOLI, BROCCOLI_KNOBS, {}, {});

export default {
  title: "Food/Produce/Broccoli",
  component: Broccoli,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Broccoli config={K.configOf(a)} />,
};

export const Default = {};
