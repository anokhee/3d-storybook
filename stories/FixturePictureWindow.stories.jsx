// Picture Window: a big fixed pane in a slim frame, wider than it is tall,
// on a piece of wall. The facade window made large (stories/helpers/windows.jsx).
import { facadeWindow } from "./helpers/windows.jsx";

const W = facadeWindow({ width: 2.6, height: 1.9, frameThickness: 0.1 });

export default {
  title: "Fixtures/Windows/Picture Window",
  component: W.component,
  parameters: W.parameters,
  argTypes: W.argTypes,
  args: W.args,
  render: W.render,
};

export const Default = {};
