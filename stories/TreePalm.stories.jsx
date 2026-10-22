// Palm: the steel drums' palm tree, from the xylophone game: a trunk of
// stacked flared rings bending over toward the top, a crown of drooping
// fronds and coconuts under them (buildPalm in src/xylophone/island.js,
// COAST.palm its shape). See stories/helpers/xylophone.jsx.
import { Built } from "./helpers/xylophone.jsx";
import { buildPalm, COAST } from "../src/xylophone/island.js";

const one = (a) => (scene, tools) => {
  const palm = buildPalm({ ...COAST.palm, h: a.height, lean: a.lean, fronds: a.fronds, coconuts: a.coconuts }, COAST.colors, tools.toonMat, tools.inked);
  scene.add(palm);
  return palm;
};

export default {
  title: "Nature/Trees/Palm",
  argTypes: {
    height: { control: { type: "range", min: 2, max: 8, step: 0.1 }, name: "trunk height" },
    lean: { control: { type: "range", min: 0, max: 0.8, step: 0.05 } },
    fronds: { control: { type: "range", min: 3, max: 14, step: 1 } },
    coconuts: { control: { type: "range", min: 0, max: 6, step: 1 } },
  },
  args: { height: COAST.palm.h, lean: COAST.palm.lean, fronds: COAST.palm.fronds, coconuts: COAST.palm.coconuts },
  render: (a) => <Built build={one(a)} center={false} />,
};

export const Default = {};
