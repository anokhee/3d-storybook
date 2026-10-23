// Umbrella: an open umbrella standing on the crook of its handle, canopy
// spread at the top. Its code is in src/nouns/umbrella/ (Umbrella.jsx and
// its defaults in objects.js). The open switch furls it: the ribs
// down along the shaft, the strap round the cloth.
import Umbrella from "../src/nouns/umbrella/Umbrella.jsx";
import { UMBRELLA, UMBRELLA_KNOBS } from "../src/nouns/umbrella/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(UMBRELLA, UMBRELLA_KNOBS);

export default {
  title: "Props/Umbrella",
  component: Umbrella,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Umbrella config={K.configOf(a)} />,
};

export const Default = {};
