import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { LIGHT } from "../../adjectives/lit/objects.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import Primitive from "../primitive/Primitive.jsx";
import { useBody } from "../planet/OnPlanet.jsx";
import { registerSolid, unregisterSolid } from "../../player/solids.js";
import { TABLE } from "./objects.js";

// The top's corners, as points round its middle in x/y, going round from
// the front: `sides` of them on an oval `width` by `length`, the first
// half a side round, so a side faces front and four make a rectangle.
// `inset` draws them in from the edge, for the legs.
const cornersOf = (T, inset = 0) => {
  const n = Math.max(3, Math.round(T.sides));
  const rx = Math.max(0.05, T.width / 2 - inset);
  const ry = Math.max(0.05, T.length / 2 - inset);
  return Array.from({ length: n }, (_, i) => {
    const a = Math.PI / 2 + Math.PI / n + (i * 2 * Math.PI) / n;
    return { x: Math.cos(a) * rx, y: Math.sin(a) * ry };
  });
};

// Where the legs stand, in x/z on the ground: spaced evenly round the
// top's edge, `inset` in — or one alone in the middle.
const legSpotsOf = (T, G) => {
  const n = Math.max(1, Math.round(G.count));
  if (n === 1) return [{ x: 0, z: 0 }];
  const rx = Math.max(0, T.width / 2 - G.inset);
  const ry = Math.max(0, T.length / 2 - G.inset);
  const sides = Math.max(3, Math.round(T.sides));
  return Array.from({ length: n }, (_, i) => {
    // Under the corners when there are as many legs as sides; spaced
    // round from the same start otherwise.
    const a = Math.PI / 2 + Math.PI / sides + (i * 2 * Math.PI) / n;
    return { x: Math.cos(a) * rx, z: Math.sin(a) * ry };
  });
};

// How tall the table stands off its ground, for the posts to clear.
export function tableHeightOf(C) {
  return C.legs.height + C.top.thickness;
}

// How far out from its middle it spreads, across (x) and along (z), for
// the grass to keep back from: the top's edges.
export function tableFootprintOf(C) {
  return { x: C.top.width / 2, z: C.top.length / 2 };
}

// One table, standing on the ground at y = 0 with its front facing +z.
// `config` overrides any of TABLE's fields for this one instance.
export default function Table({ config }) {
  const C = useMemo(() => merge(TABLE, config), [config]);
  const T = C.top;
  const G = C.legs;

  // Solid to the player up to its top: registered by where it actually
  // IS, so it may sit anywhere in the tree — a box the top's size.
  const root = useRef();
  const ball = useBody();
  useEffect(() => {
    const at = new THREE.Vector3();
    const turn = new THREE.Quaternion();
    root.current.updateWorldMatrix(true, false);
    root.current.getWorldPosition(at);
    root.current.getWorldQuaternion(turn);
    at.sub(ball.center);
    const solid = registerSolid({
      body: ball,
      dir: at.clone().normalize(),
      top: at.length() - ball.radius + tableHeightOf(C),
      frame: turn,
      halfWidth: T.width / 2,
      halfLength: T.length / 2,
    });
    return () => unregisterSolid(solid);
  }, [C, T, ball]);

  const top = useMemo(() => {
    const shape = new THREE.Shape();
    cornersOf(T).forEach(({ x, y }, i) =>
      i ? shape.lineTo(x, y) : shape.moveTo(x, y),
    );
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: T.thickness,
      bevelEnabled: false,
    });
    // Drawn in x/y and pulled up along +z; laid flat, y up, its
    // underside on the legs' tops. Its y ran up the page, so it lies
    // down -z: turned so the front side faces +z.
    g.rotateX(Math.PI / 2);
    g.translate(0, T.thickness, 0);
    return g;
  }, [T]);
  useEffect(() => () => top.dispose(), [top]);
  const legForm = useMemo(() => ({ tall: G.height / (2 * G.radius) }), [G]);
  const spots = useMemo(() => legSpotsOf(T, G), [T, G]);
  return (
    <group ref={root}>
      <mesh geometry={top} position-y={G.height} material={unlitMat(T.color)} />
      {spots.map(({ x, z }, i) => (
        <group key={i} position={[x, G.height / 2, z]}>
          <Primitive
            shape={G.shape}
            radius={G.radius}
            detail={G.detail}
            form={legForm}
            clay={G.clay}
            swatch={G.color}
            light={LIGHT}
          />
        </group>
      ))}
    </group>
  );
}
