// Garland: strings of ornaments hung between post tops. On a lot the posts
// come from the enclosure; here six tops stand in a ring on their own so
// the garland has something to hang from.
import * as THREE from "three";
import Garland from "../src/nouns/garland/Garland.jsx";
import { ENCLOSURE } from "../src/nouns/enclosure/objects.js";

const COUNT = 6;
const tops = Array.from({ length: COUNT }, (_, i) => {
  const a = (i / COUNT) * Math.PI * 2;
  return new THREE.Vector3(Math.cos(a) * 5, 3, Math.sin(a) * 5);
});
const ring = { ...ENCLOSURE, count: COUNT };

export default {
  title: "Buildings/Garland",
  component: Garland,
  render: () => <Garland tops={tops} ring={ring} config={{}} />,
};

export const Default = {};
