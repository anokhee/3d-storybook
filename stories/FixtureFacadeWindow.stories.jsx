// Facade Window: one of the two on the front of the house, on a piece of
// wall: the lit pane in its frame. Width, height, the frame and the light
// are its knobs; the tall, wide and small ones are those, not entries of
// their own (stories/helpers/windows.jsx).
import { facadeWindow } from "./helpers/windows.jsx";

const W = facadeWindow();

export default {
  title: "Fixtures/Windows/Facade Window",
  component: W.component,
  parameters: W.parameters,
  argTypes: W.argTypes,
  args: W.args,
  render: W.render,
};

export const Default = {};
