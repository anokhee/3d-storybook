// Hanging Sun: a puffy disc ringed with rounded rays in a paler yellow, on
// a cord that runs up out of sight, bobbing and turning in the breeze; it
// hangs high on the right of the xylophone's stage
// (src/xylophone/hangingsky.js). The cord is shortened here so it stays in
// the frame.
import { Built } from "./helpers/xylophone.jsx";
import { buildHangingSun, HANGING_SKY } from "../src/xylophone/hangingsky.js";

const one = (a) => (scene, tools) => {
  const { animate } = buildHangingSun(scene, tools, 0, 0, {
    y: a.height,
    H: { ...HANGING_SKY, sun: { ...HANGING_SKY.sun, r: a.radius, rays: a.rays, ray: a.ray, color: a.color, rayColor: a.rayColor }, cord: a.cord, wind: a.breeze ? 1 : 0 },
  });
  return { animate: (now, dt) => animate(now * 1000, dt) };
};

export default {
  title: "Ornaments/Hanging Sun",
  parameters: { stage: { view: "front" } },
  argTypes: {
    color: { control: "color", name: "disc" },
    rayColor: { control: "color", name: "rays" },
    radius: { control: { type: "range", min: 0.4, max: 2.5, step: 0.05 } },
    rays: { control: { type: "range", min: 4, max: 16, step: 1 }, name: "how many rays" },
    ray: { control: { type: "range", min: 0.2, max: 1.2, step: 0.05 }, name: "ray length" },
    height: { control: { type: "range", min: 2, max: 12, step: 0.5 }, name: "hangs at (its top)" },
    cord: { control: { type: "range", min: 0, max: 60, step: 1 }, name: "cord length" },
    breeze: { control: "boolean" },
  },
  args: { color: HANGING_SKY.sun.color, rayColor: HANGING_SKY.sun.rayColor, radius: HANGING_SKY.sun.r, rays: HANGING_SKY.sun.rays, ray: HANGING_SKY.sun.ray, height: 5, cord: 6, breeze: true },
  render: (a) => <Built build={one(a)} center={false} />,
};

export const Default = {};
