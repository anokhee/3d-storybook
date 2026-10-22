// Hexagram: a six-point star, hung from a string and facing you. One of the shapes a
// garland's `festoon.type` can name. Every ornament story shares
// stories/helpers/hung.jsx; to change how they hang, edit that.
import { Hung } from "./helpers/hung.jsx";
import { LIGHT_TYPES } from "../src/adjectives/lit/objects.js";

export default {
  title: "Ornaments/Hexagram",
  // Seen from the front, so a flat one is flat-on (see stage.jsx).
  parameters: { stage: { view: "front" } },
  argTypes: {
    color: { control: "color" },
    radius: { control: { type: "range", min: 0.2, max: 2, step: 0.05 } },
    // unlit, lit (a halo round it) or glowing (lit from inside).
    light: { control: "radio", options: LIGHT_TYPES },
    brightness: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
  },
  args: { color: "#FFE27A", radius: 0.6, light: "unlit", brightness: 1 },
  render: (a) => <Hung shape="hexagram" radius={a.radius} color={a.color} light={a.light} brightness={a.brightness} />,
};

export const Default = {};
