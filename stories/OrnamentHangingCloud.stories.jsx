// Hanging Cloud: one of the playroom's clouds, from the xylophone game: a
// few white puffs melted together into one soft shape, on a cord that runs
// up out of sight, bobbing and turning a little in the breeze
// (src/xylophone/hangingclouds.js). `seed` picks its puffs, `melt` how much
// they run together (0 is the game's separate balls); the cord is shortened
// here so it stays in the frame.
import { Built } from "./helpers/xylophone.jsx";
import { buildHangingCloud, HANGING_CLOUD } from "../src/xylophone/hangingclouds.js";
import { mulberry32 } from "../src/world/random.js";

const one = (a) => (scene, tools) => {
  const { animate } = buildHangingCloud(scene, tools, 0, 0, { y: a.height, r: a.radius, rnd: mulberry32(a.seed), H: { ...HANGING_CLOUD, cord: a.cord, wind: a.breeze ? 1 : 0, blend: a.melt } });
  // the stage's clock runs in seconds; the cloud counts milliseconds
  return { animate: (now, dt) => animate(now * 1000, dt) };
};

export default {
  title: "Ornaments/Hanging Cloud",
  argTypes: {
    seed: { control: { type: "range", min: 1, max: 99, step: 1 } },
    radius: { control: { type: "range", min: 0.6, max: 2.5, step: 0.05 }, name: "middle puff" },
    height: { control: { type: "range", min: 1, max: 12, step: 0.5 }, name: "hangs at" },
    melt: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
    cord: { control: { type: "range", min: 0, max: 60, step: 1 }, name: "cord length" },
    breeze: { control: "boolean" },
  },
  args: { seed: 9, radius: 1.3, melt: HANGING_CLOUD.blend, height: 4, cord: 8, breeze: true },
  render: (a) => <Built build={one(a)} center={false} />,
};

export const Default = {};
