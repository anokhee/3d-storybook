// Hanging Raindrops: a strand of teardrops, point up, strung one under
// another on a cord that runs up out of sight, each a little smaller than
// the one above, in two of the keys' blues; on the xylophone's stage they
// hang under the front clouds as if it were raining from them
// (src/xylophone/hangingsky.js). The cord is shortened here so it stays in
// the frame.
import { Built } from "./helpers/xylophone.jsx";
import { buildHangingRain, HANGING_SKY } from "../src/xylophone/hangingsky.js";

const one = (a) => (scene, tools) => {
  const { animate } = buildHangingRain(scene, tools, 0, 0, {
    y: a.height,
    H: { ...HANGING_SKY, rain: { ...HANGING_SKY.rain, r: a.radius, drops: a.drops, gap: a.gap, colors: [a.color, a.color2] }, cord: a.cord, wind: a.breeze ? 1 : 0 },
  });
  return { animate: (now, dt) => animate(now * 1000, dt) };
};

export default {
  title: "Ornaments/Hanging Raindrops",
  parameters: { stage: { view: "front" } },
  argTypes: {
    color: { control: "color", name: "drops" },
    color2: { control: "color", name: "every other drop" },
    radius: { control: { type: "range", min: 0.1, max: 1, step: 0.02 }, name: "top drop" },
    drops: { control: { type: "range", min: 1, max: 8, step: 1 } },
    gap: { control: { type: "range", min: 0, max: 5, step: 0.1 } },
    height: { control: { type: "range", min: 2, max: 12, step: 0.5 }, name: "hangs at (its top)" },
    cord: { control: { type: "range", min: 0, max: 60, step: 1 }, name: "cord length" },
    breeze: { control: "boolean" },
  },
  args: { color: HANGING_SKY.rain.colors[0], color2: HANGING_SKY.rain.colors[1], radius: HANGING_SKY.rain.r, drops: HANGING_SKY.rain.drops, gap: HANGING_SKY.rain.gap, height: 5, cord: 6, breeze: true },
  render: (a) => <Built build={one(a)} center={false} />,
};

export const Default = {};
