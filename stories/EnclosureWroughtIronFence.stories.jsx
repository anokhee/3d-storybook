// Wrought Iron Fence: a black iron railing — square bars between rails, a
// ring in each gap under the top — on slim posts with ball caps, at a
// balcony's height. The enclosure's "wroughtIron" type (FENCE_TYPES in
// src/nouns/enclosure/objects.js); the shopfronts' balconies are railed
// with it (Shopfronts' `balconies`). It needs the lot's footprint (`box`)
// and `top`, how tall the tallest thing inside is.
import Enclosure from "../src/nouns/enclosure/Enclosure.jsx";
import { ENCLOSURE, ENCLOSURE_KNOBS } from "../src/nouns/enclosure/objects.js";
import { knobStory } from "./helpers/knobs.js";

// The knobs are the fence's box, which the Enclosure takes beside its config
const K = knobStory(ENCLOSURE, ENCLOSURE_KNOBS, {}, { width: 6, length: 4 });

export default {
  title: "Fixtures/Fences/Wrought Iron Fence",
  component: Enclosure,
  argTypes: K.argTypes,
  args: K.args,
  // square corners, a post every metre and a half, nothing strung
  render: (a) => <Enclosure box={K.configOf(a)} top={0} config={{ type: "wroughtIron", strung: false, corner: 0, spacing: 1.5 }} />,
};

export const Default = {};
