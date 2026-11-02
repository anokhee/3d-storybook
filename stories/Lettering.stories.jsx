// Buildings/Lettering: a word written in the world's own script — the
// nine glyphs carved up the Monuments and spoken in the street's speech
// bubbles — or in a typeface, either got wrong if asked (see
// src/nouns/lettering/objects.js). The Sign writes its text with it, and
// so the shopfronts' sign boards: a café's says cafe.
import Lettering from "../src/nouns/lettering/Lettering.jsx";
import { LETTERING, LETTERING_KNOBS } from "../src/nouns/lettering/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(LETTERING, LETTERING_KNOBS);

export default {
  title: "Buildings/Lettering",
  component: Lettering,
  argTypes: K.argTypes,
  args: K.args,
  parameters: { stage: { view: "front" } }, // read square-on, as a sign is
  render: (a) => <Lettering config={K.configOf(a)} />,
};

// the glyph script, as it came
export const Default = {};
// the same word in a typeface
export const Font = { args: { script: "font" } };
// left in the sun
export const Melted = { args: { wobble: 1.2, grain: 0.8, bob: 0.04, tilt: 3, grow: 0.05, squeeze: 0.1, drift: 0.04 } };
// cut from card by someone in a hurry
export const Cutout = { args: { wobble: 0.3, grain: 3.5, bob: 0.14, tilt: 14, grow: 0.2, squeeze: 0.25, drift: 0.14 } };
