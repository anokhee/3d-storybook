// Snail: the snail car (Vehicles/Car/Snail) without the car, crawling
// along the ground facing +z: a big coiled shell with a raised spiral on
// each flank, over a soft foot rising into a smiling head with rosy
// cheeks and two long swaying eyestalks, a streak of slime under it. Its
// code lives in src/nouns/snail/ (Snail.jsx, defaults and knobs in
// objects.js), built from the car's own snail (src/car/snailcar.js).
import Snail from "../src/nouns/snail/Snail.jsx";
import { SNAIL, SNAIL_KNOBS } from "../src/nouns/snail/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(SNAIL, SNAIL_KNOBS, {}, {});

export default {
  title: "Animals/Snail",
  component: Snail,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Snail config={K.configOf(a)} />,
};

export const Default = {};
