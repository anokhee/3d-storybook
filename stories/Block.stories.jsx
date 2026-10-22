// Block: one of the wooden toy blocks piled behind the xylophone
// (src/xylophone/blocks.js builds the piles; this is one block, in one of
// BLOCKS.colors). `size` is its edge, in world units.
import * as THREE from "three";
import { Built } from "./helpers/xylophone.jsx";
import { BLOCKS } from "../src/xylophone/blocks.js";

const one = (size, color) => (scene, { toonMat, inked }) => {
  const block = inked(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), toonMat(color)));
  block.scale.setScalar(size);
  block.position.y = size / 2;
  scene.add(block);
};

export default {
  title: "Toys/Block",
  argTypes: {
    size: { control: { type: "range", min: 0.5, max: 4, step: 0.1 } },
    color: { control: "select", options: BLOCKS.colors },
  },
  args: { size: 2, color: BLOCKS.colors[0] },
  render: (a) => <Built build={one(a.size, a.color)} />,
};

export const Default = {};
