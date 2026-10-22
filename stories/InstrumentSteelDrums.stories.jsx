// Steel Drums: steel drums: chrome pans round the arc, each a dish holding a run of notes as pads, on legs.
// From the xylophone project (src/xylophone/instruments.js), stood on the
// stage by stories/helpers/xylophone.jsx. Its settings are in
// src/xylophone/steeldrum.js.
import { Built } from "./helpers/xylophone.jsx";
import { buildSteelDrums } from "../src/xylophone/instruments.js";

export default {
  title: "Instruments/Steel Drums",
  render: () => <Built build={buildSteelDrums} />,
};

export const Default = {};
