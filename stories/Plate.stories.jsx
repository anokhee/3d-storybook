// Plate: a turned plate with a heap of food on it (a Table Setting lays one, or a Bowl). Its code is src/nouns/plate/Plate.jsx and its defaults
// src/nouns/plate/objects.js.
import Plate from "../src/nouns/plate/Plate.jsx";
import { PLATE, PLATE_KNOBS } from "../src/nouns/plate/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(PLATE, PLATE_KNOBS, {}, {});

export default {
  title: "Food/Kitchen/Plate",
  component: Plate,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Plate config={K.configOf(a)} />,
};

export const Default = {};
export const Empty = { args: { foodOn: false } };
