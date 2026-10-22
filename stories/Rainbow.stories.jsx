// Rainbow: the xylophone's rainbow, stood up as a cardboard standee the way
// the refactored page puts it behind the blob: a half ring of bands made thin
// like card, in five of the keys' colors (red to blue, outside in), held up
// from behind each leg by an easel, a vertical stick up its back and a
// triangle of card on the ground behind it, in the xylophone's sage
// (src/xylophone/rainbow.js, buildRainbowStandee and STANDEE). Orbit round
// to see the easels.
import { Built } from "./helpers/xylophone.jsx";
import { buildRainbowStandee, STANDEE } from "../src/xylophone/rainbow.js";

const one = (a) => (scene, tools) =>
  buildRainbowStandee(scene, tools, 0, 0, { ...STANDEE, radius: a.radius, band: a.band, thick: a.thick, stick: a.stick, depth: a.depth });

export default {
  title: "Nature/Rainbow",
  // Seen from the front, so the arc is an arc.
  parameters: { stage: { view: "front" } },
  argTypes: {
    radius: { control: { type: "range", min: 5, max: 16, step: 0.5 } },
    band: { control: { type: "range", min: 0.2, max: 2, step: 0.05 }, name: "band width" },
    thick: { control: { type: "range", min: 0.05, max: 1, step: 0.01 }, name: "thickness" },
    stick: { control: { type: "range", min: 1, max: 10, step: 0.25 }, name: "easel height" },
    depth: { control: { type: "range", min: 0.5, max: 6, step: 0.25 }, name: "easel depth" },
  },
  args: { radius: STANDEE.radius, band: STANDEE.band, thick: STANDEE.thick, stick: STANDEE.stick, depth: STANDEE.depth },
  render: (a) => <Built build={one(a)} center={false} />,
};

export const Default = {};
