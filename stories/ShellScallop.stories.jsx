// Scallop Shell: a fan of ribs from a straight hinge, domed, with a wavy rim, one of the shells
// scattered over the xylophone's beach (src/xylophone/island.js). Its
// stripes and rings are vertex colors over the shell's own color, one of
// COLOR_PALETTE.shells. About a unit across at `scale` 1, where it starts
// — fitted to the characters (XYLO_FIT in stories/helpers/xylophone.jsx; it was 3).
import * as THREE from "three";
import { Built } from "./helpers/xylophone.jsx";
import { scallopGeo } from "../src/xylophone/island.js";
import { COLOR_PALETTE } from "../src/xylophone/palette.js";

const one = (scale, color) => (scene, { toonMat, inked }) => {
  const mat = toonMat(0xffffff).clone();
  mat.color.set(color);
  mat.side = THREE.DoubleSide;
  mat.vertexColors = true;
  const shell = inked(new THREE.Mesh(scallopGeo(), mat));
  shell.scale.setScalar(scale);
  // stood on the ground: its lowest point to y = 0
  shell.geometry.computeBoundingBox();
  shell.position.y = -shell.geometry.boundingBox.min.y * scale;
  scene.add(shell);
};

export default {
  title: "Nature/Groundcover/Scallop Shell",
  argTypes: {
    scale: { control: { type: "range", min: 0.2, max: 4, step: 0.1 } },
    color: { control: "select", options: COLOR_PALETTE.shells },
  },
  args: { scale: 1, color: COLOR_PALETTE.shells[0] },
  render: (a) => <Built build={one(a.scale, a.color)} />,
};

export const Default = {};
