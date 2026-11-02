// Street Lamp: a lit lamp post — an arm reaching out with a dome shade over
// the bulb, or a lantern on top of the post. Its defaults are STREET_LAMP in
// src/nouns/streetLamp/objects.js; the style knob switches between the two.
import StreetLamp from "../src/nouns/streetLamp/StreetLamp.jsx";
import { STREET_LAMP, STREET_LAMP_KNOBS } from "../src/nouns/streetLamp/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(STREET_LAMP, STREET_LAMP_KNOBS, {}, {});

export default {
  title: "Lighting/Street Lamp",
  component: StreetLamp,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <StreetLamp config={K.configOf(a)} />,
};

export const Default = {};
export const Lantern = { args: { style: "lantern" } };
