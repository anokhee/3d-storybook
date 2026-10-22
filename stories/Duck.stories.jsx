// Duck: a toy duck standing on the ground facing +z, a mallard as made,
// bobbing its head and waggling its tail. Its code lives in
// src/nouns/duck/ (Duck.jsx, defaults and knobs in objects.js). The kind
// shapes the duck; the variants paint each kind its own way.
import Duck from "../src/nouns/duck/Duck.jsx";
import { DUCK, DUCK_KNOBS } from "../src/nouns/duck/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(DUCK, DUCK_KNOBS, {}, {});

export default {
  title: "Animals/Birds/Duck",
  component: Duck,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Duck config={K.configOf(a)} />,
};

export const Default = {};

// A farm duck: cream all over with an orange bill.
export const WhiteDuck = {
  args: { kind: "white", colorsBody: "#F2E9DC", colorsHead: "#F2E9DC", colorsBill: "#F08A3C" },
};

// A bath toy: bright yellow, no legs, sitting flat on its belly.
export const RubberDuck = {
  args: { kind: "rubber", colorsBody: "#F4D46A", colorsHead: "#F4D46A", colorsBill: "#F08A3C" },
};
