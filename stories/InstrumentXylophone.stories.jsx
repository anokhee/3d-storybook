// Xylophone: the toy xylophone: 25 rainbow bars fanned round a half circle on a wooden pull-along plate on wheels, with its cord and bead.
// From the xylophone project (src/xylophone/instruments.js), stood on the
// stage by stories/helpers/xylophone.jsx. Its settings are in
// src/xylophone/xylophone.js.
import { Built } from "./helpers/xylophone.jsx";
import { buildXylophone } from "../src/xylophone/instruments.js";

export default {
  title: "Instruments/Xylophone",
  render: () => <Built build={buildXylophone} />,
};

export const Default = {};
