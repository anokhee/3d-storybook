// Dolly: the doll from the dollies project. A POLYMORPHIC object: one doll
// dealt from a head (a veggie), a body, limbs, what grows on its head,
// skin, a color and a seed (src/renderGrid/buildOneDolly.js). "Default" is
// the base dolly: a pear head on a round body, bead limbs, butter yellow,
// with ball-tipped antennae (BASE in stories/helpers/dolly.jsx); flip
// "randomize" and the whole doll is rolled again; flip "grid" and it is a
// wall of them, every head twice, the way the project's grid does, on a
// wide ground seen from above. Tagged `polymorphic`, so the sidebar can
// filter to objects like it.
import { DollyFigure, DollyGrid } from "./helpers/dolly.jsx";

// Counts the flips of the switch, so every change is a new roll.
const flips = new Map();
function rollOf(id, value) {
  const prev = flips.get(id);
  if (!prev || prev.value !== value) flips.set(id, { value, n: (prev?.n ?? 0) + (prev ? 1 : 0) });
  return flips.get(id).n;
}

export default {
  title: "Characters/Dolly",
  tags: ["polymorphic"],
  argTypes: { randomize: { control: "boolean" }, grid: { control: "boolean", name: "a grid of them" } },
  args: { randomize: false, grid: false },
  // The grid wants the wide ground and the top view (see preview.jsx).
  parameters: { stage: (a) => (a.grid ? { ground: "wide", view: "top" } : {}) },
  // The base dolly, or sixteen of them; each flip of the randomize switch
  // a new roll of the lot.
  render: (a, { id }) => (a.grid ? <DollyGrid roll={rollOf(id, a.randomize) + 1} /> : <DollyFigure roll={rollOf(id, a.randomize)} />),
};

export const Default = {};
