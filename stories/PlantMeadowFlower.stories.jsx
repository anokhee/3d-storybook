// Meadow Flower: the flower scattered through the xylophone's grass, a
// tulip-cupped head on a stem with two leaves (src/xylophone/meadow.js).
// The meadow is a scatter of these at random sizes; `scale` is one of them.
import { Built } from "./helpers/xylophone.jsx";
import { buildMeadowFlower, FLOWERS } from "../src/xylophone/meadow.js";

export default {
  title: "Nature/Plants/Meadow Flower",
  argTypes: {
    scale: { control: { type: "range", min: 0.5, max: 6, step: 0.1 } },
    color: { control: "select", options: FLOWERS.colors },
  },
  args: { scale: 3, color: FLOWERS.colors[0] },
  render: (a) => <Built build={(scene, tools) => scene.add(buildMeadowFlower(tools, a.scale, a.color))} />,
};

export const Default = {};
