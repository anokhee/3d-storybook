// Sign: the blank board as it was made, and one that says something — its
// `text` is the library's Lettering (Buildings/Lettering), with that
// entry's knobs here under it. Its defaults live in src/nouns/sign/objects.js.
import Sign from "../src/nouns/sign/Sign.jsx";
import { SIGN } from "../src/nouns/sign/objects.js";
import { LETTERING, LETTERING_KNOBS, STRAIGHT } from "../src/nouns/lettering/objects.js";
import { knobStory } from "./helpers/knobs.js";

export default {
  title: "Buildings/Sign",
  component: Sign,
  // No overrides: the component merges this over its own defaults.
  render: () => <Sign config={{}} />,
};

export const Default = {};

// the same board, writing: the lettering's knobs, the word first (`size`
// is no knob here — the board sizes its lettering, see SIGN.fit), starting
// with the font's glyphs as they come, as the shopfronts' signs have them
const { size: _size, ...TEXT_KNOBS } = LETTERING_KNOBS;
const K = knobStory(LETTERING, TEXT_KNOBS, {}, STRAIGHT);
export const Cafe = {
  name: "Café",
  argTypes: K.argTypes,
  args: K.args,
  parameters: { stage: { view: "front" } }, // read square-on
  // (lifted to stand on the ground: a Sign hangs about its middle)
  render: (a) => <group position-y={SIGN.height / 2}><Sign config={{ text: K.configOf(a) }} /></group>,
};
