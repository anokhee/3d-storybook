// Window Box: a trough of soil with a row of plants in it — the cupcake
// house's, now the shopfronts' too — growing any of the pot plant's kinds
// (a bush, a leaf, a daisy, a tulip, a poppy). Its defaults are WINDOW_BOX
// in src/nouns/windowBox/objects.js.
import WindowBox from "../src/nouns/windowBox/WindowBox.jsx";
import { WINDOW_BOX, WINDOW_BOX_KNOBS } from "../src/nouns/windowBox/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(WINDOW_BOX, WINDOW_BOX_KNOBS, {}, {});

export default {
  title: "Fixtures/Window Box",
  component: WindowBox,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <WindowBox config={K.configOf(a)} />,
};

export const Default = {};
