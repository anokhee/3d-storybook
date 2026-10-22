// Dog: a toy dog of spheres and capsules with a snout, floppy ears and a
// collar, standing or sitting, its tail wagging. Its code lives in
// src/nouns/dog/Dog.jsx and its defaults and knobs in src/nouns/dog/objects.js.
import Dog from "../src/nouns/dog/Dog.jsx";
import { DOG, DOG_KNOBS } from "../src/nouns/dog/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(DOG, DOG_KNOBS, {}, {});

export default {
  title: "Animals/Pets/Dog",
  component: Dog,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Dog config={K.configOf(a)} />,
};

export const Default = {};

export const Sitting = { args: { pose: "sitting" } };

export const Spotted = {
  args: { colorsCoat: "#F2E9DC", colorsPatch: "#3B2A4E", colorsCollar: "#7c56be" },
};
