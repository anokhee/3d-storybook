// Strawberry: a seeded berry sitting on its crown of leaves. Its code is src/nouns/strawberry/Strawberry.jsx and its
// defaults src/nouns/strawberry/objects.js.
import Strawberry from "../src/nouns/strawberry/Strawberry.jsx";
import { STRAWBERRY, STRAWBERRY_KNOBS } from "../src/nouns/strawberry/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(STRAWBERRY, STRAWBERRY_KNOBS, {}, {});

export default {
  title: "Food/Fruits/Strawberry",
  component: Strawberry,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Strawberry config={K.configOf(a)} />,
};

export const Default = {};
