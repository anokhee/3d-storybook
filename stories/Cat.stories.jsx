// Cat: a toy cat, one lump of clay with its face and tail on, swishing. One
// entry: the coat (orange tabby, black, tuxedo, grey) and the pose
// (standing, sitting, loaf) are knobs, the way the albatross's variants
// are. Its code lives in src/nouns/cat/Cat.jsx and its defaults, coats
// and knobs in src/nouns/cat/objects.js.
import Cat from "../src/nouns/cat/Cat.jsx";
import { CAT, CAT_KNOBS } from "../src/nouns/cat/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CAT, CAT_KNOBS, {}, {});

export default {
  title: "Animals/Pets/Cat",
  component: Cat,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Cat config={K.configOf(a)} />,
};

export const Default = {};
