// Hanging Star: a puffy five-point star on a cord that runs up out of
// sight, bobbing and turning in the breeze, made to hang beside the hanging
// clouds on the xylophone's stage (src/xylophone/hangingstars.js). The cord
// is shortened here so it stays in the frame.
import { Built } from "./helpers/xylophone.jsx";
import { buildHangingStar, HANGING_STAR } from "../src/xylophone/hangingstars.js";

const one = (a) => (scene, tools) => {
  const { animate } = buildHangingStar(scene, tools, 0, 0, { y: a.height, r: a.radius, H: { ...HANGING_STAR, color: a.color, cord: a.cord, wind: a.breeze ? 1 : 0 } });
  // the stage's clock runs in seconds; the star counts milliseconds
  return { animate: (now, dt) => animate(now * 1000, dt) };
};

export default {
  title: "Ornaments/Hanging Star",
  parameters: { stage: { view: "front" } },
  argTypes: {
    color: { control: "color" },
    radius: { control: { type: "range", min: 0.3, max: 2, step: 0.05 } },
    height: { control: { type: "range", min: 1, max: 12, step: 0.5 }, name: "hangs at" },
    cord: { control: { type: "range", min: 0, max: 60, step: 1 }, name: "cord length" },
    breeze: { control: "boolean" },
  },
  args: { color: HANGING_STAR.color, radius: 0.7, height: 4, cord: 8, breeze: true },
  render: (a) => <Built build={one(a)} center={false} />,
};

export const Default = {};
