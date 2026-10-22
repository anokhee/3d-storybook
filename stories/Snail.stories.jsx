// Snail: a toy snail crawling along the ground facing +z, its shell a
// tube wound along a logarithmic spiral, its eye stalks waving. Its code
// lives in src/nouns/snail/ (Snail.jsx, defaults and knobs in objects.js).
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

// A garden snail: a brown shell on a paler foot.
export const Garden = {
  args: { colorsShell: "#8B5E3C", colorsFoot: "#F2E9DC" },
};
