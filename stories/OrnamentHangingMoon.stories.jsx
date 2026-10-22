// Hanging Moon: a puffy crescent, tipped a little the way a picture book's
// moon is, on a cord that runs up out of sight, bobbing and turning in the
// breeze; it hangs high on the left of the xylophone's stage
// (src/xylophone/hangingsky.js). The cord is shortened here so it stays in
// the frame.
import { Built } from "./helpers/xylophone.jsx";
import { buildHangingMoon, HANGING_SKY } from "../src/xylophone/hangingsky.js";

const one = (a) => (scene, tools) => {
  const { animate } = buildHangingMoon(scene, tools, 0, 0, {
    y: a.height,
    H: { ...HANGING_SKY, moon: { ...HANGING_SKY.moon, r: a.radius, cut: a.cut, color: a.color }, cord: a.cord, wind: a.breeze ? 1 : 0 },
  });
  return { animate: (now, dt) => animate(now * 1000, dt) };
};

export default {
  title: "Ornaments/Hanging Moon",
  parameters: { stage: { view: "front" } },
  argTypes: {
    color: { control: "color" },
    radius: { control: { type: "range", min: 0.5, max: 3, step: 0.05 } },
    cut: { control: { type: "range", min: 0.2, max: 0.9, step: 0.05 }, name: "bite (thinner higher)" },
    height: { control: { type: "range", min: 2, max: 12, step: 0.5 }, name: "hangs at (its top)" },
    cord: { control: { type: "range", min: 0, max: 60, step: 1 }, name: "cord length" },
    breeze: { control: "boolean" },
  },
  args: { color: HANGING_SKY.moon.color, radius: HANGING_SKY.moon.r, cut: HANGING_SKY.moon.cut, height: 5, cord: 6, breeze: true },
  render: (a) => <Built build={one(a)} center={false} />,
};

export const Default = {};
