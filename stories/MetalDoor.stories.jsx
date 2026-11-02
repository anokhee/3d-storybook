// Metal Door: the swing door into a restaurant's kitchen — brushed steel,
// a porthole (or a rounded square) of glass high up with a steel ring
// round it, a kick plate across its foot and a push plate, on both faces;
// hung in an archway with a moulding round it on both faces, as the
// dollies' archways are framed. `open` swings it either way. Its defaults
// are METAL_DOOR in src/nouns/metalDoor/objects.js. Set in a stretch of
// wall with the doorway cut through it. The café's kitchen door is one
// (Shopfronts/Shop Interior).
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import MetalDoor, { archOutline } from "../src/nouns/metalDoor/MetalDoor.jsx";
import { METAL_DOOR, METAL_DOOR_KNOBS } from "../src/nouns/metalDoor/objects.js";
import { unlitMat } from "../src/adjectives/unlit/material.js";
import { PALETTE } from "../src/world/palette.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(METAL_DOOR, METAL_DOOR_KNOBS);

// a wall `w` wide and `h` tall, `t` thick about z = 0, the doorway cut up from its foot
function Wall({ w, h, t, door }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape().moveTo(-w / 2, 0);
    archOutline(s, -door.width / 2, door.width / 2, door.height, door.curve);
    s.lineTo(w / 2, 0).lineTo(w / 2, h).lineTo(-w / 2, h).closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 28 });
    g.translate(0, 0, -t / 2);
    return g;
  }, [w, h, t, door.width, door.height, door.curve]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={unlitMat(PALETTE.house.walls)} receiveShadow />;
}

export default {
  title: "Fixtures/Doors/Metal Door",
  component: MetalDoor,
  parameters: { stage: { view: "front" } },
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => {
    const C = K.configOf(a), door = { ...METAL_DOOR, ...C };
    return (
      <>
        <Wall w={door.width + 2.5} h={door.height + 1} t={METAL_DOOR.wall} door={door} />
        <MetalDoor config={C} />
      </>
    );
  },
};

export const Default = {};
export const Ajar = { args: { open: 0.4 } };
export const Square = { name: "Square Window", args: { windowShape: "square", windowSize: 0.28 } };
export const Flat = { name: "Flat Head", args: { curve: 0 } };
