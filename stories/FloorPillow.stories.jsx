// Floor pillow: a fat squashy cushion on the ground, square or round, with
// a button tufted in its top and piping round its middle. Its code lives in
// src/nouns/floorPillow/ (FloorPillow.jsx, objects.js).
import FloorPillow from "../src/nouns/floorPillow/FloorPillow.jsx";
import { FLOOR_PILLOW, FLOOR_PILLOW_KNOBS } from "../src/nouns/floorPillow/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(FLOOR_PILLOW, FLOOR_PILLOW_KNOBS);

export default {
  title: "Furniture/Floor Decor/Floor Pillow",
  component: FloorPillow,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <FloorPillow config={K.configOf(a)} />,
};

export const Default = {};
