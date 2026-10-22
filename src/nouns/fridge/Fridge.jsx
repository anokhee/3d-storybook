import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { LIGHT } from "../../adjectives/lit/objects.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import Primitive from "../primitive/Primitive.jsx";
import { roundedRect } from "../water/Pad.jsx";
import { useBody } from "../planet/OnPlanet.jsx";
import { registerSolid, unregisterSolid } from "../../player/solids.js";
import { FRIDGE } from "./objects.js";

// How tall the fridge stands off its ground, for the posts to clear.
export function fridgeHeightOf(F) {
  return F.body.height;
}

// How far out from its middle it spreads, across (x) and along (z), for
// the grass to keep back from: the body, and the doors on the front.
export function fridgeFootprintOf(F) {
  return {
    x: F.body.width / 2,
    z: F.body.depth / 2 + F.doors.thickness + F.handle.out,
  };
}

// One fridge, standing on the ground at y = 0 with its front facing +z.
// `config` overrides any of FRIDGE's fields for this one instance.
export default function Fridge({ config }) {
  const F = useMemo(() => merge(FRIDGE, config), [config]);
  const B = F.body;
  const D = F.doors;
  const H = F.handle;

  // Solid to the player up to its top: registered by where it actually
  // IS, so it may sit anywhere in the tree — a box its size.
  const root = useRef();
  const ball = useBody();
  useEffect(() => {
    const at = new THREE.Vector3();
    const turn = new THREE.Quaternion();
    root.current.updateWorldMatrix(true, false);
    root.current.getWorldPosition(at);
    root.current.getWorldQuaternion(turn);
    at.sub(ball.center);
    const f = fridgeFootprintOf(F);
    const solid = registerSolid({
      body: ball,
      dir: at.clone().normalize(),
      top: at.length() - ball.radius + B.height,
      frame: turn,
      halfWidth: f.x,
      halfLength: f.z,
    });
    return () => unregisterSolid(solid);
  }, [F, B.height, ball]);

  // The body: its plan pulled up, laid flat with its foot on the ground.
  const body = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(
      roundedRect(B.width, B.depth, B.cornerRadius),
      { depth: B.height, bevelEnabled: false, curveSegments: 8 },
    );
    g.rotateX(-Math.PI / 2);
    return g;
  }, [B]);
  useEffect(() => () => body.dispose(), [body]);
  // The two doors, from the top down: the freezer `split` of the height,
  // the fridge the rest, with the gap between them. No split, and it is
  // one door all the way down.
  const doors = useMemo(() => {
    const width = B.width - 2 * D.inset;
    const tall = B.height - 2 * D.inset;
    const split = THREE.MathUtils.clamp(D.split, 0, 1);
    const upper = tall * split - D.gap / 2;
    const lower = tall * (1 - split) - D.gap / 2;
    const heights = split <= 0 || split >= 1 ? [tall] : [upper, lower];
    let y = B.height - D.inset;
    return heights
      .filter((h) => h > 0.01)
      .map((h) => {
        const mid = y - h / 2;
        y -= h + D.gap;
        return { width, height: h, y: mid };
      });
  }, [B, D]);
  return (
    <group ref={root}>
      <mesh geometry={body} material={unlitMat(F.colors.body)} />
      {doors.map((door, i) => (
        <group key={i} position={[0, door.y, B.depth / 2 + D.thickness / 2]}>
          <mesh material={unlitMat(F.colors.door)}>
            <boxGeometry args={[door.width, door.height, D.thickness]} />
          </mesh>
          {/* The handle down its near edge, standing off its face. */}
          <group
            position={[door.width / 2 - H.inset, 0, D.thickness / 2 + H.out]}
          >
            <Primitive
              shape="cylinder"
              radius={H.radius}
              form={{
                tall: (door.height * H.length) / (2 * H.radius),
              }}
              swatch={F.colors.handle}
              light={LIGHT}
            />
          </group>
        </group>
      ))}
    </group>
  );
}
