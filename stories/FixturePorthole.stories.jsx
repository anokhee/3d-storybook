// Porthole: a round window, top and bottom both a half-round, one clear pane
// in its bezel and moulding, on a piece of wall. Panes are a knob
// (stories/helpers/windows.jsx).
import { indoorWindow } from "./helpers/windows.jsx";

const W = indoorWindow({ width: 1.2, height: 1.2, topCurve: 1, bottomCurve: 1, style: "plain" });

export default {
  title: "Fixtures/Windows/Porthole",
  component: W.component,
  parameters: W.parameters,
  argTypes: W.argTypes,
  args: W.args,
  render: W.render,
};

export const Default = {};
