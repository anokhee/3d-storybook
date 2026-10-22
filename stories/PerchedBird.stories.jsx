// Bird on a perch: a small songbird gripping the crossbar of a parrot
// stand (or a stub of branch), the whole standing on the ground facing
// +z, the bird cocking and turning its head. Its code lives in
// src/nouns/perchedBird/ (PerchedBird.jsx, defaults and knobs in objects.js).
import PerchedBird from "../src/nouns/perchedBird/PerchedBird.jsx";
import { PERCHED_BIRD, PERCHED_BIRD_KNOBS } from "../src/nouns/perchedBird/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(PERCHED_BIRD, PERCHED_BIRD_KNOBS, {}, {});

export default {
  title: "Animals/Birds/Bird on a Perch",
  component: PerchedBird,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <PerchedBird config={K.configOf(a)} />,
};

export const Default = {};

// The same bird on a stub of branch angled up off a little mound.
export const OnABranch = {
  args: { perch: "branch", height: 1.6, colorsPerch: "#8B6A4F" },
};

// A bluebird: blue above, orange below, the head cocked.
export const Bluebird = {
  args: { colorsBody: "#4F86C6", colorsBelly: "#F08A3C", colorsBeak: "#3B2A4E", tilt: 0.5 },
};
