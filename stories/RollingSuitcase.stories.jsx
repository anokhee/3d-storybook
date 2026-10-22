// Rolling suitcase: an upright hard case on four wheels with a telescoping
// handle. The suitcase's "rolling" kind (SUITCASE_KINDS in
// src/nouns/suitcase/objects.js); its code is in src/nouns/suitcase/
// (Suitcase.jsx and its defaults in objects.js).
import Suitcase from "../src/nouns/suitcase/Suitcase.jsx";
import { SUITCASE, SUITCASE_KNOBS } from "../src/nouns/suitcase/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(SUITCASE, SUITCASE_KNOBS, { kind: "rolling" });

export default {
  title: "Props/Luggage/Rolling Suitcase",
  component: Suitcase,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Suitcase config={K.configOf(a)} />,
};

export const Default = {};

// The handle pushed down into the case.
export const HandleDown = { args: { handle: 0 } };
