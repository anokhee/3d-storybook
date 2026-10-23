// Toilet: a pedestal and oval bowl with a seat and a hinged lid, a tank
// behind with a flush button on top, standing on the ground facing +z.
// Its code lives in src/nouns/toilet/ (Toilet.jsx, objects.js).
import Toilet from "../src/nouns/toilet/Toilet.jsx";
import { TOILET, TOILET_KNOBS } from "../src/nouns/toilet/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(TOILET, TOILET_KNOBS);

export default {
  title: "Furniture/Bathroom/Toilet",
  component: Toilet,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Toilet config={K.configOf(a)} />,
};

export const Default = {};
