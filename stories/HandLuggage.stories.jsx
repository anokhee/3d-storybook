// Hand luggage: a briefcase-style case stood on its long edge, a loop
// handle on top, clasps and straps. The suitcase's "hand" kind, with
// HAND_LUGGAGE's sizes and leather (src/nouns/suitcase/objects.js); its
// code is in src/nouns/suitcase/Suitcase.jsx.
import Suitcase from "../src/nouns/suitcase/Suitcase.jsx";
import { HAND_LUGGAGE, HAND_LUGGAGE_KNOBS } from "../src/nouns/suitcase/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(HAND_LUGGAGE, HAND_LUGGAGE_KNOBS, { kind: "hand" });

export default {
  title: "Props/Luggage/Hand Luggage",
  component: Suitcase,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Suitcase config={K.configOf(a)} />,
};

export const Default = {};

// Laid down on its back, the handle edge toward you.
export const LyingFlat = { args: { pose: "flat" } };
