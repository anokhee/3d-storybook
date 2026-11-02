// Curtain: a little rod with a knob at each end and a pair of pleated
// panels hanging from it on rings, drawn back as far as `open` says — in
// a colour of its own, or patterned with dots the way the couch's cushions
// and pillows are (Furniture/Seating/Couch), the dots following the folds.
// Its defaults are CURTAIN in src/nouns/curtain/objects.js. The café's
// windows hang them (Shopfronts/Shop Interior, its curtains toggle).
import Curtain from "../src/nouns/curtain/Curtain.jsx";
import { CURTAIN, CURTAIN_KNOBS } from "../src/nouns/curtain/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(CURTAIN, CURTAIN_KNOBS, {}, {});

export default {
  title: "Furniture/Wall Decor/Curtain",
  component: Curtain,
  parameters: { stage: { view: "front" } },
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => {
    const C = K.configOf(a);
    return <group position-y={C.rodHeight ?? CURTAIN.rodHeight}><Curtain config={C} /></group>;
  },
};

export const Default = {};
export const Closed = { args: { open: 0 } };
export const Polka = { name: "Polka Dots", args: { patternLayout: "stagger", color: "#3B6E8F" } };
export const Stars = { args: { patternLayout: "grid", dotSides: 5, dotInner: 0.45, dotRadius: 0.03, color: "#2F2A36", dotColor: "#F2C94C" } };
