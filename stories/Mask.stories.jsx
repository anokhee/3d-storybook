// Mask: the mask a Shadow Spirit wears — a round shell shrink-wrapped onto
// the face, and on it, laid the same way, its design — one mask, every part
// a knob: eyes, nose, ears (or tendrils), paint, and 3D horns (on or off,
// their type, base radius, length and x/y position). Shown on its own
// (larger than life) or worn by a Shadow Spirit.
// Flip "a grid of them" and it is a wall of masks: the plain and the
// horned, then the rest each dealt at random from what the builder can draw
// (dealMask in src/nouns/mask/objects.js); flip "randomize" for a new wall
// (the other knobs do not apply to the grid). Tagged "polymorphic" (in
// public/library-meta.json), as the Dolly and the statue Head are.
// Its designs are MASK_STYLES in src/nouns/mask/objects.js; it is built by
// src/nouns/mask/build.js.
import MaskProp, { MaskGrid } from "../src/nouns/mask/Mask.jsx";
import { MASK, MASK_KNOBS } from "../src/nouns/mask/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(MASK, MASK_KNOBS, {}, {});

// Counts the flips of the randomize switch, so every change is a new roll.
const flips = new Map();
function rollOf(id, value) {
  const prev = flips.get(id);
  if (!prev || prev.value !== value) flips.set(id, { value, n: (prev?.n ?? 0) + (prev ? 1 : 0) });
  return flips.get(id).n;
}

export default {
  title: "Props/Mask",
  component: MaskProp,
  parameters: { stage: { view: "front" } },
  argTypes: { grid: { control: "boolean", name: "a grid of them" }, randomize: { control: "boolean" }, ...K.argTypes },
  args: { grid: false, randomize: false, ...K.args },
  render: ({ grid, randomize, ...a }, { id }) => (grid ? <MaskGrid roll={rollOf(id, randomize)} /> : <MaskProp config={K.configOf(a)} />),
};

export const Mask = {};
