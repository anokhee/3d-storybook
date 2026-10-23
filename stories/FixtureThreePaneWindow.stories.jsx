// Three-Pane Window: a square-topped window divided into three panes by bars,
// with the house's moulding round it, on a piece of wall. More or fewer panes
// are a knob (stories/helpers/windows.jsx).
import { indoorWindow } from "./helpers/windows.jsx";

const W = indoorWindow({ height: 1.9, panes: 3 });

export default {
  title: "Fixtures/Windows/Three-Pane Window",
  component: W.component,
  parameters: W.parameters,
  argTypes: W.argTypes,
  args: W.args,
  render: W.render,
};

export const Default = {};
