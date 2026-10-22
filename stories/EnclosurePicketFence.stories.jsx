// Picket Fence: boards on rails between the posts. The enclosure's
// "picket" type (FENCE_TYPES in src/nouns/enclosure/objects.js). It needs the
// lot's footprint (`box`) and `top`, how tall the tallest thing inside is.
// `strung: false` leaves the garland off; the garland has its own entry.
import Enclosure from "../src/nouns/enclosure/Enclosure.jsx";
import { ENCLOSURE, ENCLOSURE_KNOBS } from "../src/nouns/enclosure/objects.js";
import { knobStory } from "./helpers/knobs.js";

// The knobs are the fence's box, which the Enclosure takes beside its config
const K = knobStory(ENCLOSURE, ENCLOSURE_KNOBS);

export default {
  title: "Fixtures/Fences/Picket Fence",
  component: Enclosure,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Enclosure box={K.configOf(a)} top={0} config={{ type: "picket", strung: false }} />,
};

export const Default = {};

