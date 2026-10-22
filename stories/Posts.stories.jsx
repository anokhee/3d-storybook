// Posts: the fence posts on their own, each with its cap ornament. `stands`
// is where each one is planted (a position and a quaternion, since on the
// planet each leans with its own bit of ground); here six stand upright in
// a ring.
import * as THREE from "three";
import Posts from "../src/nouns/post/Posts.jsx";

const COUNT = 6;
const stands = Array.from({ length: COUNT }, (_, i) => {
  const a = (i / COUNT) * Math.PI * 2;
  return {
    position: new THREE.Vector3(Math.cos(a) * 5, 0, Math.sin(a) * 5),
    quaternion: new THREE.Quaternion(),
  };
});

export default {
  title: "Buildings/Posts",
  component: Posts,
  render: () => <Posts stands={stands} height={3} config={{}} />,
};

export const Default = {};
