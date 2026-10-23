// Arched Window: a tall window with a half-round top, divided into panes, with
// the house's moulding round it, on a piece of wall. Plain or tall ones are
// its knobs (panes, style, size; stories/helpers/windows.jsx).
import { indoorWindow } from "./helpers/windows.jsx";

const W = indoorWindow({ height: 2, topCurve: 1 });

export default {
  title: "Fixtures/Windows/Arched Window",
  component: W.component,
  parameters: W.parameters,
  argTypes: W.argTypes,
  args: W.args,
  render: W.render,
};

export const Default = {};
