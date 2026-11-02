// Meadow Flower: the flower scattered through the xylophone's grass, a
// tulip-cupped head on a stem with two leaves (src/xylophone/meadow.js).
// The meadow is a scatter of these at random sizes; `scale` is one of them,
// starting at 1 — about a character's shoulder — fitted to the characters
// (XYLO_FIT in stories/helpers/xylophone.jsx; it was 3).
import { Built } from "./helpers/xylophone.jsx";
import { buildMeadowFlower, FLOWERS } from "../src/xylophone/meadow.js";

export default {
  title: "Nature/Plants/Meadow Flower",
  argTypes: {
    scale: { control: { type: "range", min: 0.2, max: 4, step: 0.1 } },
    color: { control: "select", options: FLOWERS.colors },
  },
  args: { scale: 1, color: FLOWERS.colors[0] },
  render: (a) => <Built build={(scene, tools) => scene.add(buildMeadowFlower(tools, a.scale, a.color))} />,
};

export const Default = {};
