// Jack-in-the-Box: one of the row of boxes behind the xylophone, a
// decorated box with a crank, a lid that flips back and a clown on a
// spring (src/xylophone/jacks.js builds the row; this keeps the first).
// `open` pops it: the game's own animation is run until the spring has
// settled, then held there. See stories/helpers/xylophone.jsx.
import { Built } from "./helpers/xylophone.jsx";
import { buildJacks } from "../src/xylophone/jacks.js";

const one = (open) => (scene, tools) => {
  const jacks = buildJacks(scene, tools, 0, 0);
  const root = jacks.group.children[0];
  [...jacks.group.children].slice(1).forEach((c) => jacks.group.remove(c));
  root.position.x = 0;
  root.position.z = 0;
  if (open) {
    jacks.pop(0);
    for (let t = 0; t < 1.6; t += 1 / 60) jacks.animate(1 / 60); // lid back, spring out, bounce settled
  }
};

export default {
  title: "Toys/Jack-in-the-Box",
  argTypes: { open: { control: "boolean" } },
  args: { open: true },
  render: (a) => <Built build={one(a.open)} />,
};

export const Default = {};
