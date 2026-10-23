// Bed: a frame on short legs with a mattress, a headboard, pillows at the
// head and a duvet over the foot end, standing on the ground with its foot
// toward +z. Its code lives in src/nouns/bed/ (Bed.jsx, objects.js).
import Bed from "../src/nouns/bed/Bed.jsx";
import { BED, BED_KNOBS } from "../src/nouns/bed/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(BED, BED_KNOBS);

export default {
  title: "Furniture/Bedroom/Bed",
  component: Bed,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Bed config={K.configOf(a)} />,
};

export const Default = {};
