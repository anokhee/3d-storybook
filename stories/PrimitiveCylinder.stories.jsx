// Cylinder: a drum, standing on the ground. One of the shapes a garland's
// `festoon.type` can name, here without its string. Every primitive story
// shares stories/helpers/hung.jsx (Standing).
import { Standing } from "./helpers/hung.jsx";
import { LIGHT_TYPES } from "../src/adjectives/lit/objects.js";

export default {
  title: "Primitives/Cylinder",
  argTypes: {
    color: { control: "color" },
    radius: { control: { type: "range", min: 0.2, max: 2, step: 0.05 } },
    // unlit, lit (a halo round it) or glowing (lit from inside).
    light: { control: "radio", options: LIGHT_TYPES },
    brightness: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
  },
  args: { color: "#FFFFFF", radius: 0.6, light: "unlit", brightness: 1 },
  render: (a) => <Standing shape="cylinder" radius={a.radius} color={a.color} light={a.light} brightness={a.brightness} />,
};

export const Default = {};
