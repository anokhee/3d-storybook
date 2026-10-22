import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { hue } from "../../world/palette.js";
import { CEL } from "../../adjectives/unlit/toon.js";
import { useBody } from "../planet/OnPlanet.jsx";
import { registerSolid, unregisterSolid } from "../../player/solids.js";
import { TREE } from "./objects.js";
import { treeGeometry } from "./geometry.js";

// One tree, stood on the ground at its origin — see TREE for what it is
// made of, and geometry.js for how. Its trunk is solid to the doll: a
// column it walks into rather than through.
export const treeHeightOf = (T) => treeGeometry(T).top;
export const treeFootprintOf = (T) => {
  const r = treeGeometry(T).reach;
  return { x: r, z: r, round: true };
};
// The canopy's color, by kind; a dead tree has none.
const canopyColorOf = (T) =>
  T.kind === "deciduous" || T.kind === "flowering" ? T.deciduous.color
  : T.kind === "conifer" ? T.conifer.color
  : null;

export default function Tree({ config }) {
  const T = useMemo(() => merge(TREE, config), [config]);
  const { trunk, canopy, blooms } = useMemo(() => treeGeometry(T), [T]);
  const bark = T.kind === "dead" ? T.trunk.deadColor : T.trunk.color;
  const leaf = canopyColorOf(T);

  const root = useRef();
  const ball = useBody();
  useEffect(() => {
    if (!ball) return;
    const at = new THREE.Vector3();
    root.current.getWorldPosition(at);
    at.sub(ball.center);
    const solid = registerSolid({
      body: ball,
      dir: at.clone().normalize(),
      top: at.length() - ball.radius + T.trunk.height - T.sink,
      radius: T.trunk.radius,
    });
    return () => unregisterSolid(solid);
  }, [T, ball]);

  return (
    <group ref={root}>
      <mesh geometry={trunk} castShadow receiveShadow>
        <meshToonMaterial color={hue(bark)} {...CEL} />
      </mesh>
      {canopy && (
        <mesh geometry={canopy} castShadow receiveShadow>
          <meshToonMaterial color={hue(leaf)} {...CEL} />
        </mesh>
      )}
      {/* Petals are cards: both faces drawn. */}
      {blooms && (
        <mesh geometry={blooms} castShadow receiveShadow>
          <meshToonMaterial
            color={hue(T.blooms.color)}
            side={THREE.DoubleSide}
            {...CEL}
          />
        </mesh>
      )}
    </group>
  );
}
