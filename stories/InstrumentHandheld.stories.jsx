// Handheld: the handheld: a gray base with a magenta button for every note, and a giant console behind with its screen.
// From the xylophone project (src/xylophone/instruments.js), stood on the
// stage by stories/helpers/xylophone.jsx. Its settings are in
// src/xylophone/gameboy.js.
import { Built } from "./helpers/xylophone.jsx";
import { buildHandheld } from "../src/xylophone/instruments.js";

export default {
  title: "Instruments/Handheld",
  render: () => <Built build={buildHandheld} />,
};

export const Default = {};
