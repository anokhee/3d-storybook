// Alleyway: the passage between two shopfronts — paving with a gutter down
// it, a brick wall with a gate closing the far end, a lamp over the gate,
// wheelie bins against the sides. On its own it has side walls; on the
// street the shops either side are its walls. Its defaults are ALLEY in
// src/nouns/alley/objects.js.
import Alley from "../src/nouns/alley/Alley.jsx";
import { ALLEY, ALLEY_KNOBS } from "../src/nouns/alley/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(ALLEY, ALLEY_KNOBS, {}, { sides: true, bins: 2 });

export default {
  title: "Shopfronts/Alleyway",
  component: Alley,
  parameters: { stage: { view: "front" } }, // looking in at its mouth
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Alley config={K.configOf(a)} />,
};

export const Default = {};
// the warehouse through the door at the end, as the street's alleys have
// once gone into
export const BackRoom = { name: "Back Room", args: { room: true, roomKind: "storage" } };
// now and then (about one alley in five on the street) it is this instead
export const Interrogation = { name: "Back Room — Interrogation", args: { room: true, roomKind: "interrogation" } };
