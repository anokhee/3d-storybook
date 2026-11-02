// Cake: an iced cake with a cherry on top, as a bakery's shelves hold them (Furniture/Storage/Shelving,
// "cakes"). Its code is src/nouns/cake/Cake.jsx (its parts, shared with the
// shelves, src/nouns/cake/parts.js) and its defaults src/nouns/cake/objects.js.
import Cake from "../src/nouns/cake/Cake.jsx";
import { CAKE, CAKE_KNOBS } from "../src/nouns/cake/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CAKE, CAKE_KNOBS, {}, {});

export default {
  title: "Food/Baked/Cake",
  component: Cake,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Cake config={K.configOf(a)} />,
};

export const Default = {};
