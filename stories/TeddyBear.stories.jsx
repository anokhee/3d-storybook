// Teddy Bear: one of the teddies that sit in rows behind the xylophone
// (src/xylophone/teddies.js builds the whole audience; this keeps the
// first bear and stands it at the origin). See stories/helpers/xylophone.jsx.
import { Built } from "./helpers/xylophone.jsx";
import { buildTeddies } from "../src/xylophone/teddies.js";

const one = (scene, tools) => {
  const { group } = buildTeddies(scene, tools, 0, 0);
  const bear = group.children[0];
  [...group.children].slice(1).forEach((c) => group.remove(c));
  bear.position.set(0, 0, 0);
  bear.rotation.set(0, 0, 0);
};

export default {
  title: "Toys/Teddy Bear",
  render: () => <Built build={one} />,
};

export const Default = {};
