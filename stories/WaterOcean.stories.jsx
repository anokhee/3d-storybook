// Ocean: a stretch of the albatross's sea, in the pond's shape. The game's
// sea is one sheet to the horizon with a lace of foam over it, cut by a
// shader keyed to the islands' shores; the dollies' ponds wear their foam
// the same way (the field's code says so), so the ocean is the dollies'
// water in the sea's colors: its water (see-through, matte, no mirror of
// the sky) and its foam (the dusk sky, lifted), from src/albatross/palette.js.
import { WaterFeature } from "./helpers/water.jsx";
import { solid } from "../src/world/palette.js";
import { PALETTE as SEA } from "../src/albatross/palette.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");
const OCEAN = {
  color: solid(hex(SEA.water)),
  alpha: 0.7,
  gloss: { reflect: 0, roughness: 1, moon: 0 }, // matte, as the field has it
  // the pond's two foam layers, in the sea's foam color
  foam: [{ color: solid(hex(SEA.foam)) }, { rim: 0.6, cover: 0.3, scale: 0.55, drift: -0.08, lift: 0.03, alpha: 0.6, color: solid(hex(SEA.foam)) }],
};

export default {
  title: "Nature/Water/Ocean",
  parameters: { stage: { ground: "planet" } },
  argTypes: {
    width: { control: { type: "range", min: 4, max: 30, step: 0.5 } },
    length: { control: { type: "range", min: 4, max: 30, step: 0.5 } },
  },
  args: { width: 20, length: 15 },
  render: (a) => <WaterFeature kind="pond" config={{ ...OCEAN, width: a.width, length: a.length }} lift={0} />,
};

export const Default = {};
